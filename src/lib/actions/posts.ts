"use server";

import { requireRole } from "@/lib/auth/rbac";
import { getCreatorIdentityMap } from "@/lib/identity/context-profiles";
import {
  attachThumbnailToMediaUrl,
  sanitizePersistedAvatarUrl,
  sanitizePublicAssetUrl,
} from "@/lib/media/post-media";
import { revalidatePath } from "next/cache";

type PostAuthorRow = {
  id: string;
  display_name: string | null;
  handle: string | null;
  avatar_url: string | null;
  role?: string | null;
};

type FeedPostRow = {
  id: string;
  author_id: string;
  media_url: string | null;
  post_type: string;
  access_tier: string;
  created_at: string;
  author: PostAuthorRow | null;
  likes?: Array<{ user_id: string }> | null;
  comments?: Array<{ id: string }> | null;
};

export async function createPost(formData: FormData) {
  const { user, supabase } = await requireRole("creator");

  const content = ((formData.get("content") as string) || "").trim();
  const requestedPostType = (formData.get("postType") as string) || "image";
  const requestedAccessTier = (formData.get("accessTier") as string) || "free";
  const ppvPrice = formData.get("ppvPrice") as string | null;
  const file = formData.get("media") as File | null;
  const thumbnailFile = formData.get("thumbnail_file") as File | null;

  if ((!file || file.size === 0) && !content) {
    return { error: "Envie uma midia ou escreva a legenda do post." };
  }

  const isPpv = requestedAccessTier === "ppv";
  const accessTier = requestedAccessTier === "free" ? "free" : "premium";
  const priceValue = isPpv ? Number.parseFloat(ppvPrice || "") : Number.NaN;

  if (isPpv && (!Number.isFinite(priceValue) || priceValue <= 0)) {
    return { error: "Informe um preco valido para o PPV." };
  }

  let mediaUrl: string | null = null;
  let thumbnailUrl: string | null = null;
  let postType = requestedPostType === "video" ? "video" : "image";

  if (file && file.size > 0) {
    const ext = file.name.split(".").pop();
    const fileName = `${user.id}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("post-media")
      .upload(fileName, file);

    if (uploadError) return { error: uploadError.message };

    const { data: urlData } = supabase.storage
      .from("post-media")
      .getPublicUrl(fileName);

    mediaUrl = sanitizePublicAssetUrl(urlData.publicUrl);

    if (file.type.startsWith("video/")) {
      postType = "video";
    } else if (file.type.startsWith("image/")) {
      postType = "image";
    }
  }

  if (postType === "video" && thumbnailFile instanceof File && thumbnailFile.size > 0) {
    const thumbnailExt = thumbnailFile.name.split(".").pop() || "jpg";
    const thumbnailName = `thumbnails/${user.id}/${Date.now()}.${thumbnailExt}`;

    const { error: thumbnailUploadError } = await supabase.storage
      .from("post-media")
      .upload(thumbnailName, thumbnailFile);

    if (thumbnailUploadError) return { error: thumbnailUploadError.message };

    const { data: thumbnailData } = supabase.storage
      .from("post-media")
      .getPublicUrl(thumbnailName);
    thumbnailUrl = sanitizePublicAssetUrl(thumbnailData.publicUrl);
  }

  if (postType === "video" && mediaUrl) {
    mediaUrl = attachThumbnailToMediaUrl(mediaUrl, thumbnailUrl);
  }

  const { error } = await supabase.from("posts").insert({
    author_id: user.id,
    content: content || null,
    post_type: postType,
    access_tier: accessTier,
    price: isPpv ? priceValue.toFixed(2) : null,
    media_url: mediaUrl,
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard/creator/posts");
  revalidatePath("/dashboard/creator/studio");
  revalidatePath("/dashboard/user/feed");
  return { success: true };
}

export async function deletePost(postId: string) {
  const { user, supabase } = await requireRole("creator");

  const { error } = await supabase
    .from("posts")
    .delete()
    .eq("id", postId)
    .eq("author_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/creator/studio");
  revalidatePath("/dashboard/user/feed");
  return { success: true };
}

export async function toggleLike(postId: string) {
  const { user, supabase } = await requireRole("subscriber");

  const { data: existing } = await supabase
    .from("likes")
    .select("*")
    .eq("user_id", user.id)
    .eq("post_id", postId)
    .maybeSingle();

  if (existing) {
    await supabase.from("likes").delete().eq("user_id", user.id).eq("post_id", postId);
  } else {
    const { error } = await supabase.from("likes").insert({ user_id: user.id, post_id: postId });
    if (error) return { error: error.message };

    const { data: post } = await supabase
      .from("posts")
      .select("author_id")
      .eq("id", postId)
      .maybeSingle();

    if (post?.author_id && post.author_id !== user.id) {
      await supabase.from("notifications").insert({
        user_id: post.author_id,
        type: "post_liked",
        title: "Nova curtida",
        body: "Um assinante curtiu sua postagem.",
        data: { post_id: postId, actor_id: user.id },
      });
    }
  }

  revalidatePath("/dashboard/user/feed");
  revalidatePath("/dashboard/creator/notifications");
  return { success: true, liked: !existing };
}

export async function addComment(postId: string, content: string) {
  const { user, supabase } = await requireRole("subscriber");
  const normalizedContent = content.trim();

  if (!postId) return { error: "Post invalido." };
  if (!normalizedContent) return { error: "Comentario vazio." };

  const { data: comment, error } = await supabase.from("comments").insert({
    post_id: postId,
    user_id: user.id,
    content: normalizedContent,
  }).select("id").single();

  if (error) return { error: error.message };

  const { data: post } = await supabase
    .from("posts")
    .select("author_id")
    .eq("id", postId)
    .maybeSingle();

  if (post?.author_id && post.author_id !== user.id) {
    await supabase.from("notifications").insert({
      user_id: post.author_id,
      type: "post_commented",
      title: "Novo comentario",
      body: normalizedContent.slice(0, 120),
      data: { post_id: postId, comment_id: comment?.id, actor_id: user.id },
    });
  }

  revalidatePath("/dashboard/user/feed");
  revalidatePath("/dashboard/creator/notifications");
  return { success: true };
}

export async function toggleFavorite(postId: string) {
  const { user, supabase } = await requireRole("subscriber");

  const { data: existing } = await supabase
    .from("favorites")
    .select("*")
    .eq("user_id", user.id)
    .eq("post_id", postId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("user_id", user.id)
      .eq("post_id", postId);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("favorites").insert({ user_id: user.id, post_id: postId });
    if (error) return { error: error.message };
  }

  revalidatePath("/dashboard/user/feed");
  revalidatePath("/dashboard/user/bookmarks");
  return { success: true, favorited: !existing };
}

export async function getFeed() {
  const supabase = (await import("@/lib/supabase/server")).createClient();
  const db = await supabase;

  const { data, error } = await db
    .from("posts")
    .select("*, author:users(id, display_name, handle, avatar_url, role), likes(user_id), comments(id)")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("getFeed error:", error.message);
    return [];
  }

  const rows = (data || []) as FeedPostRow[];
  const creatorIds = Array.from(new Set(rows.map((post) => post.author_id)));
  const creatorIdentityMap = await getCreatorIdentityMap(db, creatorIds);

  return rows.map((p) => ({
    ...p,
    authorId: p.author_id,
    mediaUrl: p.media_url,
    postType: p.post_type,
    accessTier: p.access_tier,
    createdAt: p.created_at,
    author: p.author
      ? (() => {
          const identity = creatorIdentityMap.get(p.author.id);
          return {
            id: p.author.id,
            displayName: identity?.display_name || p.author.display_name,
            handle: identity?.handle || p.author.handle,
            avatarUrl: sanitizePersistedAvatarUrl(identity?.avatar_url || p.author.avatar_url),
            role: p.author.role,
          };
        })()
      : null,
    likes: (p.likes || []).map((l) => ({ userId: l.user_id })),
    comments: p.comments || [],
  }));
}

export async function searchPosts(query: string) {
  const supabase = (await import("@/lib/supabase/server")).createClient();
  const db = await supabase;

  const { data, error } = await db
    .from("posts")
    .select("*, author:users(id, display_name, handle, avatar_url)")
    .ilike("content", `%${query}%`)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("searchPosts error:", error.message);
    return [];
  }

  const rows = (data || []) as FeedPostRow[];
  const creatorIds = Array.from(new Set(rows.map((post) => post.author_id)));
  const creatorIdentityMap = await getCreatorIdentityMap(db, creatorIds);

  return rows.map((p) => ({
    ...p,
    authorId: p.author_id,
    mediaUrl: p.media_url,
    postType: p.post_type,
    accessTier: p.access_tier,
    createdAt: p.created_at,
    author: p.author
      ? (() => {
          const identity = creatorIdentityMap.get(p.author.id);
          return {
            id: p.author.id,
            displayName: identity?.display_name || p.author.display_name,
            handle: identity?.handle || p.author.handle,
            avatarUrl: sanitizePersistedAvatarUrl(identity?.avatar_url || p.author.avatar_url),
          };
        })()
      : null,
  }));
}

export async function searchCreators(query: string) {
  const supabase = (await import("@/lib/supabase/server")).createClient();
  const db = await supabase;
  const normalizedQuery = query.trim().toLowerCase();

  const { data, error } = await db
    .from("users")
    .select("id, display_name, handle, avatar_url, role")
    .eq("role", "creator")
    .limit(200);

  if (error) {
    console.error("searchCreators error:", error.message);
    return [];
  }

  const creators = (data || []) as Array<{
    id: string;
    display_name: string | null;
    handle: string | null;
    avatar_url: string | null;
  }>;
  if (creators.length === 0) return [];

  const creatorIdentityMap = await getCreatorIdentityMap(
    db,
    creators.map((creator) => creator.id)
  );

  const withPublicIdentity = creators.map((creator) => {
    const identity = creatorIdentityMap.get(creator.id);
    return {
      id: creator.id,
      display_name: identity?.display_name || creator.display_name,
      handle: identity?.handle || creator.handle,
      avatar_url: sanitizePersistedAvatarUrl(identity?.avatar_url || creator.avatar_url),
    };
  });

  if (!normalizedQuery) {
    return withPublicIdentity.slice(0, 20);
  }

  return withPublicIdentity
    .filter((creator) => {
      const display = (creator.display_name || "").toLowerCase();
      const handle = (creator.handle || "").toLowerCase();
      return display.includes(normalizedQuery) || handle.includes(normalizedQuery);
    })
    .slice(0, 20);
}

export async function getMyPosts() {
  const { user, supabase } = await requireRole("creator");

  const { data, error } = await supabase
    .from("posts")
    .select("*, likes(user_id), comments(id)")
    .eq("author_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getMyPosts error:", error.message);
    return [];
  }

  return data || [];
}
