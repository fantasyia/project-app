"use server";

import { requireRole } from "@/lib/auth/rbac";

type WalletRow = {
  balance: string | null;
  currency: string | null;
};

type PostRow = {
  id: string;
  content: string | null;
  media_url: string | null;
  access_tier: string;
  price: string | null;
  created_at: string;
  likes?: Array<{ user_id: string }> | null;
  comments?: Array<{ id: string }> | null;
};

type PlanRow = {
  id: string;
  name: string;
  price: string;
  is_active: boolean;
};

type SubscriptionRow = {
  id: string;
  plan_id: string | null;
  status: string;
  current_period_end: string;
};

type PpvUnlockRow = {
  id: string;
  post_id: string | null;
  amount_paid: string;
  created_at: string;
};

type LedgerRow = {
  id: string;
  entry_type: string;
  amount: string;
  direction: "credit" | "debit" | string;
  description: string | null;
  created_at: string;
};

export async function getCreatorWallet() {
  const { user, supabase } = await requireRole("creator");

  const { data: wallet, error } = await supabase
    .from("wallets")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !wallet) {
    return {
      balance: "0",
      currency: "BRL",
    };
  }

  return {
    balance: wallet.balance,
    currency: wallet.currency,
  };
}

export async function getCreatorStudioSnapshot() {
  const { user, supabase } = await requireRole("creator");
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    { data: walletData },
    { data: postsData },
    { data: plansData },
    { data: subsData },
    { data: unlocksData },
    { data: ledgerData },
  ] = await Promise.all([
    supabase.from("wallets").select("balance, currency").eq("user_id", user.id).maybeSingle(),
    supabase
      .from("posts")
      .select("id, content, media_url, access_tier, price, created_at, likes(user_id), comments(id)")
      .eq("author_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("subscription_plans")
      .select("id, name, price, is_active")
      .eq("creator_id", user.id)
      .order("price", { ascending: true }),
    supabase
      .from("subscriptions")
      .select("id, plan_id, status, current_period_end")
      .eq("creator_id", user.id),
    supabase
      .from("ppv_unlocks")
      .select("id, post_id, amount_paid, created_at")
      .eq("creator_id", user.id)
      .order("created_at", { ascending: false })
      .limit(24),
    supabase
      .from("financial_ledger")
      .select("id, entry_type, amount, direction, description, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(12),
  ]);

  const wallet = walletData as WalletRow | null;
  const posts = (postsData || []) as PostRow[];
  const plans = (plansData || []) as PlanRow[];
  const subscriptions = (subsData || []) as SubscriptionRow[];
  const unlocks = (unlocksData || []) as PpvUnlockRow[];
  const ledger = (ledgerData || []) as LedgerRow[];

  const activeSubscriptions = subscriptions.filter((subscription) => {
    const validStatus = subscription.status === "active" || subscription.status === "trialing";
    return validStatus && new Date(subscription.current_period_end) >= now;
  });

  const activeSubscriptionCount = activeSubscriptions.length;
  const planMix = plans.map((plan) => {
    const subscribers = activeSubscriptions.filter((subscription) => subscription.plan_id === plan.id).length;
    const monthlyProjection = subscribers * Number.parseFloat(plan.price || "0");

    return {
      ...plan,
      subscribers,
      monthlyProjection,
    };
  });

  const ppvRevenue = unlocks.reduce((sum, unlock) => sum + Number.parseFloat(unlock.amount_paid || "0"), 0);
  const ppvRevenue30d = unlocks
    .filter((unlock) => new Date(unlock.created_at) >= thirtyDaysAgo)
    .reduce((sum, unlock) => sum + Number.parseFloat(unlock.amount_paid || "0"), 0);
  const recurringProjection = planMix.reduce((sum, plan) => sum + plan.monthlyProjection, 0);
  const ledgerCredit = ledger
    .filter((entry) => entry.direction === "credit")
    .reduce((sum, entry) => sum + Number.parseFloat(entry.amount || "0"), 0);
  const ledgerDebit = ledger
    .filter((entry) => entry.direction === "debit")
    .reduce((sum, entry) => sum + Number.parseFloat(entry.amount || "0"), 0);

  const freePosts = posts.filter((post) => post.access_tier === "free").length;
  const premiumPosts = posts.filter((post) => post.access_tier === "premium" && Number.parseFloat(post.price || "0") <= 0).length;
  const ppvPosts = posts.filter((post) => Number.parseFloat(post.price || "0") > 0).length;
  const recentPosts = posts.slice(0, 6).map((post) => ({
    ...post,
    likesCount: post.likes?.length || 0,
    commentsCount: post.comments?.length || 0,
    isPpv: Number.parseFloat(post.price || "0") > 0,
  }));

  return {
    wallet: {
      balance: wallet?.balance || "0",
      currency: wallet?.currency || "BRL",
    },
    totals: {
      posts: posts.length,
      freePosts,
      premiumPosts,
      ppvPosts,
      activeSubscriptions: activeSubscriptionCount,
      recurringProjection,
      ppvRevenue,
      ppvRevenue30d,
      totalUnlocks: unlocks.length,
      ledgerCredit,
      ledgerDebit,
      ledgerNet: ledgerCredit - ledgerDebit,
    },
    planMix,
    recentUnlocks: unlocks.slice(0, 5),
    recentLedger: ledger.slice(0, 6),
    recentPosts,
  };
}
