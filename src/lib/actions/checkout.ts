"use server";

import { getCurrentUser } from "@/lib/actions/auth";
import { hasActiveSubscription, hasUnlockedPost } from "@/lib/auth/entitlement";
import { requireRole } from "@/lib/auth/rbac";
import { getCreatorIdentityByUserId } from "@/lib/identity/context-profiles";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const PLATFORM_FEE_RATE = 0.2;

type BillingCycle = {
  label: "Mensal" | "Trimestral" | "Anual";
  months: number;
};

type CreatorSummary = {
  id: string;
  display_name: string;
  handle: string;
  avatar_url: string | null;
  bio: string | null;
};

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

type WalletBalanceRow = {
  balance: string | null;
};

type IdReference = {
  id: string;
};

function normalizePlanId(planId: string) {
  return planId.startsWith("creator_") ? planId.slice("creator_".length) : planId;
}

function inferBillingCycle(planName: string, planDescription: string | null): BillingCycle {
  const source = `${planName} ${planDescription || ""}`.toLowerCase();

  if (/(anual|annual|yearly|12\s*mes|12x)/.test(source)) {
    return { label: "Anual", months: 12 };
  }

  if (/(trimestral|quarter|quarterly|3\s*mes|3x)/.test(source)) {
    return { label: "Trimestral", months: 3 };
  }

  return { label: "Mensal", months: 1 };
}

async function getCreatorSummaryById(creatorId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("users")
    .select("id, display_name, handle, avatar_url, bio")
    .eq("id", creatorId)
    .maybeSingle();
  if (!data) return null;

  const identity = await getCreatorIdentityByUserId(supabase, creatorId);
  return {
    ...(data as CreatorSummary),
    display_name: identity?.display_name || data.display_name,
    handle: identity?.handle || data.handle,
    avatar_url: identity?.avatar_url || data.avatar_url,
    bio: identity?.bio ?? data.bio,
  };
}

function toMoneyValue(value: string | number | null | undefined) {
  const parsed = typeof value === "number" ? value : Number.parseFloat(value || "0");
  return Number.isFinite(parsed) ? parsed : 0;
}

async function creditCreatorWallet(
  supabase: SupabaseServerClient,
  creatorId: string,
  amount: number
) {
  if (amount <= 0) return;

  const { data: wallet, error: walletError } = await supabase
    .from("wallets")
    .select("balance")
    .eq("user_id", creatorId)
    .maybeSingle();

  if (walletError) {
    console.warn("wallet lookup skipped:", walletError.message);
    return;
  }

  const nextBalance = (toMoneyValue((wallet as WalletBalanceRow | null)?.balance) + amount).toFixed(2);

  if (wallet) {
    const { error } = await supabase
      .from("wallets")
      .update({ balance: nextBalance, updated_at: new Date().toISOString() })
      .eq("user_id", creatorId);

    if (error) console.warn("wallet update skipped:", error.message);
    return;
  }

  const { error } = await supabase.from("wallets").insert({
    user_id: creatorId,
    balance: nextBalance,
    currency: "BRL",
  });

  if (error) console.warn("wallet insert skipped:", error.message);
}

async function recordLocalFinancialEvent({
  supabase,
  payerId,
  creatorId,
  amount,
  entryType,
  description,
  referenceId,
}: {
  supabase: SupabaseServerClient;
  payerId: string;
  creatorId: string;
  amount: number;
  entryType: "subscription" | "ppv_unlock";
  description: string;
  referenceId: string;
}) {
  const normalizedAmount = toMoneyValue(amount);
  if (normalizedAmount <= 0) return;

  const feeAmount = Number((normalizedAmount * PLATFORM_FEE_RATE).toFixed(2));
  const creatorNet = Number((normalizedAmount - feeAmount).toFixed(2));

  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .insert({
      user_id: payerId,
      amount: normalizedAmount.toFixed(2),
      currency: "BRL",
      status: "succeeded",
      description,
    })
    .select("id")
    .single();

  if (paymentError) {
    console.warn("payment event skipped:", paymentError.message);
  }

  const paymentId = (payment as IdReference | null)?.id || referenceId;

  const { error: ledgerError } = await supabase.from("financial_ledger").insert([
    {
      user_id: creatorId,
      entry_type: entryType,
      amount: normalizedAmount.toFixed(2),
      direction: "credit",
      reference_id: paymentId,
      description,
    },
    {
      user_id: creatorId,
      entry_type: "platform_fee",
      amount: feeAmount.toFixed(2),
      direction: "debit",
      reference_id: paymentId,
      description: "Taxa da plataforma (20%)",
    },
    {
      user_id: payerId,
      entry_type: entryType,
      amount: normalizedAmount.toFixed(2),
      direction: "debit",
      reference_id: paymentId,
      description,
    },
  ]);

  if (ledgerError) {
    console.warn("ledger event skipped:", ledgerError.message);
  }

  await creditCreatorWallet(supabase, creatorId, creatorNet);
}

