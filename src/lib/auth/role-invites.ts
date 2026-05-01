import { createHmac, timingSafeEqual } from "crypto";
import type { Role } from "./roles";
import { normalizeRole } from "./roles";

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const INVITABLE_ROLES: Role[] = ["creator", "affiliate", "editor", "subscriber"];

type InvitePayload = {
  role: Role;
  note: string | null;
  exp: number;
};

function getInviteSecret() {
  return (
    process.env.AUTH_INVITE_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "fantasyia-local-invite-secret"
  );
}

function signPayload(encodedPayload: string) {
  return createHmac("sha256", getInviteSecret()).update(encodedPayload).digest("base64url");
}

function isInvitableRole(role: Role) {
  return INVITABLE_ROLES.includes(role);
}

export function createRoleInviteToken(rawRole: string, note?: string | null) {
  const role = normalizeRole(rawRole);
  if (!isInvitableRole(role)) return { error: "Esse tipo de conta nao exige convite." };

  const payload: InvitePayload = {
    role,
    note: note?.trim().slice(0, 80) || null,
    exp: Date.now() + INVITE_TTL_MS,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = signPayload(encodedPayload);

  return { token: `${encodedPayload}.${signature}`, payload };
}

export function verifyRoleInviteToken(token?: string | null) {
  if (!token) return null;

  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return null;

  const expectedSignature = signPayload(encodedPayload);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8")
    ) as InvitePayload;
    const role = normalizeRole(payload.role);
    if (!isInvitableRole(role) || payload.exp < Date.now()) return null;

    return {
      role,
      note: typeof payload.note === "string" ? payload.note : null,
      exp: payload.exp,
    };
  } catch {
    return null;
  }
}
