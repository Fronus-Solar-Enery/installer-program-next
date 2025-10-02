import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CONTACTS_CLIENT_ID,
  process.env.GOOGLE_CONTACTS_CLIENT_SECRET,
  'http://localhost:3000/api/auth/google/callback'
);

// Set credentials with refresh token
oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_CONTACTS_REFRESH_TOKEN,
});

const people = google.people({ version: 'v1', auth: oauth2Client });

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
  cnic?: string;
}

export async function createGoogleContact(data: ContactData): Promise<string | null> {
  try {
    const response = await people.people.createContact({
      requestBody: {
        names: [
          {
            givenName: data.fullName,
            displayName: data.fullName,
          },
        ],
        phoneNumbers: [
          {
            value: data.phoneNumber,
            type: 'mobile',
          },
          {
            value: data.whatsappNumber,
            type: 'other',
            formattedType: 'WhatsApp',
          },
        ],
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
                country: 'Pakistan',
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
            value: `Installer Code: ${data.installerCode || 'N/A'}\nCNIC: ${data.cnic || 'N/A'}`,
            contentType: 'TEXT_PLAIN',
          },
        ],
      },
    });

    return response.data.resourceName || null;
  } catch (error) {
    console.error('Error creating Google contact:', error);
    return null;
  }
}

export async function updateGoogleContact(resourceName: string, data: ContactData): Promise<boolean> {
  try {
    // Get current contact to preserve etag
    const currentContact = await people.people.get({
      resourceName,
      personFields: 'names,phoneNumbers,emailAddresses,addresses,organizations,biographies',
    });

    await people.people.updateContact({
      resourceName,
      updatePersonFields: 'names,phoneNumbers,emailAddresses,addresses,organizations,biographies',
      requestBody: {
        resourceName,
        etag: currentContact.data.etag,
        names: [
          {
            givenName: data.fullName,
            displayName: data.fullName,
          },
        ],
        phoneNumbers: [
          {
            value: data.phoneNumber,
            type: 'mobile',
          },
          {
            value: data.whatsappNumber,
            type: 'other',
            formattedType: 'WhatsApp',
          },
        ],
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
                country: 'Pakistan',
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
            value: `Installer Code: ${data.installerCode || 'N/A'}\nCNIC: ${data.cnic || 'N/A'}`,
            contentType: 'TEXT_PLAIN',
          },
        ],
      },
    });

    return true;
  } catch (error) {
    console.error('Error updating Google contact:', error);
    return false;
  }
}

export async function deleteGoogleContact(resourceName: string): Promise<boolean> {
  try {
    await people.people.deleteContact({
      resourceName,
    });
    return true;
  } catch (error) {
    console.error('Error deleting Google contact:', error);
    return false;
  }
}
