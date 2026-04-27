import { google } from "googleapis";

const SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
];

export function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

export function getCalendarClient(accessToken: string, refreshToken: string) {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  return google.calendar({ version: "v3", auth: oauth2Client });
}

/** Create a calendar event for an activity block (2-3 hours) */
export async function createCalendarEvent(
  accessToken: string,
  refreshToken: string,
  event: {
    summary: string;
    description?: string;
    startDateTime: string;
    endDateTime: string;
    timeZone?: string;
  }
) {
  const calendar = getCalendarClient(accessToken, refreshToken);

  const response = await calendar.events.insert({
    calendarId: "primary",
    requestBody: {
      summary: event.summary,
      description: event.description,
      start: {
        dateTime: event.startDateTime,
        timeZone: event.timeZone || "America/Bogota",
      },
      end: {
        dateTime: event.endDateTime,
        timeZone: event.timeZone || "America/Bogota",
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: "popup", minutes: 10080 }, // 7 días
          { method: "popup", minutes: 7200 },  // 5 días
          { method: "popup", minutes: 4320 },  // 3 días
          { method: "popup", minutes: 60 },    // Mismo día (1 hr antes)
        ],
      },
      colorId: "5", // Yellow/banana color
    },
  });

  return response.data;
}

/** Update an existing calendar event */
export async function updateCalendarEvent(
  accessToken: string,
  refreshToken: string,
  eventId: string,
  updates: {
    summary?: string;
    description?: string;
    startDateTime?: string;
    endDateTime?: string;
    timeZone?: string;
  }
) {
  const calendar = getCalendarClient(accessToken, refreshToken);

  const requestBody: Record<string, unknown> = {};
  if (updates.summary) requestBody.summary = updates.summary;
  if (updates.description) requestBody.description = updates.description;
  if (updates.startDateTime) {
    requestBody.start = {
      dateTime: updates.startDateTime,
      timeZone: updates.timeZone || "America/Bogota",
    };
  }
  if (updates.endDateTime) {
    requestBody.end = {
      dateTime: updates.endDateTime,
      timeZone: updates.timeZone || "America/Bogota",
    };
  }

  const response = await calendar.events.patch({
    calendarId: "primary",
    eventId,
    requestBody,
  });

  return response.data;
}

/** Delete a calendar event */
export async function deleteCalendarEvent(
  accessToken: string,
  refreshToken: string,
  eventId: string
) {
  const calendar = getCalendarClient(accessToken, refreshToken);

  await calendar.events.delete({
    calendarId: "primary",
    eventId,
  });
}

/** Check availability using FreeBusy API */
export async function checkAvailability(
  accessToken: string,
  refreshToken: string,
  timeMin: string,
  timeMax: string,
  timeZone: string = "America/Bogota"
) {
  const calendar = getCalendarClient(accessToken, refreshToken);

  const response = await calendar.freebusy.query({
    requestBody: {
      timeMin,
      timeMax,
      timeZone,
      items: [{ id: "primary" }],
    },
  });

  const busySlots = response.data.calendars?.primary?.busy || [];
  return busySlots.map((slot) => ({
    start: new Date(slot.start!),
    end: new Date(slot.end!),
  }));
}

export { SCOPES };
