/* eslint-disable @typescript-eslint/no-explicit-any */
import { google } from "googleapis";
import dbConnect from "./mongodb";
import GoogleAuth from "@/models/GoogleAuth";
import { DISTRICT_CODES } from "./constants";
import { decryptSecret } from "./encryption";

export interface ContactData {
  fullName: string;
  phoneNumber: string;
  whatsappNumber: string;
  email?: string;
  address?: string;
  city?: string;
  province?: string;
  companyName?: string;
  installerCode?: string;
  referrerCode?: string;
  cnic?: string;
  district?: string;
}

/**
 * Formats phone number to +92XXXXXXXXXX format
 * Examples:
 *   03001234567 -> +923001234567
 *   +923001234567 -> +923001234567
 *   00923001234567 -> +923001234567
 *   3001234567 -> +923001234567
 */
function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, "");

  // Remove leading + if present
  if (cleaned.startsWith("+")) {
    cleaned = cleaned.substring(1);
  }

  // Remove leading 00 if present
  if (cleaned.startsWith("00")) {
    cleaned = cleaned.substring(2);
  }

  // Remove leading 92 if present (we'll add it back)
  if (cleaned.startsWith("92")) {
    cleaned = cleaned.substring(2);
  }

  // Remove leading 0 if present
  if (cleaned.startsWith("0")) {
    cleaned = cleaned.substring(1);
  }

  // Add +92 prefix
  return `+92${cleaned}`;
}

/**
 * Get district short code from district name
 * Example: "Lahore" -> "LHE"
 */
function getDistrictShort(district?: string): string | null {
  if (!district) return null;
  return DISTRICT_CODES[district] || null;
}

/**
 * Get or create contact group (label) and return its resourceName
 */
async function getOrCreateContactGroup(
  people: any,
  groupName: string
): Promise<string | null> {
  try {
    // List all contact groups
    const groups = await people.contactGroups.list();

    // Find existing group
    const existingGroup = groups.data.contactGroups?.find(
      (group: any) => group.name === groupName
    );

    if (existingGroup?.resourceName) {
      return existingGroup.resourceName;
    }

    // Create new group if doesn't exist
    const newGroup = await people.contactGroups.create({
      requestBody: {
        contactGroup: {
          name: groupName,
        },
      },
    });

    return newGroup.data.resourceName || null;
  } catch (error) {
    console.error(
      `Error getting/creating contact group "${groupName}":`,
      error
    );
    return null;
  }
}

/**
 * Detects a dead refresh token. Google returns `invalid_grant`
 * ("Token has been expired or revoked") once the stored refresh token is no
 * longer usable — the only fix is re-authenticating via the OAuth flow.
 */
function isInvalidGrant(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as any;
  return (
    e?.response?.data?.error === "invalid_grant" ||
    e?.message === "invalid_grant" ||
    /invalid_grant/i.test(typeof e?.message === "string" ? e.message : "")
  );
}

/**
 * Flags the active Google auth record as needing re-authentication so the UI
 * can surface a visible banner instead of silently failing every sync.
 */
async function flagReauthNeeded(reason: string): Promise<void> {
  try {
    await dbConnect();
    await GoogleAuth.updateOne(
      { isActive: true },
      { needsReauth: true, lastError: reason, lastErrorAt: new Date() }
    );
    console.error(
      "⚠ Google Contacts refresh token rejected (invalid_grant). Flagged for re-authentication."
    );
  } catch (e) {
    console.error("Failed to flag Google auth for re-authentication:", e);
  }
}

/**
 * Inspects a caught error and, if it is an invalid_grant, records the re-auth
 * flag. Safe to call from any catch block.
 */
async function handleGoogleAuthError(error: unknown): Promise<void> {
  if (isInvalidGrant(error)) {
    await flagReauthNeeded("invalid_grant");
  }
}

