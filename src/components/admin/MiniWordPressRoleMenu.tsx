import { PrivilegedRoleMenu } from "@/components/auth/PrivilegedRoleMenu";

export function MiniWordPressRoleMenu() {
  return (
    <div className="fixed right-3 top-3 z-[90] flex items-center">
      <PrivilegedRoleMenu />
    </div>
  );
}
