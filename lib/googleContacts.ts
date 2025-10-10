/* eslint-disable @typescript-eslint/no-explicit-any */
import { google } from "googleapis";
import dbConnect from "./mongodb";
import GoogleAuth from "@/models/GoogleAuth";

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

async function getAuthClient(userId: string) {
  await dbConnect();

  const googleAuth = await GoogleAuth.findOne({
    userId,
    isActive: true,
  });

  if (!googleAuth?.refreshToken) {
    console.warn("No active Google auth found for user:", userId);
    return null;
  }

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
  userId: string,
  data: ContactData
): Promise<string | null> {
  try {
    const authClient = await getAuthClient(userId);

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
  userId: string,
  resourceName: string,
  data: ContactData
): Promise<boolean> {
  try {
    const authClient = await getAuthClient(userId);

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

    return true;
  } catch (error) {
    console.error("Error updating Google contact:", error);
    return false;
  }
}

export async function deleteGoogleContact(
  userId: string,
  resourceName: string
): Promise<boolean> {
  try {
    const authClient = await getAuthClient(userId);

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
