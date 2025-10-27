/* eslint-disable @typescript-eslint/no-explicit-any */
import { google } from "googleapis";
import dbConnect from "./mongodb";
import GoogleAuth from "@/models/GoogleAuth";
import { TRAINING_CENTER } from "./constants";

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
  trainingCenter?: string;
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
 * Get training center short code from city name
 * Example: "Lahore" -> "LHE"
 */
function getTrainingCenterShort(trainingCenter?: string): string | null {
  if (!trainingCenter) return null;
  const center = TRAINING_CENTER.find(
    (tc) => tc.city.toLowerCase() === trainingCenter.toLowerCase()
  );
  return center?.short || null;
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
    console.error(`Error getting/creating contact group "${groupName}":`, error);
    return null;
  }
}

async function getAuthClient() {
  await dbConnect();

  // Find ANY active Google auth (global authentication)
  const googleAuth = await GoogleAuth.findOne({
    isActive: true,
  });

  if (!googleAuth?.refreshToken) {
    console.warn("No active Google auth found. Please authenticate Google Contacts.");
    return null;
  }

  console.log(`Using Google auth for account: ${googleAuth.accountEmail}`);

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

  oauth2Client.setCredentials({
    refresh_token: googleAuth.refreshToken,
    access_token: googleAuth.accessToken,
  });

  return oauth2Client;
}

export async function createGoogleContact(
  data: ContactData
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
    const phoneNumbers: Array<{ value: string; type: string; formattedType?: string }> = [
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

    const response = await people.people.createContact({
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
            value: `Installer Code: ${data.installerCode || "N/A"}\nCNIC: ${
              data.cnic || "N/A"
            }`,
            contentType: "TEXT_PLAIN",
          },
        ],
      },
    });

    console.log(
      "✓ Google contact created successfully:",
      response.data.resourceName
    );

    // Add contact to groups (labels)
    const resourceName = response.data.resourceName;
    if (resourceName) {
      const groupsToAdd: string[] = [];

      // Add "ALL" group
      const allGroupName = await getOrCreateContactGroup(people, "ALL");
      if (allGroupName) {
        groupsToAdd.push(allGroupName);
      }

      // Add training center group (e.g., "LHE" for Lahore)
      const trainingCenterShort = getTrainingCenterShort(data.trainingCenter);
      if (trainingCenterShort) {
        const centerGroupName = await getOrCreateContactGroup(
          people,
          trainingCenterShort
        );
        if (centerGroupName) {
          groupsToAdd.push(centerGroupName);
        }
      }

      // Add contact to groups
      if (groupsToAdd.length > 0) {
        try {
          await people.contactGroups.batchGet({
            resourceNames: groupsToAdd,
          });

          for (const groupResourceName of groupsToAdd) {
            await people.contactGroups.members.modify({
              resourceName: groupResourceName,
              requestBody: {
                resourceNamesToAdd: [resourceName],
              },
            });
          }

          console.log(
            `✓ Added contact to groups: ${groupsToAdd
              .map((g) => g.split("/").pop())
              .join(", ")}`
          );
        } catch (groupError) {
          console.error("Error adding contact to groups:", groupError);
        }
      }
    }

    return response.data.resourceName || null;
  } catch (error: unknown) {
    console.error("Error creating Google contact:", error);
    if (error && typeof error === 'object' && 'response' in error) {
      const apiError = error as { response?: { status?: number; statusText?: string; data?: unknown } };
      console.error("API Response Error:", {
        status: apiError.response?.status,
        statusText: apiError.response?.statusText,
        data: apiError.response?.data,
      });
    }
    if (error instanceof Error) {
      console.error("Error message:", error.message);
    }
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
    const phoneNumbers: Array<{ value: string; type: string; formattedType?: string }> = [
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
            givenName: data.fullName,
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
            value: `Installer Code: ${data.installerCode || "N/A"}\nCNIC: ${
              data.cnic || "N/A"
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

      // Add training center group (e.g., "LHE" for Lahore)
      const trainingCenterShort = getTrainingCenterShort(data.trainingCenter);
      if (trainingCenterShort) {
        const centerGroupName = await getOrCreateContactGroup(
          people,
          trainingCenterShort
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

    await people.people.deleteContact({
      resourceName,
    });

    return true;
  } catch (error: unknown) {
    // If contact not found (404), consider it as successfully deleted (contact doesn't exist anymore)
    const apiError = error as { code?: number; status?: number };
    if (apiError.code === 404 || apiError.status === 404) {
      console.warn(`Google contact not found (already deleted or doesn't exist): ${resourceName}`);
      return true;
    }

    console.error("Error deleting Google contact:", error);
    return false;
  }
}