async function getAuthClient() {
  await dbConnect();

  // Find ANY active Google auth (global authentication)
  const googleAuth = await GoogleAuth.findOne({
    isActive: true,
  });

  if (!googleAuth?.refreshToken) {
    console.warn(
      "No active Google auth found. Please authenticate Google Contacts."
    );
    return null;
  }

  // console.log(`Using Google auth for account: ${googleAuth.accountEmail}`);

  const CLIENT_ID =
    process.env.GOOGLE_CONTACTS_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
  const CLIENT_SECRET =
    process.env.GOOGLE_CONTACTS_CLIENT_SECRET ||
    process.env.GOOGLE_CLIENT_SECRET;

  if (!CLIENT_ID || !CLIENT_SECRET) {
    console.error("Google OAuth credentials not configured in environment");
    return null;
  }

  const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    `${process.env.NEXTAUTH_URL}/api/google-auth/callback`
  );

  // Decrypt credentials only here, at the point of use.
  oauth2Client.setCredentials({
    refresh_token: decryptSecret(googleAuth.refreshToken),
    access_token: googleAuth.accessToken
      ? decryptSecret(googleAuth.accessToken)
      : undefined,
  });

  return oauth2Client;
}

/** Result of a proactive Google auth liveness probe (used by the status route). */
export type GoogleAuthLiveness =
  | { status: "authenticated"; accountEmail: string }
  | { status: "needs_reauth"; accountEmail: string; reason: string }
  | { status: "misconfigured"; accountEmail: string; reason: string }
  | { status: "not_authenticated" };

// Don't re-probe Google on every status poll — cache a successful check.
const LIVENESS_THROTTLE_MS = 5 * 60 * 1000;

/**
 * Proactively determine whether the stored Google auth is actually usable,
 * instead of only discovering a dead token when a sync happens to run.
 *
 * Detects three failure modes the status endpoint previously couldn't see:
 *  - revoked/expired refresh token (invalid_grant) → flags needsReauth
 *  - un-decryptable stored token (missing/rotated TOKEN_ENCRYPTION_KEY, corrupt
 *    ciphertext) → reports "misconfigured" (re-auth won't fix a server config bug)
 *  - missing OAuth client credentials → "misconfigured"
 *
 * Throttled: a fresh success is cached for LIVENESS_THROTTLE_MS so page loads
 * don't hammer Google's token endpoint.
 */
export async function verifyGoogleAuthLiveness(): Promise<GoogleAuthLiveness> {
  await dbConnect();

  const googleAuth = await GoogleAuth.findOne({ isActive: true });
  if (!googleAuth?.refreshToken) {
    return { status: "not_authenticated" };
  }

  // Already flagged as dead by a prior sync/probe — report without re-probing.
  if (googleAuth.needsReauth) {
    return {
      status: "needs_reauth",
      accountEmail: googleAuth.accountEmail,
      reason: googleAuth.lastError || "invalid_grant",
    };
  }

  // Recently verified live — trust the cache.
  const lastVerified = googleAuth.lastVerifiedAt?.getTime() ?? 0;
  if (Date.now() - lastVerified < LIVENESS_THROTTLE_MS) {
    return { status: "authenticated", accountEmail: googleAuth.accountEmail };
  }

  const CLIENT_ID =
    process.env.GOOGLE_CONTACTS_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
  const CLIENT_SECRET =
    process.env.GOOGLE_CONTACTS_CLIENT_SECRET ||
    process.env.GOOGLE_CLIENT_SECRET;
  if (!CLIENT_ID || !CLIENT_SECRET) {
    return {
      status: "misconfigured",
      accountEmail: googleAuth.accountEmail,
      reason: "oauth_credentials_missing",
    };
  }

  // Decrypt may throw if the key is missing/rotated or the value is corrupt.
  let refreshToken: string;
  try {
    refreshToken = decryptSecret(googleAuth.refreshToken);
  } catch (error) {
    console.error("Failed to decrypt stored Google refresh token:", error);
    return {
      status: "misconfigured",
      accountEmail: googleAuth.accountEmail,
      reason: "token_decrypt_failed",
    };
  }

  const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    `${process.env.NEXTAUTH_URL}/api/google-auth/callback`
  );
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  try {
    // Forces a token refresh against Google — the cheapest real liveness test.
    await oauth2Client.getAccessToken();
  } catch (error) {
    if (isInvalidGrant(error)) {
      await flagReauthNeeded("invalid_grant");
      return {
        status: "needs_reauth",
        accountEmail: googleAuth.accountEmail,
        reason: "invalid_grant",
      };
    }
    // Transient (network/5xx). Don't flag or cache — next poll retries.
    console.error("Google auth liveness check failed (transient):", error);
    return { status: "authenticated", accountEmail: googleAuth.accountEmail };
  }

  await GoogleAuth.updateOne(
    { _id: googleAuth._id },
    { lastVerifiedAt: new Date() }
  );
  return { status: "authenticated", accountEmail: googleAuth.accountEmail };
}

