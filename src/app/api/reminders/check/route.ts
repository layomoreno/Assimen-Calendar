import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Reminders Check API Route (designed for cron job)
 *
 * Checks for pending reminders and sends notifications.
 * Should be called periodically (e.g., every hour).
 */
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    // Get all pending reminders that should have been sent by now
    const { data: pendingReminders, error } = await supabase
      .from("reminders")
      .select(`
        *,
        activities (title, course_name, category, due_date, status),
        profiles:user_id (email, full_name)
      `)
      .eq("is_sent", false)
      .lte("remind_at", new Date().toISOString())
      .limit(50);

    if (error) {
      return NextResponse.json({ error: "Error al consultar recordatorios" }, { status: 500 });
    }

    if (!pendingReminders || pendingReminders.length === 0) {
      return NextResponse.json({ message: "No hay recordatorios pendientes", sent: 0 });
    }

    const sentIds: string[] = [];

    for (const reminder of pendingReminders) {
      // TODO: Send actual notification (email, push, etc.)
      // For now, just mark as sent
      console.log(
        `[REMINDER] ${reminder.type} for "${(reminder as Record<string, unknown>).activities}" to ${(reminder as Record<string, unknown>).profiles}`
      );

      sentIds.push(reminder.id);
    }

    // Mark as sent
    if (sentIds.length > 0) {
      await supabase
        .from("reminders")
        .update({ is_sent: true })
        .in("id", sentIds);
    }

    return NextResponse.json({
      message: `${sentIds.length} recordatorios procesados`,
      sent: sentIds.length,
    });
  } catch (error) {
    console.error("Reminder check error:", error);
    return NextResponse.json(
      { error: "Error al procesar recordatorios" },
      { status: 500 }
    );
  }
}
