import Link from "next/link";
import { Unlock } from "lucide-react";

export function PpvUnlockButton({ postId, price }: { postId: string; price: string }) {
  return (
    <Link
      href={`/checkout/ppv/${postId}`}
      className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest text-black shadow-[0_0_15px_rgba(0,168,107,0.3)] transition-all hover:bg-brand-400"
    >
      <Unlock size={12} />
      {`Desbloquear R$ ${price}`}
    </Link>
  );
}
