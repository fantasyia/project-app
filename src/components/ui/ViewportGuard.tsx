"use client";

import { useEffect, useState } from "react";

export function ViewportGuard() {
  const [showPortraitHint, setShowPortraitHint] = useState(false);

  useEffect(() => {
    const updateOrientationHint = () => {
      const isLandscape = window.matchMedia("(orientation: landscape)").matches;
      const isTouchViewport =
        navigator.maxTouchPoints > 0 || window.matchMedia("(pointer: coarse)").matches;
      const isShortViewport = window.innerHeight < 620;
      setShowPortraitHint(isLandscape && isTouchViewport && isShortViewport);
    };

    const preventGesture = (event: Event) => {
      event.preventDefault();
    };

    const preventCtrlZoom = (event: WheelEvent) => {
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
      }
    };

    const preventZoomKeys = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey)) return;
      if (["+", "-", "=", "0"].includes(event.key)) {
        event.preventDefault();
      }
    };

    updateOrientationHint();
    window.addEventListener("resize", updateOrientationHint);
    window.addEventListener("orientationchange", updateOrientationHint);
    document.addEventListener("gesturestart", preventGesture, { passive: false });
    document.addEventListener("gesturechange", preventGesture, { passive: false });
    document.addEventListener("wheel", preventCtrlZoom, { passive: false });
    document.addEventListener("keydown", preventZoomKeys);

    return () => {
      window.removeEventListener("resize", updateOrientationHint);
      window.removeEventListener("orientationchange", updateOrientationHint);
      document.removeEventListener("gesturestart", preventGesture);
      document.removeEventListener("gesturechange", preventGesture);
      document.removeEventListener("wheel", preventCtrlZoom);
      document.removeEventListener("keydown", preventZoomKeys);
    };
  }, []);

  if (!showPortraitHint) return null;

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/92 px-6 text-center text-white backdrop-blur-md"
      role="status"
      aria-label="Modo vertical"
    >
      <div className="max-w-xs rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
        <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-brand-300">
          Modo vertical
        </p>
        <p className="mt-3 text-sm leading-6 text-brand-text-base">
          O Fantasyia foi desenhado para uso vertical. Gire o aparelho para continuar com a experiencia de app.
        </p>
      </div>
    </div>
  );
}
