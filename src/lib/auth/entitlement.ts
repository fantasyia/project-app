import { requireRole } from "./rbac";

export type CreatorPlanKey = "basic" | "premium" | "emerald";
export type PostContentTier = "basic" | "premium" | "emerald" | "ppv";
export type AccessSource =
  | "admin"
  | "owner"
  | "basic"
  | "premium"
  | "emerald"
  | "ppv_unlock"
  | "promotion"
  | "locked";

type SubscriptionAccessStatus = "active" | "trialing";

type SubscriptionAccess = {
  hasAccess: boolean;
  status: SubscriptionAccessStatus | null;
  planKey: CreatorPlanKey | null;
};

type SubscriptionRow = {
  status: string;
  current_period_end: string;
  plan?: { plan_key?: string | null } | Array<{ plan_key?: string | null }> | null;
};

type PromotionType = "basic_ppv" | "basic_chat";

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export function normalizePlanKey(planKey: string | null | undefined): CreatorPlanKey {
  if (planKey === "emerald") return "emerald";
  if (planKey === "premium") return "premium";
  return "basic";
}

export function normalizePostTier(input: {
  content_tier?: string | null;
  access_tier?: string | null;
  price?: string | number | null;
}): PostContentTier {
  if (input.content_tier === "ppv" || input.content_tier === "emerald" || input.content_tier === "premium") {
    return input.content_tier;
  }

  const price = typeof input.price === "number" ? input.price : Number.parseFloat(input.price || "0");
  if (Number.isFinite(price) && price > 0) return "ppv";
  if (input.access_tier === "premium") return "premium";
  return "basic";
}

export async function getSubscriptionAccess(
  subscriberId: string,
  creatorId: string
): Promise<SubscriptionAccess> {
  const supabase = (await import("@/lib/supabase/server")).createClient();
  const db = await supabase;

  const { data, error } = await db
    .from("subscriptions")
    .select("status, current_period_end, plan:subscription_plans(plan_key)")
    .eq("subscriber_id", subscriberId)
    .eq("creator_id", creatorId)
    .in("status", ["active", "trialing"])
    .gte("current_period_end", new Date().toISOString())
    .order("current_period_end", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return { hasAccess: false, status: null, planKey: null };

  const row = data as SubscriptionRow;
  const plan = firstRelation(row.plan);

  return {
    hasAccess: true,
    status: row.status === "trialing" ? "trialing" : "active",
    planKey: normalizePlanKey(plan?.plan_key || "premium"),
  };
}

export async function hasActiveSubscription(subscriberId: string, creatorId: string): Promise<boolean> {
  const access = await getSubscriptionAccess(subscriberId, creatorId);
  return access.hasAccess;
}

export async function hasEmeraldAccess(subscriberId: string, creatorId: string): Promise<boolean> {
  const access = await getSubscriptionAccess(subscriberId, creatorId);
  return access.planKey === "emerald";
}

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

export async function hasActiveCreatorPromotion(creatorId: string, promotionType: PromotionType) {
  const supabase = (await import("@/lib/supabase/server")).createClient();
  const db = await supabase;
  const now = new Date().toISOString();

  const { data, error } = await db
    .from("creator_promotions")
    .select("id")
    .eq("creator_id", creatorId)
    .eq("promotion_type", promotionType)
    .eq("is_active", true)
    .lte("starts_at", now)
    .gte("ends_at", now)
    .limit(1)
    .maybeSingle();

  return Boolean(!error && data);
}

async function isAdminSubscriberPersona(userId: string) {
  const supabase = (await import("@/lib/supabase/server")).createClient();
  const db = await supabase;
  const { data } = await db
    .from("admin_role_personas")
    .select("admin_user_id")
    .eq("persona_user_id", userId)
    .eq("role", "subscriber")
    .maybeSingle();

  return Boolean(data);
}

export async function canAccessCreatorContent(input: {
  viewerId: string | null;
  viewerRole?: string | null;
  creatorId: string;
  postId?: string;
  tier: PostContentTier;
}) {
  const { viewerId, viewerRole, creatorId, postId, tier } = input;

  if (viewerRole === "admin") return { hasAccess: true, source: "admin" as AccessSource };
  if (viewerId && viewerId === creatorId) return { hasAccess: true, source: "owner" as AccessSource };
  if (viewerId && viewerRole === "subscriber" && (await isAdminSubscriberPersona(viewerId))) {
    return { hasAccess: true, source: "emerald" as AccessSource };
  }
  if (tier === "basic") return { hasAccess: true, source: "basic" as AccessSource };
  if (!viewerId) return { hasAccess: false, source: "locked" as AccessSource };

  const subscription = await getSubscriptionAccess(viewerId, creatorId);

  if (tier === "premium" && subscription.hasAccess) {
    return {
      hasAccess: true,
      source: (subscription.planKey === "emerald" ? "emerald" : "premium") as AccessSource,
    };
  }

  if (tier === "emerald" && subscription.planKey === "emerald") {
    return { hasAccess: true, source: "emerald" as AccessSource };
  }

  if (tier === "ppv") {
    if (subscription.planKey === "emerald") return { hasAccess: true, source: "emerald" as AccessSource };
    if (postId && (await hasUnlockedPost(viewerId, postId))) {
      return { hasAccess: true, source: "ppv_unlock" as AccessSource };
    }
    if (await hasActiveCreatorPromotion(creatorId, "basic_ppv")) {
      return { hasAccess: true, source: "promotion" as AccessSource };
    }
  }

  return { hasAccess: false, source: "locked" as AccessSource };
}

export async function canUseDirectWithCreator(input: {
  viewerId: string;
  viewerRole?: string | null;
  creatorId: string;
}) {
  const { viewerId, viewerRole, creatorId } = input;

  if (viewerRole === "admin") return { hasAccess: true, source: "admin" as AccessSource };
  if (viewerId === creatorId) return { hasAccess: true, source: "owner" as AccessSource };
  if (viewerRole === "subscriber" && (await isAdminSubscriberPersona(viewerId))) {
    return { hasAccess: true, source: "emerald" as AccessSource };
  }

  const subscription = await getSubscriptionAccess(viewerId, creatorId);
  if (subscription.planKey === "premium" || subscription.planKey === "emerald") {
    return {
      hasAccess: true,
      source: subscription.planKey as AccessSource,
    };
  }

  if (await hasActiveCreatorPromotion(creatorId, "basic_chat")) {
    return { hasAccess: true, source: "promotion" as AccessSource };
  }

  return { hasAccess: false, source: "locked" as AccessSource };
}

export async function canViewPost(postId: string): Promise<boolean> {
  const { user, supabase } = await requireRole("subscriber");

  const { data: post, error } = await supabase
    .from("posts")
    .select("id, author_id, access_tier, content_tier, price")
    .eq("id", postId)
    .maybeSingle();

  if (error || !post) return false;

  const result = await canAccessCreatorContent({
    viewerId: user.id,
    viewerRole: "subscriber",
    creatorId: post.author_id,
    postId: post.id,
    tier: normalizePostTier(post),
  });

  return result.hasAccess;
}