/**
 * Pre-fetch contact groups for bulk operations to avoid quota limits
 * Returns group resource names for "ALL" and all unique districts
 */
export async function preloadContactGroups(
  districts: string[]
): Promise<{ allGroup?: string; centerGroups?: Map<string, string> } | null> {
  try {
    const authClient = await getAuthClient();
    if (!authClient) {
      return null;
    }

    const people = google.people({ version: "v1", auth: authClient });
    const result: { allGroup?: string; centerGroups?: Map<string, string> } = {
      centerGroups: new Map(),
    };

    // Get or create "ALL" group
    const allGroup = await getOrCreateContactGroup(people, "ALL");
    if (allGroup) {
      result.allGroup = allGroup;
    }

    // Get unique district shorts
    const uniqueDistricts = new Set(
      districts
        .map(getDistrictShort)
        .filter((c): c is string => !!c)
    );

    // Get or create all district groups
    for (const districtShort of uniqueDistricts) {
      const centerGroup = await getOrCreateContactGroup(people, districtShort);
      if (centerGroup) {
        result.centerGroups!.set(districtShort, centerGroup);
      }
    }

    console.log(
      `✓ Preloaded ${1 + (result.centerGroups?.size || 0)} contact groups`
    );

    return result;
  } catch (error) {
    console.error("Error preloading contact groups:", error);
    await handleGoogleAuthError(error);
    return null;
  }
}

