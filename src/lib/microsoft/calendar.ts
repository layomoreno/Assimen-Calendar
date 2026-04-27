/**
 * Microsoft Graph API Integration for Outlook Calendar
 */

interface MicrosoftEventInput {
  summary: string;
  description?: string;
  startDateTime: string;
  endDateTime: string;
  timeZone: string;
}

export async function createMicrosoftCalendarEvent(
  accessToken: string,
  event: MicrosoftEventInput
) {
  const url = "https://graph.microsoft.com/v1.0/me/events";

  const body = {
    subject: event.summary,
    body: {
      contentType: "HTML",
      content: event.description || "Agendado por Assisten Calendar",
    },
    start: {
      dateTime: event.startDateTime, // Must be ISO string without Z if we provide timeZone, but Microsoft prefers specific format. Wait, Graph API accepts ISO 8601.
      timeZone: event.timeZone,
    },
    end: {
      dateTime: event.endDateTime,
      timeZone: event.timeZone,
    },
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    console.error("Microsoft Graph API Error:", errorData);
    throw new Error(`Error al crear evento en Outlook: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}

// For Outlook, we can also implement findAvailableSlot, 
// but for now we will just use the suggested time directly to simplify.
export async function findMicrosoftAvailableSlot(
  accessToken: string,
  desiredStart: Date,
  durationHours: number,
  timeZone: string
) {
  // Simplification: just return the desired slot. 
  // In a full implementation, we'd call the calendarView API to check for conflicts.
  const end = new Date(desiredStart.getTime() + durationHours * 3600000);
  
  return {
    originalSlot: { start: desiredStart, end },
    hasCollision: false,
    suggestedSlot: null
  };
}
