import { RoleSwitcher } from "@/components/auth/RoleSwitcher";

export function MiniWordPressRoleMenu() {
  return (
    <div className="fixed right-4 top-3 z-[90]">
      <RoleSwitcher />
    </div>
  );
}
