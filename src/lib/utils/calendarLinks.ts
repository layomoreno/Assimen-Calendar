import { format, addHours } from "date-fns";
import type { Activity } from "@/types/database";

/**
 * Genera la URL de Google Calendar
 */
export function getGoogleCalendarUrl(activity: Activity): string {
  const title = encodeURIComponent(activity.title);
  const details = encodeURIComponent(activity.description || "Evento sincronizado desde Assisten Calendar");
  
  const startDate = new Date(activity.start_date);
  const dueDate = new Date(activity.due_date);
  
  // Format to basic ISO 8601 string without punctuation, required by Google Calendar (e.g. 20230101T120000Z)
  const formatGoogleDate = (date: Date) => date.toISOString().replace(/-|:|\.\d\d\d/g, "");
  
  const dates = `${formatGoogleDate(startDate)}/${formatGoogleDate(dueDate)}`;
  
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}`;
}

/**
 * Genera la URL de Outlook / Hotmail Calendar
 */
export function getOutlookCalendarUrl(activity: Activity): string {
  const title = encodeURIComponent(activity.title);
  const details = encodeURIComponent(activity.description || "Evento sincronizado desde Assisten Calendar");
  
  // Outlook format requires ISO strings format e.g. 2023-01-01T12:00:00Z
  const startDate = new Date(activity.start_date).toISOString();
  const dueDate = new Date(activity.due_date).toISOString();
  
  return `https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent&subject=${title}&startdt=${startDate}&enddt=${dueDate}&body=${details}`;
}

/**
 * Genera un Data URI para descargar un archivo .ics (Apple Calendar)
 */
export function getAppleCalendarDataUri(activity: Activity): string {
  const formatICSDate = (date: Date) => date.toISOString().replace(/-|:|\.\d\d\d/g, "");
  
  const start = formatICSDate(new Date(activity.start_date));
  const end = formatICSDate(new Date(activity.due_date));
  const stamp = formatICSDate(new Date());

  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Assisten Calendar//ES",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `DTSTAMP:${stamp}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${activity.title}`,
    `DESCRIPTION:${activity.description || "Evento sincronizado desde Assisten Calendar"}`,
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");

  return `data:text/calendar;charset=utf8,${encodeURIComponent(icsContent)}`;
}
