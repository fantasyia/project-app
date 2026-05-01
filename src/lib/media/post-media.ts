export function sanitizePublicAssetUrl(value: string | null | undefined) {
  if (!value || typeof value !== "string") return null;
  const normalized = value.trim();
  if (!normalized) return null;
  if (/^(blob:|data:|javascript:)/i.test(normalized)) return null;
  return normalized;
}

export function sanitizePersistedAvatarUrl(value: string | null | undefined) {
  return sanitizePublicAssetUrl(value);
}

export function attachThumbnailToMediaUrl(mediaUrl: string, thumbnailUrl: string | null | undefined) {
  const safeMediaUrl = sanitizePublicAssetUrl(mediaUrl);
  if (!safeMediaUrl) return null;

  const safeThumbnailUrl = sanitizePublicAssetUrl(thumbnailUrl);
  if (!safeThumbnailUrl) return safeMediaUrl;

  return `${safeMediaUrl}#thumb=${encodeURIComponent(safeThumbnailUrl)}`;
}

export function parsePostMediaAsset(rawMediaUrl: string | null | undefined) {
  const sanitized = sanitizePublicAssetUrl(rawMediaUrl);
  if (!sanitized) {
    return {
      mediaUrl: null,
      posterUrl: null,
      isVideo: false,
    };
  }

  const [baseUrl, hash = ""] = sanitized.split("#");
  const cleanMediaUrl = sanitizePublicAssetUrl(baseUrl);
  const thumbnailParam = hash
    .split("&")
    .map((chunk) => chunk.trim())
    .find((chunk) => chunk.startsWith("thumb="));

  let posterUrl: string | null = null;
  if (thumbnailParam) {
    const encoded = thumbnailParam.slice("thumb=".length);
    try {
      posterUrl = sanitizePublicAssetUrl(decodeURIComponent(encoded));
    } catch {
      posterUrl = null;
    }
  }

  const normalizedPath = (cleanMediaUrl || "").split("?")[0].toLowerCase();
  const isVideo = /\.(mp4|webm|mov|m4v|ogg)$/i.test(normalizedPath);

  return {
    mediaUrl: cleanMediaUrl,
    posterUrl,
    isVideo,
  };
}
