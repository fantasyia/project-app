"use server";

import { createClient } from "@/lib/supabase/server";
import { getCreatorIdentityMap } from "@/lib/identity/context-profiles";
import { sanitizePersistedAvatarUrl } from "@/lib/media/post-media";
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
  price: string | null;
  created_at: string;
  author: FeedAuthorRow | null;
  likes?: Array<{ user_id: string }> | null;
  comments?: Array<{ id: string }> | null;
};

type SubscriptionRow = {
  creator_id: string;
  status: "active" | "trialing" | string;
};
type UnlockRow = { post_id: string };

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

  const creatorIds = Array.from(new Set(posts.map((post) => post.author_id)));
  const postIds = posts.map((post) => post.id);

  const { data: subsData } = await supabase
    .from("subscriptions")
    .select("creator_id, status")
    .eq("subscriber_id", user.id)
    .in("status", ["active", "trialing"])
    .gte("current_period_end", new Date().toISOString())
    .in("creator_id", creatorIds);
  const subscriptionAccessByCreator = new Map<string, "subscription" | "trial">(
    ((subsData || []) as SubscriptionRow[]).map((subscription): [string, "subscription" | "trial"] => [
      subscription.creator_id,
      subscription.status === "trialing" ? "trial" : "subscription",
    ])
  );

  const { data: unlocksData } = await supabase
    .from("ppv_unlocks")
    .select("post_id")
    .eq("subscriber_id", user.id)
    .in("post_id", postIds);
  const unlockedPostIds = new Set(((unlocksData || []) as UnlockRow[]).map((unlock) => unlock.post_id));

  return posts.map((post) => {
    const isPpv = Number.parseFloat(post.price || "0") > 0;
    let accessSource: "owner" | "ppv_unlock" | "free" | "subscription" | "trial" | "locked" = "locked";

    let hasAccess = false;
    if (post.author_id === user.id) {
      hasAccess = true;
      accessSource = "owner";
    } else if (isPpv && unlockedPostIds.has(post.id)) {
      hasAccess = true;
      accessSource = "ppv_unlock";
    } else if (post.access_tier === "free") {
      hasAccess = true;
      accessSource = "free";
    } else if (post.access_tier === "premium" && subscriptionAccessByCreator.has(post.author_id)) {
      hasAccess = true;
      accessSource = subscriptionAccessByCreator.get(post.author_id) || "subscription";
    }

    return {
      post: {
        id: post.id,
        authorId: post.author_id,
        content: hasAccess ? post.content : "Conteudo Exclusivo",
        mediaUrl: hasAccess ? post.media_url : null,
        previewMediaUrl: post.media_url,
        postType: post.post_type,
        accessTier: post.access_tier,
        price: post.price,
        isPpv,
        createdAt: post.created_at,
        isLocked: !hasAccess,
        accessSource,
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
    };
  });
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
