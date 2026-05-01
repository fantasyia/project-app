export const metadata = {
  title: "Entrar — Fantasyia",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-thin tracking-[-0.04em] text-white uppercase">
            Fantasy<span className="text-brand-500">ia</span>
          </h1>
          <p className="text-xs text-brand-text-muted mt-3 tracking-widest uppercase">Conteúdo Premium Exclusivo</p>
        </div>
        {children}
      </div>
    </div>
  );
}