export async function createGoogleContact(
  data: ContactData,
  preloadedGroups?: { allGroup?: string; centerGroups?: Map<string, string> }
): Promise<string | null> {
  try {
    const authClient = await getAuthClient();

    if (!authClient) {
      console.warn(
        "Google Contacts not authenticated. Skipping contact creation."
      );
      return null;
    }

    // Format contact name based on referrer code
    let displayName: string;
    if (data.referrerCode) {
      displayName = `${data.installerCode} REF-${data.referrerCode} ${data.fullName}`;
    } else {
      displayName = `${data.installerCode} ${data.fullName}`;
    }

    console.log("Creating Google contact for:", displayName);

    const people = google.people({ version: "v1", auth: authClient });

    // Format phone numbers
    const formattedPhone = formatPhoneNumber(data.phoneNumber);
    const formattedWhatsApp = formatPhoneNumber(data.whatsappNumber);

    // Build phone numbers array - only add WhatsApp separately if different
    const phoneNumbers: Array<{
      value: string;
      type: string;
      formattedType?: string;
    }> = [
        {
          value: formattedPhone,
          type: "mobile",
        },
      ];

    // Only add WhatsApp as separate number if it's different from phone
    if (formattedPhone !== formattedWhatsApp) {
      phoneNumbers.push({
        value: formattedWhatsApp,
        type: "mobile",
        formattedType: "WhatsApp",
      });
    }

    let response;
    let retries = 5;

    while (retries > 0) {
      try {
        response = await people.people.createContact({
          requestBody: {
            names: [
              {
                givenName: displayName,
                displayName: displayName,
              },
            ],
            phoneNumbers: phoneNumbers,
            emailAddresses: data.email
              ? [
                {
                  value: data.email,
                },
              ]
              : [],
            addresses: data.address
              ? [
                {
                  streetAddress: data.address,
                  city: data.city,
                  region: data.province,
                  country: "Pakistan",
                },
              ]
              : [],
            organizations: data.companyName
              ? [
                {
                  name: data.companyName,
                },
              ]
              : [],
            biographies: [
              {
                value: `Installer Code: ${data.installerCode || "N/A"}\nCNIC: ${data.cnic || "N/A"
                  }`,
                contentType: "TEXT_PLAIN",
              },
            ],
          },
        });
        break; // Success
      } catch (error: any) {
        const status = error.response?.status || error.code;
        const isRateLimit = status === 429;
        const isNetworkError = error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND' || error.type === 'system';
        
        if ((isRateLimit || isNetworkError) && retries > 1) {
          const backoffDelay = isNetworkError ? 3000 : 2000 * Math.pow(2, 5 - retries); // 3s for network errors, exponential for rate limits
          console.log(`⚠ ${isNetworkError ? 'Network error' : 'Rate limit (429)'} creating contact, retrying in ${backoffDelay / 1000}s... (${retries - 1} retries left)`);
          await new Promise(resolve => setTimeout(resolve, backoffDelay));
          retries--;
        } else {
          throw error;
        }
      }
    }

    if (!response) throw new Error("Failed to create contact after retries");

    console.log(
      "✓ Google contact created successfully:",
      response.data.resourceName
    );

    // Add contact to groups (labels) - STRICT MODE
    const resourceName = response.data.resourceName;
    if (resourceName) {
      const groupsToAdd: string[] = [];
      const groupNames: { [key: string]: string } = {}; // Map resource name to friendly name

      // Add "ALL" group (use preloaded if available) - MANDATORY
      let allGroupName: string | null = null;
      if (preloadedGroups?.allGroup) {
        allGroupName = preloadedGroups.allGroup;
      } else {
        allGroupName = await getOrCreateContactGroup(people, "ALL");
      }
      if (allGroupName) {
        groupsToAdd.push(allGroupName);
        groupNames[allGroupName] = "ALL";
      } else {
        // STRICT: If ALL group cannot be created, delete contact and fail
        console.error("✗ CRITICAL: Cannot create/get ALL group");
        try {
          await people.people.deleteContact({ resourceName });
          console.log("✓ Deleted contact due to missing ALL group");
        } catch (deleteError) {
          console.error("Failed to delete contact:", deleteError);
        }
        throw new Error("Failed to get/create ALL contact group");
      }

      // Add district group (e.g., "LHE" for Lahore) - MANDATORY if district exists
      const districtShort = getDistrictShort(data.district);
      if (districtShort) {
        let centerGroupName: string | null = null;
        if (preloadedGroups?.centerGroups?.has(districtShort)) {
          centerGroupName =
            preloadedGroups.centerGroups.get(districtShort) || null;
        } else {
          centerGroupName = await getOrCreateContactGroup(
            people,
            districtShort
          );
        }
        if (centerGroupName) {
          groupsToAdd.push(centerGroupName);
          groupNames[centerGroupName] = districtShort;
        } else {
          // STRICT: If district group cannot be created, delete contact and fail
          console.error(
            `✗ CRITICAL: Cannot create/get district group "${districtShort}"`
          );
          try {
            await people.people.deleteContact({ resourceName });
            console.log("✓ Deleted contact due to missing district group");
          } catch (deleteError) {
            console.error("Failed to delete contact:", deleteError);
          }
          throw new Error(
            `Failed to get/create district group "${districtShort}"`
          );
        }
      }

      // STRICT: Add contact to ALL required groups or fail
      if (groupsToAdd.length > 0) {
        // Verify all groups exist
        await people.contactGroups.batchGet({
          resourceNames: groupsToAdd,
        });

        // Add random delay to reduce simultaneous modifications (100-600ms)
        await new Promise((resolve) =>
          setTimeout(resolve, 100 + Math.random() * 500)
        );

        const successfulGroups: string[] = [];
        const alreadyInGroups: string[] = [];
        const failedGroups: string[] = [];

        for (const groupResourceName of groupsToAdd) {
          const friendlyName = groupNames[groupResourceName];
          // Extended retry logic with aggressive backoff
          let retries = 8; // Increased from 5 to 8
          let lastError = null;
          let added = false;

          while (retries > 0) {
            try {
              await people.contactGroups.members.modify({
                resourceName: groupResourceName,
                requestBody: {
                  resourceNamesToAdd: [resourceName],
                },
              });
              successfulGroups.push(groupResourceName);
              added = true; 
              break;
            } catch (modifyError: unknown) {
              lastError = modifyError;

              // Check error type
              const anyError = modifyError as any;
              const errorCode = anyError?.code || anyError?.response?.status;

              const isConflict = errorCode === 409;
              const isRateLimit = errorCode === 429;

              if (isRateLimit) {
                // Rate limit - use exponential backoff with longer delays
                if (retries > 1) {
                  // Exponential backoff: 3s, 6s, 12s, 24s, 48s, 96s, 192s
                  const backoffDelay = 3000 * Math.pow(2, 8 - retries);
                  console.log(
                    `⚠ Rate limit (429) for "${friendlyName}", retrying in ${
                      backoffDelay / 1000
                    }s... (${retries - 1} retries left)`
                  );
                  await new Promise((resolve) =>
                    setTimeout(resolve, backoffDelay)
                  );
                  retries--;
                } else {
                  // Final retry exhausted - this is a CRITICAL failure
                  console.error(
                    `✗ CRITICAL: Rate limit exhausted for group "${friendlyName}"`
                  );
                  failedGroups.push(groupResourceName);
                  break;
                }
              } else if (isConflict) {
                if (retries > 1) {
                  // Progressive backoff: 0.5s, 1s, 1.5s, 2s, 2.5s, 3s, 3.5s
                  const backoffDelay = 500 * (9 - retries);
                  console.log(
                    `⚠ Conflict (409) for "${friendlyName}", retrying in ${
                      backoffDelay / 1000
                    }s... (${retries - 1} retries left)`
                  );
                  await new Promise((resolve) =>
                    setTimeout(resolve, backoffDelay)
                  );
                  retries--;
                } else {
                  // Final retry with 409 - contact is likely already in group
                  console.log(
                    `✓ Contact already in group "${friendlyName}" (409 conflict resolved)`
                  );
                  alreadyInGroups.push(groupResourceName);
                  added = true;
                  break;
                }
              } else {
                // Non-conflict/non-rate-limit error - CRITICAL failure
                console.error(
                  `✗ CRITICAL: Failed to add to group "${friendlyName}":`,
                  modifyError
                );
                failedGroups.push(groupResourceName);
                break;
              }
            }
          }

          // STRICT: If we couldn't add and it's not already in group, this is CRITICAL
          if (!added && lastError) {
            console.error(
              `✗ CRITICAL: Could not add contact to required group "${friendlyName}"`
            );
            failedGroups.push(groupResourceName);
          }
        }

        // STRICT: If ANY required group failed, delete the contact and throw error
        if (failedGroups.length > 0) {
          const failedNames = failedGroups
            .map((g) => groupNames[g] || g.split("/").pop())
            .join(", ");
          console.error(
            `✗ CRITICAL: Failed to add contact to required groups: ${failedNames}`
          );

          // Delete the contact since it doesn't have proper group memberships
          try {
            await people.people.deleteContact({ resourceName });
            console.log(
              `✓ Deleted contact due to incomplete group assignment (missing: ${failedNames})`
            );
          } catch (deleteError) {
            console.error("Failed to delete incomplete contact:", deleteError);
          }

          throw new Error(
            `Failed to add contact to required groups: ${failedNames}`
          );
        }

        // Log success
        const allProcessedGroups = [...successfulGroups, ...alreadyInGroups];
        const allGroupNames = allProcessedGroups
          .map((g) => groupNames[g] || g.split("/").pop())
          .join(", ");
        console.log(`✓ Contact successfully added to all required groups: ${allGroupNames}`);
        if (alreadyInGroups.length > 0) {
          console.log(
            `  (${successfulGroups.length} newly added, ${alreadyInGroups.length} already member)`
          );
        }
      }
    }

    return response.data.resourceName || null;
  } catch (error: unknown) {
    console.error("Error creating Google contact:", error);
    if (error && typeof error === "object" && "response" in error) {
      const apiError = error as {
        response?: { status?: number; statusText?: string; data?: unknown };
      };
      console.error("API Response Error:", {
        status: apiError.response?.status,
        statusText: apiError.response?.statusText,
        data: apiError.response?.data,
      });
    }
    if (error instanceof Error) {
      console.error("Error message:", error.message);
    }
    await handleGoogleAuthError(error);
    return null;
  }
}

