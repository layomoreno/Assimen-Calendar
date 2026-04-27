import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createCalendarEvent } from "@/lib/google/calendar";
import { findAvailableSlot } from "@/lib/google/collisions";

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { activityId } = body;

    // Get activity
    const { data: activity, error: actError } = await supabase
      .from("activities")
      .select("*")
      .eq("id", activityId)
      .single();

    if (actError || !activity) {
      return NextResponse.json({ error: "Actividad no encontrada" }, { status: 404 });
    }

    // Get user profile with Google tokens
    const { data: profile } = await supabase
      .from("profiles")
      .select("google_access_token, google_refresh_token, timezone")
      .eq("id", user.id)
      .single();

    if (!profile?.google_access_token || !profile?.google_refresh_token) {
      return NextResponse.json(
        { error: "Tokens de Google no disponibles. Vuelve a iniciar sesión." },
        { status: 400 }
      );
    }

    // Regla de duración de 2 o 3 horas (elegir dinámicamente si no está en 2 o 3)
    let blockDuration = activity.block_duration_hours;
    if (blockDuration !== 2 && blockDuration !== 3) {
      blockDuration = Math.random() < 0.5 ? 2 : 3;
    }

    // Check for collisions and find available slot
    const preferredDate = new Date(activity.start_date);
    const collision = await findAvailableSlot(
      profile.google_access_token,
      profile.google_refresh_token,
      preferredDate,
      blockDuration,
      profile.timezone
    );

    // Create event in Google Calendar
    const slot = collision.suggestedSlot || collision.originalSlot;
    const event = await createCalendarEvent(
      profile.google_access_token,
      profile.google_refresh_token,
      {
        summary: `📚 ${activity.title}${activity.course_name ? ` — ${activity.course_name}` : ""}`,
        description: activity.description || undefined,
        startDateTime: slot.start.toISOString(),
        endDateTime: slot.end.toISOString(),
        timeZone: profile.timezone,
      }
    );

    // Update activity with Google event ID
    await supabase
      .from("activities")
      .update({
        google_event_id: event.id,
        start_date: slot.start.toISOString(),
      })
      .eq("id", activityId);

    return NextResponse.json({
      success: true,
      eventId: event.id,
      hasCollision: collision.hasCollision,
      scheduledSlot: {
        start: slot.start.toISOString(),
        end: slot.end.toISOString(),
      },
    });
  } catch (error) {
    console.error("Calendar sync error:", error);
    return NextResponse.json(
      { error: "Error al sincronizar con Google Calendar" },
      { status: 500 }
    );
  }
}
