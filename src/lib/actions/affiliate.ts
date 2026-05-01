"use server";

import { requireRole } from "@/lib/auth/rbac";
import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";

export async function generateAffiliateLink(postId?: string, creatorId?: string) {
  const { user, supabase } = await requireRole("affiliate");

  const utmCode = randomBytes(6).toString("hex");

  const { data, error } = await supabase.from("affiliate_links").insert({
    affiliate_id: user.id,
    creator_id: creatorId || null,
    post_id: postId || null,
    utm_code: utmCode,
  }).select().single();

  if (error) return { error: error.message };

  revalidatePath("/dashboard/affiliate/links");
  return { success: true, link: data, url: `${process.env.SITE_URL || 'http://localhost:3000'}/?ref=${utmCode}` };
}

export async function getAffiliateLinks() {
  const { user, supabase } = await requireRole("affiliate");

  const { data } = await supabase
    .from("affiliate_links")
    .select(`
      *,
      post:posts(id, content, media_url),
      creator:users!affiliate_links_creator_id_users_id_fk(id, display_name, handle),
      tracking:affiliate_tracking(id, is_conversion)
    `)
    .eq("affiliate_id", user.id)
    .order("created_at", { ascending: false });

  return data || [];
}

export async function getAffiliateStats() {
  const { user, supabase } = await requireRole("affiliate");

  const { data: links } = await supabase
    .from("affiliate_links")
    .select("id")
    .eq("affiliate_id", user.id);

  const linkIds = (links || []).map(l => l.id);

  if (linkIds.length === 0) return { totalLinks: 0, totalClicks: 0, totalConversions: 0 };

  const { count: totalClicks } = await supabase
    .from("affiliate_tracking")
    .select("id", { count: "exact", head: true })
    .in("link_id", linkIds);

  const { count: totalConversions } = await supabase
    .from("affiliate_tracking")
    .select("id", { count: "exact", head: true })
    .in("link_id", linkIds)
    .eq("is_conversion", true);

  return {
    totalLinks: linkIds.length,
    totalClicks: totalClicks || 0,
    totalConversions: totalConversions || 0,
  };
}

export async function trackAffiliateClick(utmCode: string, ipHash?: string, userAgent?: string) {
  const { createClient } = await import("@/lib/supabase/server");
  const db = await createClient();

  const { data: link } = await db
    .from("affiliate_links")
    .select("id")
    .eq("utm_code", utmCode)
    .single();

  if (!link) return;

  await db.from("affiliate_tracking").insert({
    link_id: link.id,
    ip_hash: ipHash,
    user_agent: userAgent,
  });
}

export async function getAffiliateEarnings() {
  const { user, supabase } = await requireRole("affiliate");

  const { data } = await supabase
    .from("affiliate_commissions")
    .select("amount, status, is_recurring, created_at")
    .eq("affiliate_id", user.id);

  const commissions = data || [];
  const totalEarned = commissions.reduce((sum, c) => sum + parseFloat(c.amount || "0"), 0);
  const pendingEarned = commissions.filter(c => c.status === "pending").reduce((sum, c) => sum + parseFloat(c.amount || "0"), 0);
  const paidEarned = commissions.filter(c => c.status === "paid").reduce((sum, c) => sum + parseFloat(c.amount || "0"), 0);
  const recurringCount = commissions.filter(c => c.is_recurring).length;

  return {
    totalEarned: totalEarned.toFixed(2),
    pendingEarned: pendingEarned.toFixed(2),
    paidEarned: paidEarned.toFixed(2),
    totalCommissions: commissions.length,
    recurringCount,
  };
}

export async function getAffiliateCommissions() {
  const { user, supabase } = await requireRole("affiliate");

  const { data } = await supabase
    .from("affiliate_commissions")
    .select(`
      *,
      link:affiliate_links(utm_code, creator:users!affiliate_links_creator_id_users_id_fk(display_name, handle))
    `)
    .eq("affiliate_id", user.id)
    .order("created_at", { ascending: false });

  return data || [];
}

export async function getCreatorsForAffiliate() {
  const supabase = (await import("@/lib/supabase/server")).createClient();
  const db = await supabase;

  const { data } = await db
    .from("users")
    .select("id, display_name, handle")
    .eq("role", "creator")
    .order("display_name", { ascending: true })
    .limit(100);

  return data || [];
}