export async function updateGoogleContact(
  resourceName: string,
  data: ContactData
): Promise<boolean> {
  try {
    const authClient = await getAuthClient();

    if (!authClient) {
      console.warn(
        "Google Contacts not authenticated. Skipping contact update."
      );
      return false;
    }

    const people = google.people({ version: "v1", auth: authClient });

    // Format contact name based on referrer code
    let displayName: string;
    if (data.referrerCode) {
      displayName = `${data.installerCode} REF-${data.referrerCode} ${data.fullName}`;
    } else {
      displayName = `${data.installerCode} ${data.fullName}`;
    }

    // Format phone numbers
    const formattedPhone = formatPhoneNumber(data.phoneNumber);
    const formattedWhatsApp = formatPhoneNumber(data.whatsappNumber);

    // Build phone numbers array - only add WhatsApp separately if different
    const phoneNumbers: Array<{
      value: string;
      type: string;
      formattedType?: string;
    }> = [
        {
          value: formattedPhone,
          type: "mobile",
        },
      ];

    // Only add WhatsApp as separate number if it's different from phone
    if (formattedPhone !== formattedWhatsApp) {
      phoneNumbers.push({
        value: formattedWhatsApp,
        type: "mobile",
        formattedType: "WhatsApp",
      });
    }

    // Get current contact to preserve etag
    const currentContact = await people.people.get({
      resourceName,
      personFields:
        "names,phoneNumbers,emailAddresses,addresses,organizations,biographies",
    });

    await people.people.updateContact({
      resourceName,
      updatePersonFields:
        "names,phoneNumbers,emailAddresses,addresses,organizations,biographies",
      requestBody: {
        resourceName,
        etag: currentContact.data.etag,
        names: [
          {
            givenName: displayName,
            displayName: displayName,
          },
        ],
        phoneNumbers: phoneNumbers,
        emailAddresses: data.email
          ? [
            {
              value: data.email,
            },
          ]
          : [],
        addresses: data.address
          ? [
            {
              streetAddress: data.address,
              city: data.city,
              region: data.province,
              country: "Pakistan",
            },
          ]
          : [],
        organizations: data.companyName
          ? [
            {
              name: data.companyName,
            },
          ]
          : [],
        biographies: [
          {
            value: `Installer Code: ${data.installerCode || "N/A"}\nCNIC: ${data.cnic || "N/A"
              }`,
            contentType: "TEXT_PLAIN",
          },
        ],
      },
    });

    // Update contact groups (labels)
    try {
      const groupsToAdd: string[] = [];

      // Add "ALL" group
      const allGroupName = await getOrCreateContactGroup(people, "ALL");
      if (allGroupName) {
        groupsToAdd.push(allGroupName);
      }

      // Add district group (e.g., "LHE" for Lahore)
      const districtShort = getDistrictShort(data.district);
      if (districtShort) {
        const centerGroupName = await getOrCreateContactGroup(
          people,
          districtShort
        );
        if (centerGroupName) {
          groupsToAdd.push(centerGroupName);
        }
      }

      // Get current groups for this contact
      const currentGroups = await people.people.get({
        resourceName,
        personFields: "memberships",
      });

      const existingGroupIds =
        currentGroups.data.memberships
          ?.filter((m: any) => m.contactGroupMembership)
          .map((m: any) => m.contactGroupMembership.contactGroupResourceName) ||
        [];

      // Get all possible district short codes for comparison
      const allDistrictShorts = Object.values(DISTRICT_CODES);

      // Get list of all contact groups to identify district groups
      const allGroups = await people.contactGroups.list();
      const districtGroupIds =
        allGroups.data.contactGroups
          ?.filter(
            (g: any) =>
              g.name &&
              allDistrictShorts.includes(g.name) &&
              g.resourceName
          )
          .map((g: any) => g.resourceName) || [];

      // Remove from old district groups (groups that are district labels but not in groupsToAdd)
      for (const existingGroupId of existingGroupIds) {
        const isDistrictGroup =
          districtGroupIds.includes(existingGroupId);
        const shouldKeep = groupsToAdd.includes(existingGroupId);

        if (isDistrictGroup && !shouldKeep) {
          try {
            await people.contactGroups.members.modify({
              resourceName: existingGroupId,
              requestBody: {
                resourceNamesToRemove: [resourceName],
              },
            });
            console.log(
              `✓ Removed from old group: ${existingGroupId.split("/").pop()}`
            );
          } catch (removeError) {
            console.error(
              `Failed to remove from group ${existingGroupId}:`,
              removeError
            );
          }
        }
      }

      // Add to new groups if not already member
      for (const groupResourceName of groupsToAdd) {
        if (!existingGroupIds.includes(groupResourceName)) {
          await people.contactGroups.members.modify({
            resourceName: groupResourceName,
            requestBody: {
              resourceNamesToAdd: [resourceName],
            },
          });
        }
      }

      console.log(
        `✓ Updated contact groups: ${groupsToAdd
          .map((g) => g.split("/").pop())
          .join(", ")}`
      );
    } catch (groupError) {
      console.error("Error updating contact groups:", groupError);
    }

    return true;
  } catch (error) {
    console.error("Error updating Google contact:", error);
    await handleGoogleAuthError(error);
    return false;
  }
}

