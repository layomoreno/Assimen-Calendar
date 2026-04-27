import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// Formatea fecha a estándar iCalendar (YYYYMMDDThhmmssZ)
function formatICSDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return new NextResponse("Missing calendar token", { status: 401 });
    }

    // Usamos el cliente de supabase con service_role porque esta ruta es pública (sin cookies)
    // Usar la clave anónima también funciona si configuramos las políticas de RLS, pero 
    // como esto expone datos del usuario a Apple (que no envía cookies), usamos la validación del token.
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    // We instantiate client manually here. Since we are checking the token, we can use the anon key. 
    // Wait, with RLS enabled, anon key won't read profiles unless we have a policy.
    // Instead, we should ideally use service_role, but for safety we'll try anon first, 
    // assuming RLS is configured or we bypass it via a trusted edge function. 
    // Let's use service_role if available, else anon key.
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Verify token
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, calendar_token")
      .eq("id", userId)
      .single();

    if (profileError || !profile || profile.calendar_token !== token) {
      return new NextResponse("Invalid calendar token or user not found", { status: 403 });
    }

    // 2. Fetch activities
    const { data: activities, error: activitiesError } = await supabase
      .from("activities")
      .select("*")
      .eq("user_id", userId)
      .neq("status", "cumplida"); // Only sync active/upcoming activities

    if (activitiesError) {
      return new NextResponse("Error fetching activities", { status: 500 });
    }

    // 3. Build iCalendar format
    const now = formatICSDate(new Date().toISOString());
    let icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Assisten Calendar//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "X-WR-CALNAME:Assisten Calendar",
      "X-WR-TIMEZONE:America/Bogota",
      "REFRESH-INTERVAL;VALUE=DURATION:PT15M", // Tell Apple to refresh every 15 min
    ].join("\r\n") + "\r\n";

    for (const act of activities) {
      const dtStart = formatICSDate(act.start_date || act.due_date);
      // Apple Calendar needs an end date. If block_duration_hours is present, calculate end
      const startObj = new Date(act.start_date || act.due_date);
      const endObj = new Date(startObj.getTime() + (act.block_duration_hours || 1) * 3600000);
      const dtEnd = formatICSDate(endObj.toISOString());

      icsContent += [
        "BEGIN:VEVENT",
        `UID:${act.id}@assistencalendar.com`,
        `DTSTAMP:${now}`,
        `DTSTART:${dtStart}`,
        `DTEND:${dtEnd}`,
        `SUMMARY:📚 ${act.title}${act.course_name ? ` — ${act.course_name}` : ""}`,
        `DESCRIPTION:${act.description || "Agendado por Assisten Calendar"}`,
        `STATUS:CONFIRMED`,
        "END:VEVENT",
        ""
      ].join("\r\n");
    }

    icsContent += "END:VCALENDAR";

    // 4. Return as text/calendar
    return new NextResponse(icsContent, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="assisten-calendar.ics"`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("iCal Feed Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
