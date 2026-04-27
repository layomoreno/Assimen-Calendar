import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createCalendarEvent } from "@/lib/google/calendar";
import { findAvailableSlot } from "@/lib/google/collisions";

interface TaskInput {
  title: string;
  description?: string;
  due_date: string;
  subtasks?: string[];
  classification: "academica" | "personal";
  course_name?: string | null;
}

/**
 * POST /api/activities/create
 * Creates activities from AI-extracted data and optionally syncs with Google Calendar
 */
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { tasks, syncCalendar = true } = body as {
      tasks: TaskInput[];
      syncCalendar?: boolean;
    };

    if (!tasks || tasks.length === 0) {
      return NextResponse.json(
        { error: "No se proporcionaron tareas" },
        { status: 400 }
      );
    }

    // Get user profile for tokens and timezone
    const { data: profile } = await supabase
      .from("profiles")
      .select("google_access_token, google_refresh_token, microsoft_access_token, microsoft_refresh_token, timezone")
      .eq("id", user.id)
      .single();

    const timezone = profile?.timezone || "America/Bogota";
    const hasGoogleTokens = profile?.google_access_token && profile?.google_refresh_token;
    const hasMicrosoftTokens = !!profile?.microsoft_access_token;

    const results = [];

    for (const task of tasks) {
      // Calculate start_date (due_date - 1 day, at 9am)
      const dueDate = new Date(task.due_date);
      const startDate = new Date(dueDate);
      startDate.setDate(startDate.getDate() - 1);
      startDate.setHours(9, 0, 0, 0);

      // Duration is distinctly 2 or 3 hours
      const blockDuration = Math.random() < 0.5 ? 2 : 3;

      // Create the activity in Supabase
      const { data: activity, error: actError } = await supabase
        .from("activities")
        .insert({
          user_id: user.id,
          category: task.classification,
          course_name: task.course_name || null,
          title: task.title,
          description: task.description || null,
          start_date: startDate.toISOString(),
          due_date: dueDate.toISOString(),
          block_duration_hours: blockDuration,
          status: "en_proceso",
          priority: determinePriority(dueDate),
        })
        .select()
        .single();

      if (actError) {
        console.error("Error creating activity:", actError);
        results.push({ title: task.title, error: actError.message });
        continue;
      }

      // Create subtasks
      if (task.subtasks && task.subtasks.length > 0) {
        const subtaskRows = task.subtasks.map((sub, idx) => ({
          activity_id: activity.id,
          title: sub,
          sort_order: idx,
        }));

        await supabase.from("subtasks").insert(subtaskRows);
      }

      // Sync with Calendars if requested and tokens available
      let externalEventId = null;
      let scheduledSlot = null;

      if (syncCalendar) {
        try {
          if (hasGoogleTokens) {
            // Google Calendar Sync
            const collision = await findAvailableSlot(
              profile.google_access_token,
              profile.google_refresh_token,
              startDate,
              blockDuration,
              timezone
            );

            const slot = collision.suggestedSlot || collision.originalSlot;

            const event = await createCalendarEvent(
              profile.google_access_token,
              profile.google_refresh_token,
              {
                summary: `📚 ${task.title}${task.course_name ? ` — ${task.course_name}` : ""}`,
                description: task.description || undefined,
                startDateTime: slot.start.toISOString(),
                endDateTime: slot.end.toISOString(),
                timeZone: timezone,
              }
            );

            externalEventId = event.id;
            scheduledSlot = {
              start: slot.start.toISOString(),
              end: slot.end.toISOString(),
              hasCollision: collision.hasCollision,
            };
          } else if (hasMicrosoftTokens) {
            // Microsoft Outlook Sync
            const { createMicrosoftCalendarEvent, findMicrosoftAvailableSlot } = await import("@/lib/microsoft/calendar");
            
            const collision = await findMicrosoftAvailableSlot(
              profile.microsoft_access_token,
              startDate,
              2,
              timezone
            );

            const slot = collision.suggestedSlot || collision.originalSlot;

            const event = await createMicrosoftCalendarEvent(
              profile.microsoft_access_token,
              {
                summary: `📚 ${task.title}${task.course_name ? ` — ${task.course_name}` : ""}`,
                description: task.description || undefined,
                startDateTime: slot.start.toISOString(),
                endDateTime: slot.end.toISOString(),
                timeZone: timezone,
              }
            );

            externalEventId = event.id;
            scheduledSlot = {
              start: slot.start.toISOString(),
              end: slot.end.toISOString(),
              hasCollision: collision.hasCollision,
            };
          }

          // Update activity with external event ID if synced
          if (externalEventId) {
            await supabase
              .from("activities")
              .update({
                google_event_id: externalEventId, // Reuse google_event_id column for now or rename in schema later
                start_date: scheduledSlot?.start || startDate.toISOString(),
              })
              .eq("id", activity.id);
          }
        } catch (calError) {
          console.error("Calendar sync error for task:", task.title, calError);
          // Activity is still saved, just not synced
        }
      }

      results.push({
        id: activity.id,
        title: task.title,
        externalEventId,
        scheduledSlot,
        success: true,
      });
    }

    return NextResponse.json({
      success: true,
      activities: results,
      totalCreated: results.filter((r) => "success" in r && r.success).length,
      totalSynced: results.filter((r) => r.externalEventId).length,
    });
  } catch (error) {
    console.error("Create activities error:", error);
    return NextResponse.json(
      { error: "Error al crear actividades" },
      { status: 500 }
    );
  }
}

/**
 * Determine priority based on how soon the due date is
 */
function determinePriority(
  dueDate: Date
): "baja" | "normal" | "alta" | "urgente" {
  const daysUntilDue = Math.ceil(
    (dueDate.getTime() - Date.now()) / 86400000
  );

  if (daysUntilDue <= 1) return "urgente";
  if (daysUntilDue <= 3) return "alta";
  if (daysUntilDue <= 7) return "normal";
  return "baja";
}
