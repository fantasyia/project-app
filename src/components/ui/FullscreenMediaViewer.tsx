"use client";

import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import Image from "next/image";
import { Maximize, X } from "lucide-react";

export function FullscreenMediaViewer({
  src,
  alt,
  mediaType = "image",
  poster,
  children,
}: {
  src: string;
  alt?: string;
  mediaType?: "image" | "video";
  poster?: string;
  children: ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    if (!isOpen) return;

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }

    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, close]);

  return (
    <>
      <div
        onContextMenu={(event) => event.preventDefault()}
        className="relative block h-full w-full"
      >
        {children}
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur transition-opacity hover:bg-black/80"
          aria-label="Ver midia isolada"
        >
          <Maximize size={14} />
        </button>
      </div>

      {isOpen ? (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 p-3 backdrop-blur-sm md:p-8"
          onClick={close}
          onContextMenu={(event) => event.preventDefault()}
          role="dialog"
          aria-modal="true"
          aria-label="Visualizador de midia isolada"
        >
          <div
            onClick={(event) => event.stopPropagation()}
            className="relative h-[82dvh] w-full max-w-[768px] select-none md:h-[86vh]"
            style={{
              WebkitTouchCallout: "none",
              WebkitUserSelect: "none",
              userSelect: "none",
            }}
          >
            <button
              type="button"
              onClick={close}
              className="absolute right-2 top-2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/70 text-white backdrop-blur transition hover:bg-black/85"
              aria-label="Fechar"
            >
              <X size={20} />
            </button>
            {mediaType === "video" ? (
              <video
                src={src}
                poster={poster}
                controls
                controlsList="nodownload noplaybackrate nofullscreen"
                disablePictureInPicture
                playsInline
                draggable={false}
                className="fantasyia-no-native-fullscreen h-full w-full object-contain"
              />
            ) : (
              <Image
                src={src}
                alt={alt || ""}
                fill
                unoptimized
                draggable={false}
                className="object-contain"
              />
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
