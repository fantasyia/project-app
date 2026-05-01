import { MiniWordPressFrame } from "@/components/admin/MiniWordPressFrame";
import { MiniWordPressRoleMenu } from "@/components/admin/MiniWordPressRoleMenu";

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <MiniWordPressFrame>
      <MiniWordPressRoleMenu />
      {children}
    </MiniWordPressFrame>
  );
}
