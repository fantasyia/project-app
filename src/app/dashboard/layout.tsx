export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Cada area do dashboard tem shell proprio.
  // A rota publica canonica do usuario e /dashboard/user.
  // /dashboard/subscriber permanece apenas como alias legado para compatibilidade.
  return <>{children}</>;
}
