import { PrivilegedRoleMenu } from "@/components/auth/PrivilegedRoleMenu";

export async function RoleSwitcher({
  align = "down",
}: {
  align?: "down" | "up";
} = {}) {
  return <PrivilegedRoleMenu align={align} />;
}
