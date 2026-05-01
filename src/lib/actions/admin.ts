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
  return data || [];
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