export async function mockSubscribe(creatorId: string, planId: string) {
  try {
    const { user, supabase } = await requireRole("subscriber");
    const normalizedPlanId = normalizePlanId(planId);

    const { data: plan, error: planError } = await supabase
      .from("subscription_plans")
      .select("id, creator_id, name, description, price, is_active")
      .eq("id", normalizedPlanId)
      .maybeSingle();

    if (planError || !plan) return { error: "Plano nao encontrado." };
    if (!plan.is_active) return { error: "Este plano nao esta disponivel no momento." };
    if (plan.creator_id !== creatorId) return { error: "Plano invalido para este creator." };
    if (user.id === plan.creator_id) return { error: "Voce nao pode assinar o proprio perfil." };

    const { data: existing } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("subscriber_id", user.id)
      .eq("creator_id", plan.creator_id)
      .eq("status", "active")
      .maybeSingle();

    if (existing) return { error: "Voce ja possui assinatura ativa com este creator." };

    const billingCycle = inferBillingCycle(plan.name, plan.description);
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + billingCycle.months);

    const { data: subscription, error } = await supabase
      .from("subscriptions")
      .insert({
        subscriber_id: user.id,
        creator_id: plan.creator_id,
        plan_id: plan.id,
        stripe_subscription_id: `placeholder_sub_${Date.now()}`,
        status: "active",
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
      })
      .select("id")
      .single();

    if (error) return { error: error.message };

    await recordLocalFinancialEvent({
      supabase,
      payerId: user.id,
      creatorId: plan.creator_id,
      amount: toMoneyValue(plan.price),
      entryType: "subscription",
      description: `Assinatura ${plan.name} (${billingCycle.label})`,
      referenceId: (subscription as IdReference | null)?.id || plan.id,
    });

    const creator = await getCreatorSummaryById(plan.creator_id);

    revalidatePath("/dashboard/user/feed");
    revalidatePath("/dashboard/user/purchases");
    revalidatePath("/dashboard/user/account");
    revalidatePath("/dashboard/creator/studio");
    revalidatePath(`/checkout/${plan.id}`);
    revalidatePath(`/checkout/creator_${plan.id}`);

    if (creator?.handle) {
      revalidatePath(`/${creator.handle}`);
    }

    return {
      success: true,
      creatorHandle: creator?.handle || null,
      billingCycleLabel: billingCycle.label,
    };
  } catch (error) {
    if (error instanceof Error && /forbidden|unauthorized/i.test(error.message)) {
      return { error: "Apenas contas de usuario podem concluir assinaturas." };
    }
    return { error: error instanceof Error ? error.message : "Falha ao processar assinatura." };
  }
}

export async function mockUnlockPpv(postId: string) {
  try {
    const { user, supabase } = await requireRole("subscriber");

    const { data: existing } = await supabase
      .from("ppv_unlocks")
      .select("id")
      .eq("subscriber_id", user.id)
      .eq("post_id", postId)
      .maybeSingle();

    if (existing) return { error: "Conteudo ja desbloqueado." };

    const { data: post } = await supabase
      .from("posts")
      .select("id, content, price, author_id")
      .eq("id", postId)
      .maybeSingle();

    if (!post) return { error: "Post nao encontrado." };
    if (post.author_id === user.id) return { error: "Voce ja tem acesso a este conteudo." };
    if (Number.parseFloat(post.price || "0") <= 0) return { error: "Este post nao exige unlock PPV." };

    const { data: unlock, error } = await supabase
      .from("ppv_unlocks")
      .insert({
        subscriber_id: user.id,
        creator_id: post.author_id,
        post_id: postId,
        amount_paid: post.price || "0",
        currency: "BRL",
        stripe_payment_intent_id: `placeholder_ppv_${Date.now()}`,
      })
      .select("id")
      .single();

    if (error) return { error: error.message };

    await recordLocalFinancialEvent({
      supabase,
      payerId: user.id,
      creatorId: post.author_id,
      amount: toMoneyValue(post.price),
      entryType: "ppv_unlock",
      description: "Unlock PPV de post",
      referenceId: (unlock as IdReference | null)?.id || postId,
    });

    const creator = await getCreatorSummaryById(post.author_id);

    revalidatePath("/dashboard/user/feed");
    revalidatePath("/dashboard/user/purchases");
    revalidatePath("/dashboard/user/account");
    revalidatePath("/dashboard/creator/studio");
    revalidatePath(`/checkout/ppv/${postId}`);

    if (creator?.handle) {
      revalidatePath(`/${creator.handle}`);
    }

    return {
      success: true,
      creatorHandle: creator?.handle || null,
    };
  } catch (error) {
    if (error instanceof Error && /forbidden|unauthorized/i.test(error.message)) {
      return { error: "Apenas contas de usuario podem desbloquear PPV." };
    }
    return { error: error instanceof Error ? error.message : "Falha ao desbloquear PPV." };
  }
}

