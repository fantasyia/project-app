export function MiniWordPressFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-app min-h-screen bg-[#1f1e26] text-white">
      {children}
    </div>
  );
}