export async function deleteGoogleContact(
  resourceName: string
): Promise<boolean> {
  try {
    const authClient = await getAuthClient();

    if (!authClient) {
      console.warn(
        "Google Contacts not authenticated. Skipping contact deletion."
      );
      return false;
    }

    const people = google.people({ version: "v1", auth: authClient });

    let retries = 5;
    while (retries > 0) {
      try {
        await people.people.deleteContact({
          resourceName,
        });
        break;
      } catch (error: any) {
        const status = error.response?.status || error.code;
        const isRateLimit = status === 429;
        const isNetworkError = error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND' || error.type === 'system';
        
        if ((isRateLimit || isNetworkError) && retries > 1) {
          const backoffDelay = isNetworkError ? 3000 : 2000 * Math.pow(2, 5 - retries);
          console.log(`⚠ ${isNetworkError ? 'Network error' : 'Rate limit (429)'} deleting contact, retrying in ${backoffDelay / 1000}s... (${retries - 1} retries left)`);
          await new Promise(resolve => setTimeout(resolve, backoffDelay));
          retries--;
        } else {
          throw error;
        }
      }
    }

    return true;
  } catch (error: unknown) {
    // If contact not found (404), consider it as successfully deleted (contact doesn't exist anymore)
    const apiError = error as { code?: number; status?: number };
    if (apiError.code === 404 || apiError.status === 404) {
      console.warn(
        `Google contact not found (already deleted or doesn't exist): ${resourceName}`
      );
      return true;
    }

    console.error("Error deleting Google contact:", error);
    await handleGoogleAuthError(error);
    return false;
  }
}
