"use server";

import { requireRole } from "@/lib/auth/rbac";
import { revalidatePath } from "next/cache";

export async function getAllUsers(roleFilter?: string) {
  const { supabase } = await requireRole("admin");
  let query = supabase.from("users").select("*").order("created_at", { ascending: false });

  if (roleFilter && roleFilter !== "all") {
    query = query.eq("role", roleFilter);
  }

  const { data, error } = await query;
  if (error) {
    console.error("getAllUsers error:", error.message);
    return [];
  }
  return data || [];
}

export async function getAdminStats() {
  const { supabase } = await requireRole("admin");

  const [usersRes, postsRes, creatorsRes, subscribersRes] = await Promise.all([
    supabase.from("users").select("*", { count: "exact", head: true }),
    supabase.from("posts").select("*", { count: "exact", head: true }),
    supabase.from("users").select("*", { count: "exact", head: true }).eq("role", "creator"),
    supabase.from("users").select("*", { count: "exact", head: true }).eq("role", "subscriber"),
  ]);

  return {
    totalUsers: usersRes.count || 0,
    totalPosts: postsRes.count || 0,
    totalCreators: creatorsRes.count || 0,
    totalSubscribers: subscribersRes.count || 0,
  };
}

export async function updateUserRole(userId: string, role: string) {
  const { supabase } = await requireRole("admin");

  const { error } = await supabase
    .from("users")
    .update({ role, updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/admin/users");
  return { success: true };
}

export async function getPendingKycCreators() {
  const { supabase } = await requireRole("admin");

  const { data: profiles, error } = await supabase
    .from("creator_profiles")
    .select("kyc_status, user_id")
    .eq("kyc_status", "pending")
    .order("user_id", { ascending: false });

  if (error) {
    console.error("getPendingKycCreators error:", error.message);
    return [];
  }

  const userIds = (profiles || []).map((profile) => profile.user_id).filter(Boolean);
  if (userIds.length === 0) return [];

  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("id, display_name, handle, created_at")
    .in("id", userIds);

  if (usersError) {
    console.error("getPendingKycCreators users error:", usersError.message);
  }

  const usersById = new Map((users || []).map((user) => [user.id, user]));

  return (profiles || []).map((profile) => ({
    ...profile,
    user: usersById.get(profile.user_id) || null,
  }));
}

export async function updateKycStatus(userId: string, newStatus: "approved" | "rejected") {
  const { supabase } = await requireRole("admin");

  const { error } = await supabase
    .from("creator_profiles")
    .update({ kyc_status: newStatus })
    .eq("user_id", userId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/admin/kyc");
  return { success: true };
}

export async function getGlobalFeedAudit() {
  const { supabase } = await requireRole("admin");

  const { data, error } = await supabase
    .from("posts")
    .select("*, author:users!posts_author_id_users_id_fk(id, display_name, handle)")
    .order("created_at", { ascending: false })
    .limit(50); // Get latest 50 posts regardless of visibility

  if (error) {
    console.error("getGlobalFeedAudit error:", error.message);
    return [];
  }

  const creatorIds = Array.from(new Set((data || []).map((post) => post.author_id).filter(Boolean)));
  const { data: warnings } = creatorIds.length > 0
    ? await supabase
        .from("creator_warnings")
        .select("creator_id")
        .in("creator_id", creatorIds)
    : { data: [] };
  const { data: profiles } = creatorIds.length > 0
    ? await supabase
        .from("creator_profiles")
        .select("user_id, is_blocked")
        .in("user_id", creatorIds)
    : { data: [] };

  const warningCounts = new Map<string, number>();
  for (const warning of warnings || []) {
    warningCounts.set(warning.creator_id, (warningCounts.get(warning.creator_id) || 0) + 1);
  }
  const blockedByCreator = new Map((profiles || []).map((profile) => [profile.user_id, Boolean(profile.is_blocked)]));

  return (data || []).map((post) => ({
    ...post,
    warning_count: warningCounts.get(post.author_id) || 0,
    creator_blocked: blockedByCreator.get(post.author_id) || false,
  }));
}

export async function forceDeletePost(postId: string) {
  const { supabase } = await requireRole("admin");

  // Admin bypasses author_id check
  const { error } = await supabase
    .from("posts")
    .delete()
    .eq("id", postId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/admin/moderation");
  return { success: true };
}

async function createModerationNotification(
  supabase: Awaited<ReturnType<typeof requireRole>>["supabase"],
  creatorId: string,
  title: string,
  body: string,
  data: Record<string, unknown>
) {
  await supabase.from("notifications").insert({
    user_id: creatorId,
    type: "moderation_warning",
    title,
    body,
    data,
  });
}

async function sendModerationEmail() {
  return "supabase_email_not_configured";
}

export async function warnCreatorForPost(postId: string, reason: string, recommendation = "") {
  const { user, adminUser, supabase } = await requireRole("admin");
  const normalizedReason = reason.trim();
  const normalizedRecommendation = recommendation.trim();

  if (!normalizedReason) return { error: "Informe o motivo da advertencia." };

  const { data: post } = await supabase
    .from("posts")
    .select("id, author_id")
    .eq("id", postId)
    .maybeSingle();

  if (!post?.author_id) return { error: "Post nao encontrado." };

  const { error } = await supabase.from("creator_warnings").insert({
    creator_id: post.author_id,
    post_id: post.id,
    admin_id: adminUser?.id || user.id,
    reason: normalizedReason,
  });

  if (error) return { error: error.message };

  const emailStatus = await sendModerationEmail();
  await supabase.from("moderation_actions").insert({
    action_type: normalizedRecommendation ? "recommendation" : "warning",
    creator_id: post.author_id,
    post_id: post.id,
    admin_user_id: adminUser?.id || user.id,
    persona_user_id: user.id !== adminUser?.id ? user.id : null,
    reason: normalizedReason,
    recommendation: normalizedRecommendation || null,
    email_status: emailStatus,
  });

  await createModerationNotification(
    supabase,
    post.author_id,
    "Advertencia de midia",
    normalizedRecommendation
      ? `${normalizedReason} Orientacao: ${normalizedRecommendation}`
      : normalizedReason,
    { post_id: post.id, reason: normalizedReason, recommendation: normalizedRecommendation || null }
  );

  revalidatePath("/dashboard/admin/moderation");
  return { success: true };
}

export async function blockCreator(creatorId: string, reason = "3 advertencias acumuladas") {
  const { user, adminUser, supabase } = await requireRole("admin");

  const { data: warnings } = await supabase
    .from("creator_warnings")
    .select("id")
    .eq("creator_id", creatorId);

  if ((warnings || []).length < 3) {
    return { error: "O creator precisa ter 3 advertencias antes do bloqueio." };
  }

  const { error } = await supabase
    .from("creator_profiles")
    .update({
      is_blocked: true,
      blocked_at: new Date().toISOString(),
      blocked_by: adminUser?.id || user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", creatorId);

  if (error) return { error: error.message };

  const emailStatus = await sendModerationEmail();
  await supabase.from("moderation_actions").insert({
    action_type: "block",
    creator_id: creatorId,
    admin_user_id: adminUser?.id || user.id,
    persona_user_id: user.id !== adminUser?.id ? user.id : null,
    reason,
    email_status: emailStatus,
  });

  await createModerationNotification(
    supabase,
    creatorId,
    "Creator bloqueado",
    reason,
    { reason, warning_count: (warnings || []).length }
  );

  revalidatePath("/dashboard/admin/moderation");
  revalidatePath("/dashboard/admin/users");
  return { success: true };
}
