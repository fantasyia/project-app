export type Role = "admin" | "creator" | "affiliate" | "editor" | "subscriber";

// Mapeamento transitório para suportar papéis legados no metadata
const roleAliases: Record<string, Role> = {
  "writer": "editor",
  "blog": "editor",
  "subscriber": "subscriber",
  "creator": "creator",
  "affiliate": "affiliate",
  "admin": "admin"
};

/**
 * Normaliza a string da role vinda do metadata para o tipo canônico
 */
export function normalizeRole(rawRole?: string | null): Role {
  if (!rawRole) return "subscriber";
  return roleAliases[rawRole] || "subscriber";
}

/**
 * Isolamento estrito de areas privadas.
 * Cada role navega apenas na propria area; admin opera somente o Admin CRM.
 */
export function hasAccessTo(userRole: Role, requiredRole: Role): boolean {
  return userRole === requiredRole;
}
