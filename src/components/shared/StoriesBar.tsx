"use client";

import Image from "next/image";
import { useState } from "react";
import { X } from "lucide-react";

type StoryGroup = {
  user: { id: string; display_name: string; avatar_url: string | null; handle: string };
  stories: Array<{ id: string; media_url: string; media_type: string; caption: string | null; created_at: string }>;
};

export function StoriesBar({ stories }: { stories: StoryGroup[] }) {
  const [viewingGroup, setViewingGroup] = useState<StoryGroup | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  function openStory(group: StoryGroup) {
    setViewingGroup(group);
    setActiveIndex(0);
  }

  function nextStory() {
    if (!viewingGroup) return;

    if (activeIndex < viewingGroup.stories.length - 1) {
      setActiveIndex(activeIndex + 1);
    } else {
      setViewingGroup(null);
    }
  }

  return (
    <>
      <div className="flex gap-3.5 overflow-x-auto px-4 py-3 scrollbar-hide">
        {/* Story Groups */}
        {stories.map((group) => (
          <button
            key={group.user.id}
            onClick={() => openStory(group)}
            className="flex flex-shrink-0 flex-col items-center gap-1"
          >
            <div className="h-[62px] w-[62px] rounded-full bg-gradient-to-br from-brand-500 via-brand-400 to-brand-accent p-[2.5px]">
              <div className="h-full w-full rounded-full border-2 border-black">
                <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-brand-surface-low text-sm font-bold text-brand-500">
                  {group.user.avatar_url ? (
                    <Image src={group.user.avatar_url} alt={group.user.display_name} fill unoptimized className="object-cover" />
                  ) : (
                    group.user.display_name?.[0]?.toUpperCase()
                  )}
                </div>
              </div>
            </div>
            <span className="max-w-[60px] truncate text-[10px] text-brand-text-muted">
              {group.user.display_name?.split(" ")[0]}
            </span>
          </button>
        ))}

        {stories.length === 0 && (
          <div className="flex min-h-[62px] items-center pl-2 text-xs text-brand-text-muted">
            <span>Siga creators para ver stories</span>
          </div>
        )}
      </div>

      {/* Story Viewer (fullscreen) */}
      {viewingGroup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black" onClick={nextStory}>
          {/* Progress bars */}
          <div className="absolute left-3 right-3 top-3 z-10 flex gap-1">
            {viewingGroup.stories.map((story, index) => (
              <div key={story.id} className="h-[2px] flex-1 overflow-hidden rounded-full bg-white/20">
                <div
                  className={`h-full rounded-full bg-white transition-all duration-300 ${
                    index < activeIndex ? "w-full" : index === activeIndex ? "w-full animate-[grow_5s_linear]" : "w-0"
                  }`}
                />
              </div>
            ))}
          </div>

          {/* User info */}
          <div className="absolute left-3 top-7 z-10 flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-brand-surface-low text-xs font-bold text-brand-500">
              {viewingGroup.user.avatar_url ? (
                <Image src={viewingGroup.user.avatar_url} alt="" width={32} height={32} unoptimized className="h-full w-full object-cover" />
              ) : (
                viewingGroup.user.display_name?.[0]?.toUpperCase()
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{viewingGroup.user.display_name}</p>
              <p className="text-[10px] text-white/50">
                {new Date(viewingGroup.stories[activeIndex]?.created_at).toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>

          <button
            onClick={(event) => {
              event.stopPropagation();
              setViewingGroup(null);
            }}
            className="absolute right-3 top-7 z-10 text-white/60 hover:text-white"
          >
            <X size={24} />
          </button>

          <Image
            src={viewingGroup.stories[activeIndex]?.media_url}
            alt={viewingGroup.stories[activeIndex]?.caption || "Story"}
            width={1080}
            height={1920}
            unoptimized
            className="max-h-full max-w-full object-contain"
          />

          {viewingGroup.stories[activeIndex]?.caption && (
            <div className="absolute bottom-16 left-6 right-6 text-center">
              <p className="inline-block rounded-xl bg-black/50 px-4 py-2 text-sm text-white backdrop-blur">
                {viewingGroup.stories[activeIndex].caption}
              </p>
            </div>
          )}
        </div>
      )}
    </>
  );
}
