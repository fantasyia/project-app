"use server";

import { createClient } from "@/lib/supabase/server";

type WalletBalanceRow = {
  balance: string | null;
};

function toMoneyValue(value: string | number | null | undefined) {
  const parsed = typeof value === "number" ? value : Number.parseFloat(value || "0");
  return Number.isFinite(parsed) ? parsed : 0;
}

async function creditWallet(userId: string, amount: number) {
  if (amount <= 0) return;

  const supabase = await createClient();
  const { data: wallet, error: walletError } = await supabase
    .from("wallets")
    .select("balance")
    .eq("user_id", userId)
    .maybeSingle();

  if (walletError) return;

  const nextBalance = (toMoneyValue((wallet as WalletBalanceRow | null)?.balance) + amount).toFixed(2);

  if (wallet) {
    await supabase
      .from("wallets")
      .update({ balance: nextBalance, updated_at: new Date().toISOString() })
      .eq("user_id", userId);
    return;
  }

  await supabase.from("wallets").insert({
    user_id: userId,
    balance: nextBalance,
    currency: "BRL",
  });
}

// =============================
// PAYMENTS & LEDGER
// =============================

export async function getPaymentHistory() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("payments")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return data || [];
}

export async function getWallet() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase.from("wallets").select("*").eq("user_id", user.id).single();

  return data;
}

export async function getCreatorEarnings(creatorId?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { entries: [], totals: { credit: 0, debit: 0, net: 0 } };

  const targetId = creatorId || user.id;

  const { data: entries } = await supabase
    .from("financial_ledger")
    .select("*")
    .eq("user_id", targetId)
    .order("created_at", { ascending: false })
    .limit(100);

  const safe = entries || [];
  const credit = safe
    .filter((entry) => entry.direction === "credit")
    .reduce((sum, entry) => sum + Number(entry.amount), 0);
  const debit = safe
    .filter((entry) => entry.direction === "debit")
    .reduce((sum, entry) => sum + Number(entry.amount), 0);

  return { entries: safe, totals: { credit, debit, net: credit - debit } };
}

// =============================
// TIPS
// =============================

export async function sendTip(creatorId: string, amount: number, message?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Nao autenticado" };
  if (user.id === creatorId) return { error: "Voce nao pode enviar gorjeta para o proprio perfil." };
  if (!Number.isFinite(amount) || amount <= 0) return { error: "Valor de gorjeta invalido." };

  const normalizedMessage = message?.trim() || null;

  // Create payment first
  const { data: payment, error: payErr } = await supabase
    .from("payments")
    .insert({
      user_id: user.id,
      amount,
      currency: "BRL",
      status: "succeeded",
      description: "Gorjeta para creator",
    })
    .select("id")
    .single();

  if (payErr) return { error: payErr.message };

  // Create tip
  const { error: tipErr } = await supabase.from("tips").insert({
    sender_id: user.id,
    creator_id: creatorId,
    amount,
    message: normalizedMessage,
    payment_id: payment.id,
  });

  if (tipErr) return { error: tipErr.message };

  // Ledger entries
  await supabase.from("financial_ledger").insert([
    {
      user_id: creatorId,
      entry_type: "tip",
      amount,
      direction: "credit",
      reference_id: payment.id,
      description: "Gorjeta recebida",
    },
    {
      user_id: creatorId,
      entry_type: "platform_fee",
      amount: amount * 0.2,
      direction: "debit",
      reference_id: payment.id,
      description: "Taxa da plataforma (20%)",
    },
  ]);

  await creditWallet(creatorId, amount * 0.8);

  return { success: true };
}

// =============================
// REFUNDS (admin)
// =============================

export async function getRefundRequests() {
  const supabase = await createClient();
  const { data } = await supabase.from("refunds").select("*, payment:payments(*)").order("created_at", { ascending: false });

  return data || [];
}

export async function processRefund(refundId: string, action: "approved" | "rejected") {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Nao autenticado" };

  await supabase
    .from("refunds")
    .update({ status: action, processed_by: user.id, processed_at: new Date().toISOString() })
    .eq("id", refundId);

  return { success: true };
}

// =============================
// CHARGEBACKS (admin)
// =============================

export async function getChargebackCases() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("chargeback_cases")
    .select("*, payment:payments(*)")
    .order("created_at", { ascending: false });

  return data || [];
}

export async function updateChargebackStatus(caseId: string, status: string) {
  const supabase = await createClient();
  await supabase
    .from("chargeback_cases")
    .update({
      status,
      resolved_at: status === "won" || status === "lost" || status === "closed" ? new Date().toISOString() : null,
    })
    .eq("id", caseId);

  return { success: true };
}
