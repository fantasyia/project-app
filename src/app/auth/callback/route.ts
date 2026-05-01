import { redirect } from "next/navigation";
import { NextResponse, type NextRequest } from "next/server";
import { ensurePublicUserProfile } from "@/lib/auth/ensure-user-profile";
import { resolveBaseRole } from "@/lib/auth/effective-role";
import { getAllowedActiveRoles, roleRoutes, setActiveRoleCookie } from "@/lib/auth/role-session";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next");

  if (!code) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await ensurePublicUserProfile(supabase, user);
  const role = await resolveBaseRole(supabase, user);
  if (getAllowedActiveRoles(role).length > 1) {
    return NextResponse.redirect(new URL(next || "/select-role", request.url));
  }
  await setActiveRoleCookie(role);
  return NextResponse.redirect(new URL(next || roleRoutes[role] || "/dashboard/user/feed", request.url));
}
