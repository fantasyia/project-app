"use client";

import { useEffect, useRef, useState } from "react";

const storageKey = "fantasyia_feed_video_settings";

function readSettings() {
  if (typeof window === "undefined") return { muted: true, volume: 0.7 };
  try {
    const parsed = JSON.parse(window.localStorage.getItem(storageKey) || "{}");
    return {
      muted: typeof parsed.muted === "boolean" ? parsed.muted : true,
      volume: typeof parsed.volume === "number" ? parsed.volume : 0.7,
    };
  } catch {
    return { muted: true, volume: 0.7 };
  }
}

export function FeedVideoPlayer({
  src,
  poster,
  className,
  blurred = false,
  showControls = true,
}: {
  src: string;
  poster?: string;
  className?: string;
  blurred?: boolean;
  showControls?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [muted, setMuted] = useState(true);
  const [volume, setVolume] = useState(0.7);

  useEffect(() => {
    const settings = readSettings();
    setMuted(settings.muted);
    setVolume(settings.volume);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = muted;
    video.volume = volume;
    window.localStorage.setItem(storageKey, JSON.stringify({ muted, volume }));
  }, [muted, volume]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.65) {
          void video.play().catch(() => undefined);
        } else {
          video.pause();
        }
      },
      { threshold: [0, 0.65, 1] }
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative h-full w-full" onContextMenu={(event) => event.preventDefault()}>
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        muted={muted}
        playsInline
        loop
        preload="metadata"
        controls={showControls}
        controlsList="nodownload noplaybackrate nofullscreen"
        disablePictureInPicture
        draggable={false}
        onDoubleClick={(event) => event.preventDefault()}
        onVolumeChange={(event) => {
          const video = event.currentTarget;
          setMuted(video.muted);
          setVolume(video.volume);
        }}
        className={`fantasyia-no-native-fullscreen ${className || "h-full w-full object-cover"} ${blurred ? "scale-105 blur-md" : ""}`}
      />
    </div>
  );
}
