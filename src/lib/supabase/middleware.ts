import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { resolveBaseRole } from "@/lib/auth/resolve-base-role";
import { hasAccessTo, Role } from "@/lib/auth/roles";
import {
  ACTIVE_ROLE_COOKIE,
  canAssumeRole,
  resolveActiveRole,
  roleRoutes,
} from "@/lib/auth/role-session-edge";

function getRequestedDashboardRole(path: string): Role | null {
  if (path.startsWith("/dashboard/user")) return "subscriber";
  if (path.startsWith("/dashboard/admin")) return "admin";
  if (path.startsWith("/dashboard/creator")) return "creator";
  if (path.startsWith("/dashboard/affiliate")) return "affiliate";
  if (path.startsWith("/dashboard/blog")) return "editor";
  return null;
}

function persistActiveRole(response: NextResponse, request: NextRequest, role: Role) {
  request.cookies.set(ACTIVE_ROLE_COOKIE, role);
  response.cookies.set(ACTIVE_ROLE_COOKIE, role, {
    path: "/",
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  let user: User | { id: string; user_metadata: { role: string } } | null = null;

  if (process.env.ADMIN_DISABLE_AUTH === "1") {
    user = {
      id: "admin-bypass-id",
      user_metadata: { role: "admin" },
    };
  } else {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  }

  if (!user && request.nextUrl.pathname.startsWith("/dashboard")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && request.nextUrl.pathname.startsWith("/dashboard")) {
    const baseRole = await resolveBaseRole(supabase, user);
    const activeRoleCookie = request.cookies.get(ACTIVE_ROLE_COOKIE)?.value || null;
    let role = resolveActiveRole(baseRole, activeRoleCookie);
    const path = request.nextUrl.pathname;

    if (path.startsWith("/dashboard/subscriber")) {
      return NextResponse.redirect(
        new URL(path.replace("/dashboard/subscriber", "/dashboard/user"), request.url)
      );
    }
    if (path.startsWith("/dashboard/writer")) {
      return NextResponse.redirect(
        new URL(path.replace("/dashboard/writer", "/dashboard/blog"), request.url)
      );
    }

    const requestedRole = getRequestedDashboardRole(path);
    if (requestedRole && canAssumeRole(baseRole, requestedRole) && role !== requestedRole) {
      role = requestedRole;
      persistActiveRole(supabaseResponse, request, requestedRole);
    }

    const checkAccess = (prefix: string, requiredRole: Role) => {
      if (path.startsWith(prefix) && !hasAccessTo(role, requiredRole)) {
        return NextResponse.redirect(new URL(roleRoutes[role] || "/dashboard/user/feed", request.url));
      }
      return null;
    };

    const blocked =
      checkAccess("/dashboard/user", "subscriber") ||
      checkAccess("/dashboard/admin", "admin") ||
      checkAccess("/dashboard/creator", "creator") ||
      checkAccess("/dashboard/affiliate", "affiliate") ||
      checkAccess("/dashboard/blog", "editor");

    if (blocked) return blocked;
  }

  if (
    user &&
    (request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/register")
  ) {
    const baseRole = await resolveBaseRole(supabase, user);
    const activeRoleCookie = request.cookies.get(ACTIVE_ROLE_COOKIE)?.value || null;
    const role = resolveActiveRole(baseRole, activeRoleCookie);

    const url = request.nextUrl.clone();
    url.pathname = canAssumeRole(baseRole, role) && activeRoleCookie ? roleRoutes[role] : "/select-role";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
