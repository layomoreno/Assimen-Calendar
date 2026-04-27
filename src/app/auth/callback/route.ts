import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.session) {
      // Store the Google tokens in the profile for Calendar sync
      const { provider_token, provider_refresh_token } = data.session;

      if (provider_token) {
        await supabase.from("profiles").upsert({
          id: data.session.user.id,
          email: data.session.user.email!,
          full_name: data.session.user.user_metadata?.full_name || null,
          avatar_url: data.session.user.user_metadata?.avatar_url || null,
          google_access_token: provider_token,
          google_refresh_token: provider_refresh_token || null,
          token_expires_at: data.session.expires_at
            ? new Date(data.session.expires_at * 1000).toISOString()
            : null,
        });
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Auth error — redirect to login with error
  return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`);
}
