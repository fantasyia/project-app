"use server";

import { createClient } from "@/lib/supabase/server";
import { getCreatorIdentityMap } from "@/lib/identity/context-profiles";
import { sanitizePersistedAvatarUrl } from "@/lib/media/post-media";
import { canAccessCreatorContent, normalizePostTier, type AccessSource } from "@/lib/auth/entitlement";
import { getCurrentUser } from "./auth";
import { revalidatePath } from "next/cache";

type FeedAuthorRow = {
  id: string;
  display_name: string | null;
  handle: string | null;
  avatar_url: string | null;
};

type FeedPostRow = {
  id: string;
  author_id: string;
  content: string | null;
  media_url: string | null;
  post_type: string;
  access_tier: string;
  content_tier?: string | null;
  price: string | null;
  created_at: string;
  author: FeedAuthorRow | null;
  likes?: Array<{ user_id: string }> | null;
  comments?: Array<{ id: string }> | null;
};

type PostRelationRow = { post_id: string };

export async function getFeed() {
  const user = await getCurrentUser("subscriber");
  if (!user) throw new Error("Nao autorizado");

  const supabase = await createClient();

  let { data, error } = await supabase
    .from("posts")
    .select("*, author:users!posts_author_id_users_id_fk(id, display_name, handle, avatar_url), likes(user_id), comments(id)")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    const fallback = await supabase
      .from("posts")
      .select("*, author:users(id, display_name, handle, avatar_url), likes(user_id), comments(id)")
      .order("created_at", { ascending: false })
      .limit(20);

    data = fallback.data;
    error = fallback.error;
  }

  if (error) {
    console.error("getFeed (subscriber) error:", error.message);
    return [];
  }

  const posts = (data || []) as FeedPostRow[];
  if (posts.length === 0) return [];
  const creatorIdentityMap = await getCreatorIdentityMap(
    supabase,
    Array.from(new Set(posts.map((post) => post.author_id)))
  );

  const postIds = posts.map((post) => post.id);

  const [{ data: myLikesData }, { data: myFavoritesData }] = await Promise.all([
    supabase.from("likes").select("post_id").eq("user_id", user.id).in("post_id", postIds),
    supabase.from("favorites").select("post_id").eq("user_id", user.id).in("post_id", postIds),
  ]);
  const likedPostIds = new Set(((myLikesData || []) as PostRelationRow[]).map((like) => like.post_id));
  const favoritePostIds = new Set(
    ((myFavoritesData || []) as PostRelationRow[]).map((favorite) => favorite.post_id)
  );

  const feed = [];

  for (const post of posts) {
    const contentTier = normalizePostTier(post);
    const access = await canAccessCreatorContent({
      viewerId: user.id,
      viewerRole: user.role,
      creatorId: post.author_id,
      postId: post.id,
      tier: contentTier,
    });
    const hasAccess = access.hasAccess;
    const isPpv = contentTier === "ppv";

    feed.push({
      post: {
        id: post.id,
        authorId: post.author_id,
        content: hasAccess ? post.content : "Conteudo exclusivo",
        mediaUrl: hasAccess ? post.media_url : null,
        previewMediaUrl: post.media_url,
        postType: post.post_type,
        accessTier: post.access_tier,
        contentTier,
        price: post.price,
        isPpv,
        createdAt: post.created_at,
        isLocked: !hasAccess,
        accessSource: (hasAccess ? access.source : "locked") as AccessSource,
      },
      author: post.author
        ? {
            id: post.author.id,
            displayName:
              creatorIdentityMap.get(post.author.id)?.display_name || post.author.display_name,
            handle: creatorIdentityMap.get(post.author.id)?.handle || post.author.handle,
            avatarUrl:
              sanitizePersistedAvatarUrl(creatorIdentityMap.get(post.author.id)?.avatar_url || post.author.avatar_url),
          }
        : null,
      likesCount: post.likes?.length || 0,
      commentsCount: post.comments?.length || 0,
      likedByMe: likedPostIds.has(post.id),
      favoritedByMe: favoritePostIds.has(post.id),
    });
  }

  return feed;
}

export async function likePost(actionState: unknown, formData: FormData) {
  const user = await getCurrentUser("subscriber");
  if (!user) return { message: "Voce precisa estar logado para curtir." };

  const postId = formData.get("postId") as string;
  if (!postId) return { message: "Post nao encontrado." };

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("likes")
    .select("*")
    .eq("user_id", user.id)
    .eq("post_id", postId)
    .maybeSingle();

  if (existing) {
    await supabase.from("likes").delete().eq("user_id", user.id).eq("post_id", postId);
    revalidatePath("/dashboard/user/feed");
    return { message: "Curtida removida" };
  }

  await supabase.from("likes").insert({ user_id: user.id, post_id: postId });
  revalidatePath("/dashboard/user/feed");
  return { message: "Post curtido" };
}
