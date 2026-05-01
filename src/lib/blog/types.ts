export type BlogAuthorSummary = {
  display_name: string | null;
  handle: string | null;
  avatar_url?: string | null;
};

export type BlogArticleRecord = {
  id: string;
  author_id?: string | null;
  title: string;
  slug: string;
  excerpt?: string | null;
  content?: string | null;
  cover_image_url?: string | null;
  status?: string | null;
  created_at?: string | null;
  published_at?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  target_keyword?: string | null;
  canonical_path?: string | null;
  schema_type?: string | null;
  intent?: string | null;
  silo_id?: string | null;
  silo_role?: string | null;
  silo_group?: string | null;
  category?: string | null;
  tags?: string[] | null;
  author?: BlogAuthorSummary | null;
};

export type BlogSiloGroupRecord = {
  id?: string;
  key?: string;
  label: string;
  menu_order?: number | null;
  keywords?: string[] | null;
};

export type BlogSiloRecord = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  is_active?: boolean | null;
  show_in_navigation?: boolean | null;
  menu_order?: number | null;
  silo_groups?: BlogSiloGroupRecord[] | null;
};