export async function getCreatorPlans() {
  const { user, supabase } = await requireRole("creator");

  const { data } = await supabase
    .from("subscription_plans")
    .select("*")
    .eq("creator_id", user.id)
    .order("price", { ascending: true });

  return data || [];
}

export async function createCreatorPlan(formData: FormData) {
  const { user, supabase } = await requireRole("creator");

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const price = formData.get("price") as string;

  if (!name || !price) return { error: "Nome e preco sao obrigatorios." };

  const { error } = await supabase.from("subscription_plans").insert({
    creator_id: user.id,
    name,
    description,
    price,
    currency: "BRL",
    stripe_price_id: `placeholder_price_${Date.now()}`,
    is_active: true,
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard/creator/plans");
  return { success: true };
}

export async function togglePlanActive(planId: string, isActive: boolean) {
  const { user, supabase } = await requireRole("creator");

  const { error } = await supabase
    .from("subscription_plans")
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq("id", planId)
    .eq("creator_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/creator/plans");
  return { success: true };
}

export async function deleteCreatorPlan(planId: string) {
  const { user, supabase } = await requireRole("creator");

  const { error } = await supabase
    .from("subscription_plans")
    .delete()
    .eq("id", planId)
    .eq("creator_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/creator/plans");
  return { success: true };
}

export async function getCreatorPublicPlans(creatorId: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("subscription_plans")
    .select("id, name, description, price, currency")
    .eq("creator_id", creatorId)
    .eq("is_active", true)
    .order("price", { ascending: true });

  return data || [];
}

export async function getSubscriptionCheckoutDetails(planId: string) {
  const normalizedPlanId = normalizePlanId(planId);
  const supabase = await createClient();
  const user = await getCurrentUser("subscriber");

  const { data: plan, error } = await supabase
    .from("subscription_plans")
    .select("id, creator_id, name, description, price, currency, is_active")
    .eq("id", normalizedPlanId)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !plan) return null;

  const creator = await getCreatorSummaryById(plan.creator_id);
  if (!creator) return null;

  const billingCycle = inferBillingCycle(plan.name, plan.description);
  const isAuthenticated = Boolean(user);
  const isOwner = user?.id === creator.id;
  const subscribed = user && !isOwner ? await hasActiveSubscription(user.id, creator.id) : false;

  return {
    plan: {
      id: plan.id,
      legacyId: `creator_${plan.id}`,
      name: plan.name,
      description: plan.description,
      price: plan.price,
      currency: plan.currency || "BRL",
      billingCycle,
    },
    creator,
    viewer: {
      isAuthenticated,
      isOwner,
      isSubscribed: subscribed,
    },
  };
}

export async function getPpvCheckoutDetails(postId: string) {
  const supabase = await createClient();
  const user = await getCurrentUser("subscriber");

  const { data: post, error } = await supabase
    .from("posts")
    .select("id, author_id, content, media_url, post_type, access_tier, price, created_at")
    .eq("id", postId)
    .maybeSingle();

  if (error || !post) return null;
  if (Number.parseFloat(post.price || "0") <= 0) return null;

  const creator = await getCreatorSummaryById(post.author_id);
  if (!creator) return null;

  const isAuthenticated = Boolean(user);
  const isOwner = user?.id === creator.id;
  const unlocked = user && !isOwner ? await hasUnlockedPost(user.id, post.id) : false;
  const subscribed = user && !isOwner ? await hasActiveSubscription(user.id, creator.id) : false;

  return {
    post: {
      id: post.id,
      content: post.content,
      mediaUrl: post.media_url,
      postType: post.post_type,
      accessTier: post.access_tier,
      price: post.price || "0",
      createdAt: post.created_at,
    },
    creator,
    viewer: {
      isAuthenticated,
      isOwner,
      hasUnlocked: unlocked,
      hasActiveSubscription: subscribed,
    },
  };
}
