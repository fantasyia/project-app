"use server";

import { createClient } from "@/lib/supabase/server";
import { sanitizePersistedAvatarUrl } from "@/lib/media/post-media";
import { revalidatePath } from "next/cache";

type BookmarkAuthor = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  handle: string | null;
};

type BookmarkPost = {
  id: string;
  author_id?: string | null;
  content: string | null;
  media_url: string | null;
  post_type?: string | null;
  author?: BookmarkAuthor | null;
};

export type BookmarkItem = {
  id: string;
  collection: string | null;
  created_at: string;
  post: BookmarkPost | null;
};

type BookmarkCollectionRow = {
  collection: string | null;
};

type FollowRow = {
  following_id: string;
};

type StoryUser = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  handle: string;
};

type StoryRow = {
  id: string;
  user_id: string;
  media_url: string;
  media_type: string;
  caption: string | null;
  created_at: string;
  user: StoryUser | null;
};

export type StoryGroup = {
  user: StoryUser;
  stories: Array<{
    id: string;
    media_url: string;
    media_type: string;
    caption: string | null;
    created_at: string;
  }>;
};

type PurchasePost = {
  id: string;
  content: string | null;
  media_url: string | null;
  post_type: string | null;
};

type PurchaseMessage = {
  id: string;
  content: string | null;
  media_url: string | null;
  message_type: string | null;
};

type PurchaseCreator = {
  id: string;
  display_name: string | null;
  handle: string | null;
  avatar_url: string | null;
};

type PurchasePlan = {
  id: string;
  name: string;
  price: string;
  currency: string | null;
};

type SubscriptionPurchaseRow = {
  id: string;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string;
  plan: PurchasePlan | PurchasePlan[] | null;
  creator: PurchaseCreator | PurchaseCreator[] | null;
};

type TipPurchaseRow = {
  id: string;
  amount: string;
  message: string | null;
  created_at: string;
  creator: PurchaseCreator | PurchaseCreator[] | null;
};

export type PurchaseHistoryItem = {
  id: string;
  kind: "ppv_post" | "ppv_chat" | "subscription" | "tip";
  amount: string;
  created_at: string;
  title: string;
  description: string;
  status: string;
  creator: PurchaseCreator | null;
  periodEnd?: string | null;
  post: PurchasePost | null;
  message: PurchaseMessage | null;
};

function takeFirstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

// =============================
// BOOKMARKS
// =============================

