import { MiniWordPressFrame } from "@/components/admin/MiniWordPressFrame";

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <MiniWordPressFrame>
      {children}
    </MiniWordPressFrame>
  );
}
