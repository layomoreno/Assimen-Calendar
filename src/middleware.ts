import { type NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  // In development without Supabase, allow all routes
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl || supabaseUrl === "https://your-project.supabase.co") {
    return NextResponse.next();
  }

  // Production: use Supabase auth middleware
  const { updateSession } = await import("@/lib/supabase/middleware");
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