export async function toggleBookmark(postId: string, collection: string = "default") {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  const { data: existingFavorite, error: favoriteLookupError } = await supabase
    .from("favorites")
    .select("post_id")
    .eq("user_id", user.id)
    .eq("post_id", postId)
    .maybeSingle();

  if (!favoriteLookupError) {
    if (existingFavorite) {
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
    return { success: true, bookmarked: !existingFavorite };
  }

  const { data: existingBookmark } = await supabase
    .from("bookmarks")
    .select("id")
    .eq("user_id", user.id)
    .eq("post_id", postId)
    .maybeSingle();

  if (existingBookmark) {
    await supabase.from("bookmarks").delete().eq("id", existingBookmark.id);
  } else {
    await supabase.from("bookmarks").insert({ user_id: user.id, post_id: postId, collection });
  }

  revalidatePath("/dashboard/user/feed");
  revalidatePath("/dashboard/user/bookmarks");
  return { success: true, bookmarked: !existingBookmark };
}

export async function getBookmarks(collection?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  if (collection && collection !== "default") return [];

  const { data: favoritesData, error: favoritesError } = await supabase
    .from("favorites")
    .select("user_id, post_id, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (!favoritesError && favoritesData) {
    const normalizedFavorites = favoritesData as Array<{
      user_id: string;
      post_id: string;
      created_at: string;
    }>;

    const postIds = normalizedFavorites.map((favorite) => favorite.post_id);
    const { data: postsData } = postIds.length
      ? await supabase
          .from("posts")
          .select("id, author_id, content, media_url, post_type")
          .in("id", postIds)
      : { data: [] as Array<{ id: string; author_id: string | null; content: string | null; media_url: string | null; post_type: string | null }> };

    const postsById = new Map(
      ((postsData || []) as Array<{ id: string; author_id: string | null; content: string | null; media_url: string | null; post_type: string | null }>).map((post) => [
        post.id,
        post,
      ])
    );

    const authorIds = Array.from(
      new Set(
        ((postsData || []) as Array<{ author_id: string | null }>).map((post) => post.author_id).filter(Boolean) as string[]
      )
    );

    const { data: authorsData } = authorIds.length
      ? await supabase
          .from("users")
          .select("id, display_name, avatar_url, handle")
          .in("id", authorIds)
      : { data: [] as BookmarkAuthor[] };

    const authorsById = new Map(
      ((authorsData || []) as BookmarkAuthor[]).map((author) => [
        author.id,
        {
          ...author,
          avatar_url: sanitizePersistedAvatarUrl(author.avatar_url),
        } satisfies BookmarkAuthor,
      ])
    );

    return normalizedFavorites.map((favorite) => {
      const post = postsById.get(favorite.post_id);
      const author = post?.author_id ? authorsById.get(post.author_id) || null : null;

      return {
        id: `${favorite.user_id}:${favorite.post_id}`,
        collection: "default",
        created_at: favorite.created_at,
        post: post
          ? {
              id: post.id,
              author_id: post.author_id,
              content: post.content,
              media_url: post.media_url,
              post_type: post.post_type,
              author,
            }
          : null,
      } satisfies BookmarkItem;
    });
  }

  let legacyQuery = supabase
    .from("bookmarks")
    .select("*, post:posts(*, author:users!posts_author_id_fkey(id, display_name, avatar_url, handle))")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (collection) legacyQuery = legacyQuery.eq("collection", collection);

  const { data: legacyData } = await legacyQuery;
  return (legacyData || []) as BookmarkItem[];
}

export async function getBookmarkCollections() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: favoritesData, error: favoritesError } = await supabase
    .from("favorites")
    .select("post_id")
    .eq("user_id", user.id)
    .limit(1);

  if (!favoritesError && (favoritesData || []).length > 0) {
    return ["default"];
  }

  const { data } = await supabase
    .from("bookmarks")
    .select("collection")
    .eq("user_id", user.id);

  const collections = [...new Set(((data || []) as BookmarkCollectionRow[]).map((bookmark) => bookmark.collection).filter(Boolean))];
  return collections as string[];
}

// =============================
// STORIES
// =============================

export async function createStory(mediaUrl: string, caption?: string, mediaType: string = "image") {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  const { error } = await supabase.from("stories").insert({
    user_id: user.id,
    media_url: mediaUrl,
    media_type: mediaType,
    caption,
  });

  if (error) return { error: error.message };
  return { success: true };
}

export async function getActiveStories() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Get stories from followed creators that haven't expired
  const { data: following } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", user.id);

  const followedIds = ((following || []) as FollowRow[]).map((follow) => follow.following_id);
  if (followedIds.length === 0) return [];

  const { data } = await supabase
    .from("stories")
    .select("*, user:users!stories_user_id_fkey(id, display_name, avatar_url, handle)")
    .in("user_id", followedIds)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  // Group by user
  const grouped: Record<string, StoryGroup> = {};
  ((data || []) as StoryRow[]).forEach((story) => {
    if (!story.user) return;

    if (!grouped[story.user_id]) {
      grouped[story.user_id] = {
        user: {
          ...story.user,
          avatar_url: sanitizePersistedAvatarUrl(story.user.avatar_url),
        },
        stories: [],
      };
    }

    grouped[story.user_id].stories.push({
      id: story.id,
      media_url: story.media_url,
      media_type: story.media_type,
      caption: story.caption,
      created_at: story.created_at,
    });
  });

  return Object.values(grouped);
}

export async function viewStory(storyId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("increment_story_views", { story_id: storyId });

  if (error) {
    // Fallback if RPC doesn't exist.
    await supabase.from("stories").update({ views_count: 1 }).eq("id", storyId);
  }
}

// =============================
// PURCHASE / UNLOCK HISTORY
// =============================

