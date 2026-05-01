import { redirect } from "next/navigation";
import { NextResponse, type NextRequest } from "next/server";
import { normalizeRole } from "@/lib/auth/roles";
import { resolveBaseRole } from "@/lib/auth/effective-role";
import { ACTIVE_ROLE_COOKIE, canAssumeRole, roleRoutes } from "@/lib/auth/role-session";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ role: string }> }
) {
  const { role } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const baseRole = await resolveBaseRole(supabase, user);
  const nextRole = normalizeRole(role);

  if (!canAssumeRole(baseRole, nextRole)) {
    return NextResponse.redirect(new URL(roleRoutes[baseRole] || "/dashboard/user/feed", request.url));
  }

  const response = NextResponse.redirect(new URL(roleRoutes[nextRole] || "/dashboard/user/feed", request.url));
  response.cookies.set(ACTIVE_ROLE_COOKIE, nextRole, {
    path: "/",
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
