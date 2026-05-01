import { NextResponse, type NextRequest } from "next/server";

// Use Node.js runtime instead of Edge to avoid incompatibilities with
// @supabase/ssr and other dependencies that may use Node.js APIs internally.
// This fixes MIDDLEWARE_INVOCATION_FAILED on Vercel.
export const runtime = "nodejs";

export async function middleware(request: NextRequest) {
  try {
    // Fail-fast if critical env vars are missing
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      console.error(
        "[middleware] Missing SUPABASE env vars:",
        {
          url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        }
      );
      return NextResponse.next();
    }

    const { updateSession } = await import("@/lib/supabase/middleware");
    return await updateSession(request);
  } catch (error) {
    console.error("[middleware] Unhandled error:", error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
