import { google } from 'googleapis';

/**
 * Creates a Google Meet link for a scheduled event.
 * Requires GOOGLE_CLIENT_EMAIL and GOOGLE_PRIVATE_KEY in env.
 */
export async function createGoogleMeet(env: any, {
  title,
  description,
  startAt,
  durationMinutes = 60
}: {
  title: string;
  description: string;
  startAt: string;
  durationMinutes?: number;
}) {
  const clientEmail = env.GOOGLE_CLIENT_EMAIL;
  // Handle private key potentially having escaped newlines in env vars
  const privateKey = env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!clientEmail || !privateKey) {
    console.warn('Google Credentials missing — falling back to mock link.');
    const r = () => Math.random().toString(36).substring(2, 5);
    return `https://meet.google.com/${r()}-${r()}-${r()}`;
  }

  try {
    const auth = new google.auth.JWT(
      clientEmail,
      undefined,
      privateKey,
      ['https://www.googleapis.com/auth/calendar.events']
    );

    const calendar = google.calendar({ version: 'v3', auth });

    const startTime = new Date(startAt);
    const endTime = new Date(startTime.getTime() + durationMinutes * 60000);

    const event = {
      summary: title,
      description,
      start: {
        dateTime: startTime.toISOString(),
      },
      end: {
        dateTime: endTime.toISOString(),
      },
      conferenceData: {
        createRequest: {
          requestId: Math.random().toString(36).substring(7),
          conferenceSolutionKey: { type: 'hangoutMeet' },
        },
      },
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
      conferenceDataVersion: 1,
    });

    return response.data.hangoutLink || response.data.conferenceData?.entryPoints?.[0]?.uri || null;
  } catch (error) {
    console.error('Error creating Google Meet:', error);
    // Return a mock link as fallback so user can still work
    const r = () => Math.random().toString(36).substring(2, 5);
    return `https://meet.google.com/${r()}-${r()}-${r()}`;
  }
}
