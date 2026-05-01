export type WordPressAdapterPostPayload = {
  title?: string;
  content?: string;
  excerpt?: string;
  status?: "draft" | "publish" | "future";
  slug?: string;
  featured_media?: string | number | null;
  meta?: Record<string, unknown>;
};

export type WordPressAdapterMediaPayload = {
  url: string;
  title?: string;
  alt_text?: string;
};