export async function getPurchaseHistory(): Promise<PurchaseHistoryItem[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: ppvData } = await supabase
    .from("ppv_unlocks")
    .select("id, amount_paid, created_at, creator:users!ppv_unlocks_creator_id_fkey(id, display_name, handle, avatar_url), post:posts(id, content, media_url, post_type), message:chat_messages(id, content, media_url, message_type)")
    .eq("subscriber_id", user.id)
    .order("created_at", { ascending: false });

  const ppvPurchases: PurchaseHistoryItem[] = (ppvData || []).map((unlock) => {
    const safeUnlock = unlock as {
      id: string;
      amount_paid: string;
      created_at: string;
      creator: PurchaseCreator | PurchaseCreator[] | null;
      post: PurchasePost | PurchasePost[] | null;
      message: PurchaseMessage | PurchaseMessage[] | null;
    };
    const post = takeFirstRelation(safeUnlock.post);
    const message = takeFirstRelation(safeUnlock.message);

    return {
      id: safeUnlock.id,
      kind: message ? "ppv_chat" : "ppv_post",
      amount: safeUnlock.amount_paid,
      created_at: safeUnlock.created_at,
      title: message ? "Unlock no chat" : "Compra avulsa",
      description: post?.content || message?.content || "Conteudo PPV desbloqueado",
      status: "Liberado",
      creator: (() => {
        const creator = takeFirstRelation(safeUnlock.creator);
        if (!creator) return null;
        return {
          ...creator,
          avatar_url: sanitizePersistedAvatarUrl(creator.avatar_url),
        };
      })(),
      post,
      message,
    } satisfies PurchaseHistoryItem;
  });

  const { data: subscriptionData } = await supabase
    .from("subscriptions")
    .select("id, status, current_period_start, current_period_end, created_at, plan:subscription_plans(id, name, price, currency), creator:users!subscriptions_creator_id_fkey(id, display_name, handle, avatar_url)")
    .eq("subscriber_id", user.id)
    .order("created_at", { ascending: false });

  const subscriptionPurchases: PurchaseHistoryItem[] = ((subscriptionData || []) as SubscriptionPurchaseRow[]).map((subscription) => {
    const plan = takeFirstRelation(subscription.plan);
    const creatorRelation = takeFirstRelation(subscription.creator);
    const creator = creatorRelation
      ? {
          ...creatorRelation,
          avatar_url: sanitizePersistedAvatarUrl(creatorRelation.avatar_url),
        }
      : null;

    return {
      id: subscription.id,
      kind: "subscription",
      amount: plan?.price || "0",
      created_at: subscription.created_at,
      title: plan?.name || "Assinatura",
      description: creator?.handle
        ? `Acesso recorrente ao creator @${creator.handle}`
        : "Acesso recorrente de assinatura",
      status: subscription.status,
      creator,
      periodEnd: subscription.current_period_end,
      post: null,
      message: null,
    } satisfies PurchaseHistoryItem;
  });

  const { data: tipData } = await supabase
    .from("tips")
    .select("id, amount, message, created_at, creator:users!tips_creator_id_fkey(id, display_name, handle, avatar_url)")
    .eq("sender_id", user.id)
    .order("created_at", { ascending: false });

  const tipPurchases: PurchaseHistoryItem[] = ((tipData || []) as TipPurchaseRow[]).map((tip) => {
    const creatorRelation = takeFirstRelation(tip.creator);
    const creator = creatorRelation
      ? {
          ...creatorRelation,
          avatar_url: sanitizePersistedAvatarUrl(creatorRelation.avatar_url),
        }
      : null;

    return {
      id: tip.id,
      kind: "tip",
      amount: tip.amount,
      created_at: tip.created_at,
      title: "Gorjeta enviada",
      description: tip.message || (creator?.handle ? `Mimo enviado para @${creator.handle}` : "Mimo enviado no chat"),
      status: "Confirmado",
      creator,
      post: null,
      message: null,
    } satisfies PurchaseHistoryItem;
  });

  return [...ppvPurchases, ...subscriptionPurchases, ...tipPurchases].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

// =============================
// REPORTS
// =============================

export async function reportContent(data: { postId?: string; userId?: string; messageId?: string; reason: string; description?: string }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  const { error } = await supabase.from("reports").insert({
    reporter_id: user.id,
    reported_user_id: data.userId || null,
    post_id: data.postId || null,
    chat_message_id: data.messageId || null,
    reason: data.reason,
    description: data.description,
  });

  if (error) return { error: error.message };
  return { success: true };
}
