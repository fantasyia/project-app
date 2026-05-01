import { requireRole } from "./rbac";

type SubscriptionAccessStatus = "active" | "trialing";

type SubscriptionAccess = {
  hasAccess: boolean;
  status: SubscriptionAccessStatus | null;
};

/**
 * Checks subscription-level access for premium content.
 * Active and trialing subscriptions may unlock premium posts, but never PPV.
 */
export async function getSubscriptionAccess(
  subscriberId: string,
  creatorId: string
): Promise<SubscriptionAccess> {
  const supabase = (await import("@/lib/supabase/server")).createClient();
  const db = await supabase;

  const { data, error } = await db
    .from("subscriptions")
    .select("status, current_period_end")
    .eq("subscriber_id", subscriberId)
    .eq("creator_id", creatorId)
    .in("status", ["active", "trialing"])
    .gte("current_period_end", new Date().toISOString())
    .order("current_period_end", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return { hasAccess: false, status: null };

  return {
    hasAccess: true,
    status: data.status === "trialing" ? "trialing" : "active",
  };
}

export async function hasActiveSubscription(subscriberId: string, creatorId: string): Promise<boolean> {
  const access = await getSubscriptionAccess(subscriberId, creatorId);
  return access.hasAccess;
}

/**
 * Checks if a subscriber has explicitly unlocked a PPV post.
 */
export async function hasUnlockedPost(subscriberId: string, postId: string): Promise<boolean> {
  const supabase = (await import("@/lib/supabase/server")).createClient();
  const db = await supabase;

  const { data, error } = await db
    .from("ppv_unlocks")
    .select("id")
    .eq("subscriber_id", subscriberId)
    .eq("post_id", postId)
    .maybeSingle();

  if (error || !data) return false;
  return true;
}

/**
 * Validates if the current authenticated user can view a specific post.
 * PPV is evaluated before subscription so active/trialing access never unlocks it.
 */
export async function canViewPost(postId: string): Promise<boolean> {
  const { user, supabase } = await requireRole("subscriber");

  const { data: post, error } = await supabase
    .from("posts")
    .select("author_id, access_tier, price")
    .eq("id", postId)
    .maybeSingle();

  if (error || !post) return false;
  if (post.author_id === user.id) return true;

  const isPpv = Number.parseFloat(post.price || "0") > 0;
  if (isPpv) {
    return hasUnlockedPost(user.id, postId);
  }

  if (post.access_tier === "free") return true;

  if (post.access_tier === "premium") {
    const subscriptionAccess = await getSubscriptionAccess(user.id, post.author_id);
    if (subscriptionAccess.hasAccess) return true;
  }

  const hasPPV = await hasUnlockedPost(user.id, postId);
  if (hasPPV) return true;

  return false;
}
