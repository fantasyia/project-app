"use server";

import { requireAuth, requireRole } from "@/lib/auth/rbac";
import { getCreatorIdentityMap } from "@/lib/identity/context-profiles";
import { getSubscriberIdentityMap } from "@/lib/identity/context-profiles";
import {
  attachThumbnailToMediaUrl,
  sanitizePersistedAvatarUrl,
  sanitizePublicAssetUrl,
} from "@/lib/media/post-media";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";

type PostAuthorRow = {
  id: string;
  display_name: string | null;
  handle: string | null;
  avatar_url: string | null;
  role?: string | null;
};

type FeedPostRow = {
  id: string;
  author_id: string;
  media_url: string | null;
  post_type: string;
  access_tier: string;
  created_at: string;
  author: PostAuthorRow | null;
  likes?: Array<{ user_id: string }> | null;
  comments?: Array<{ id: string }> | null;
};

type CommentUserRow = {
  id: string;
  display_name: string | null;
  handle: string | null;
  avatar_url: string | null;
  role?: string | null;
};

type CommentRow = {
  id: string;
  post_id: string;
  parent_id: string | null;
  user_id: string;
  content: string;
  moderation_status: string | null;
  edited_at: string | null;
  deleted_at: string | null;
  deleted_by: string | null;
  created_at: string;
};

type SupabaseSelectResult<T> = {
  data: T[] | null;
  error?: { message?: string; code?: string; details?: string | null } | null;
};

type ActionResult = {
  error?: string;
  success?: boolean;
};

export type PostCommentView = {
  id: string;
  postId: string;
  parentId: string | null;
  userId: string;
  content: string;
  createdAt: string;
  editedAt: string | null;
  deletedAt: string | null;
  moderationStatus: string;
  author: {
    id: string;
    displayName: string | null;
    handle: string | null;
    avatarUrl: string | null;
    role?: string | null;
  } | null;
  likesCount: number;
  likedByMe: boolean;
  canEdit: boolean;
  canRemove: boolean;
  canBan: boolean;
  isBannedFromCreator: boolean;
  replies: PostCommentView[];
};

function normalizeCommentContent(comment: Pick<CommentRow, "content" | "deleted_at" | "moderation_status">) {
  if (comment.deleted_at || comment.moderation_status === "removed") return "Comentario removido";
  return parseLegacyCommentContent(comment.content).content;
}

function isMissingTableError(error: { message?: string; code?: string } | null | undefined) {
  const message = error?.message?.toLowerCase() || "";
  return (
    error?.code === "42P01" ||
    error?.code === "PGRST205" ||
    message.includes("could not find the table") ||
    message.includes("relation") && message.includes("does not exist")
  );
}

function legacyReplyPrefix(parentId: string) {
  return `[[reply:${parentId}]]\n`;
}

function legacyLikesPrefix(userIds: string[]) {
  return userIds.length > 0 ? `[[likes:${userIds.join(",")}]]\n` : "";
}

function parseLegacyCommentContent(content: string) {
  let remainingContent = content;
  let parentId: string | null = null;
  let likedUserIds: string[] = [];
  let consumed = true;

  while (consumed) {
    consumed = false;
    const replyMatch = remainingContent.match(/^\[\[reply:([0-9a-fA-F-]{36})\]\]\n?/);
    if (replyMatch) {
      parentId = replyMatch[1];
      remainingContent = remainingContent.slice(replyMatch[0].length);
      consumed = true;
      continue;
    }

    const likesMatch = remainingContent.match(/^\[\[likes:([0-9a-fA-F,\-]*)\]\]\n?/);
    if (likesMatch) {
      likedUserIds = likesMatch[1].split(",").filter(Boolean);
      remainingContent = remainingContent.slice(likesMatch[0].length);
      consumed = true;
    }
  }

  return { parentId, likedUserIds: Array.from(new Set(likedUserIds)), content: remainingContent };
}

function buildLegacyCommentContent({
  parentId,
  likedUserIds,
  content,
}: {
  parentId: string | null;
  likedUserIds: string[];
  content: string;
}) {
  return `${parentId ? legacyReplyPrefix(parentId) : ""}${legacyLikesPrefix(Array.from(new Set(likedUserIds)))}${content}`;
}

async function getOptionalSession() {
  try {
    return await requireAuth();
  } catch {
    return null;
  }
}

function getPrivilegedClient<T>(fallbackClient: T): T {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return fallbackClient;
  return createServiceClient() as T;
}

async function notifyUser(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string | null | undefined,
  notification: {
    type: string;
    title: string;
    body?: string | null;
    data?: Record<string, unknown>;
  }
) {
  if (!userId) return;

  await supabase.from("notifications").insert({
    user_id: userId,
    type: notification.type,
    title: notification.title,
    body: notification.body || null,
    data: notification.data || {},
  });
}

export async function createPost(formData: FormData) {
  const { user, supabase } = await requireRole("creator");

  const content = ((formData.get("content") as string) || "").trim();
  const requestedPostType = (formData.get("postType") as string) || "image";
  const requestedAccessTier = (formData.get("accessTier") as string) || "basic";
  const ppvPrice = formData.get("ppvPrice") as string | null;
  const file = formData.get("media") as File | null;
  const thumbnailFile = formData.get("thumbnail_file") as File | null;

  if ((!file || file.size === 0) && !content) {
    return { error: "Envie uma midia ou escreva a legenda do post." };
  }

  const contentTier =
    requestedAccessTier === "premium" || requestedAccessTier === "emerald" || requestedAccessTier === "ppv"
      ? requestedAccessTier
      : "basic";
  const isPpv = contentTier === "ppv";
  const accessTier = contentTier === "basic" ? "free" : "premium";
  const priceValue = isPpv ? Number.parseFloat(ppvPrice || "") : Number.NaN;

  if (isPpv && (!Number.isFinite(priceValue) || priceValue <= 0)) {
    return { error: "Informe um preco valido para o PPV." };
  }

  let mediaUrl: string | null = null;
  let thumbnailUrl: string | null = null;
  let postType = requestedPostType === "video" ? "video" : "image";

  if (file && file.size > 0) {
    const ext = file.name.split(".").pop();
    const fileName = `${user.id}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("post-media")
      .upload(fileName, file);

    if (uploadError) return { error: uploadError.message };

    const { data: urlData } = supabase.storage
      .from("post-media")
      .getPublicUrl(fileName);

    mediaUrl = sanitizePublicAssetUrl(urlData.publicUrl);

    if (file.type.startsWith("video/")) {
      postType = "video";
    } else if (file.type.startsWith("image/")) {
      postType = "image";
    }
  }

  if (postType === "video" && thumbnailFile instanceof File && thumbnailFile.size > 0) {
    const thumbnailExt = thumbnailFile.name.split(".").pop() || "jpg";
    const thumbnailName = `thumbnails/${user.id}/${Date.now()}.${thumbnailExt}`;

    const { error: thumbnailUploadError } = await supabase.storage
      .from("post-media")
      .upload(thumbnailName, thumbnailFile);

    if (thumbnailUploadError) return { error: thumbnailUploadError.message };

    const { data: thumbnailData } = supabase.storage
      .from("post-media")
      .getPublicUrl(thumbnailName);
    thumbnailUrl = sanitizePublicAssetUrl(thumbnailData.publicUrl);
  }

  if (postType === "video" && mediaUrl) {
    mediaUrl = attachThumbnailToMediaUrl(mediaUrl, thumbnailUrl);
  }

  const { error } = await supabase.from("posts").insert({
    author_id: user.id,
    content: content || null,
    post_type: postType,
    access_tier: accessTier,
    content_tier: contentTier,
    price: isPpv ? priceValue.toFixed(2) : null,
    media_url: mediaUrl,
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard/creator/posts");
  revalidatePath("/dashboard/creator/studio");
  revalidatePath("/dashboard/user/feed");
  return { success: true };
}

export async function deletePost(postId: string) {
  const { user, supabase } = await requireRole("creator");

  const { error } = await supabase
    .from("posts")
    .delete()
    .eq("id", postId)
    .eq("author_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/creator/studio");
  revalidatePath("/dashboard/user/feed");
  return { success: true };
}

export async function toggleLike(postId: string) {
  const { user, supabase } = await requireRole("subscriber");

  const { data: existing } = await supabase
    .from("likes")
    .select("*")
    .eq("user_id", user.id)
    .eq("post_id", postId)
    .maybeSingle();

  if (existing) {
    await supabase.from("likes").delete().eq("user_id", user.id).eq("post_id", postId);
  } else {
    const { error } = await supabase.from("likes").insert({ user_id: user.id, post_id: postId });
    if (error) return { error: error.message };

    const { data: post } = await supabase
      .from("posts")
      .select("author_id")
      .eq("id", postId)
      .maybeSingle();

    if (post?.author_id && post.author_id !== user.id) {
      await supabase.from("notifications").insert({
        user_id: post.author_id,
        type: "post_liked",
        title: "Nova curtida",
        body: "Um assinante curtiu sua postagem.",
        data: { post_id: postId, actor_id: user.id },
      });
    }
  }

  revalidatePath("/dashboard/user/feed");
  revalidatePath("/dashboard/creator/notifications");
  return { success: true, liked: !existing };
}

export async function addComment(postId: string, content: string, parentId?: string | null) {
  const session = await getOptionalSession();
  const supabase = session?.supabase || (await createClient());
  const user = session?.user || null;
  const normalizedContent = content.trim();

  if (!user) return { error: "Nao autenticado" };
  if (!postId) return { error: "Post invalido." };
  if (!normalizedContent) return { error: "Comentario vazio." };

  const { data: post } = await supabase
    .from("posts")
    .select("id, author_id")
    .eq("id", postId)
    .maybeSingle();

  if (!post?.author_id) return { error: "Post nao encontrado." };

  const isCreatorOwner = session?.role === "creator" && post.author_id === user.id;
  const canComment =
    session?.role === "subscriber" ||
    isCreatorOwner ||
    session?.role === "admin";

  if (!canComment) return { error: "Seu perfil atual nao pode comentar neste post." };

  if (!isCreatorOwner) {
    const { data: ban } = await supabase
      .from("creator_comment_bans")
      .select("creator_id")
      .eq("creator_id", post.author_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (ban) return { error: "Voce nao pode comentar nos posts deste creator." };
  }

  if (parentId) {
    const { data: parentComment } = await supabase
      .from("comments")
      .select("id, post_id, user_id")
      .eq("id", parentId)
      .maybeSingle();

    if (!parentComment || parentComment.post_id !== postId) {
      return { error: "Comentario de resposta invalido." };
    }
  }

  const baseInsert = {
    post_id: postId,
    user_id: user.id,
    content: normalizedContent,
  };

  let insertResult = await supabase
    .from("comments")
    .insert({ ...baseInsert, parent_id: parentId || null })
    .select("id")
    .single();

  if (insertResult.error) {
    console.warn("comments.parent_id insert skipped, falling back without thread:", insertResult.error.message);
    insertResult = await supabase
      .from("comments")
      .insert({
        ...baseInsert,
        content: parentId
          ? buildLegacyCommentContent({ parentId, likedUserIds: [], content: normalizedContent })
          : normalizedContent,
      })
      .select("id")
      .single();
  }

  const { data: comment, error } = insertResult;

  if (error) return { error: error.message };

  if (parentId) {
    const { data: parentComment } = await supabase
      .from("comments")
      .select("user_id")
      .eq("id", parentId)
      .maybeSingle();

    if (parentComment?.user_id && parentComment.user_id !== user.id) {
      await notifyUser(supabase, parentComment.user_id, {
        type: "comments",
        title: isCreatorOwner ? "Resposta do creator" : "Nova resposta",
        body: normalizedContent.slice(0, 120),
        data: { post_id: postId, comment_id: comment?.id, parent_id: parentId, actor_id: user.id },
      });
    }
  }

  if (post?.author_id && post.author_id !== user.id) {
    await notifyUser(supabase, post.author_id, {
      type: "comments",
      title: "Novo comentario",
      body: normalizedContent.slice(0, 120),
      data: { post_id: postId, comment_id: comment?.id, actor_id: user.id },
    });
  }

  revalidatePath("/dashboard/user/feed");
  revalidatePath("/dashboard/creator/posts");
  revalidatePath("/dashboard/creator/comments");
  revalidatePath("/dashboard/creator/notifications");
  return { success: true, commentId: comment?.id };
}

export async function getCommentsForPost(postId: string) {
  const session = await getOptionalSession();
  const supabase = session?.supabase || (await createClient());
  const readSupabase = getPrivilegedClient(supabase);
  const user = session?.user || null;

  if (!postId) return [];

  const { data: post } = await supabase
    .from("posts")
    .select("id, author_id")
    .eq("id", postId)
    .maybeSingle();

  let commentsResult = await supabase
    .from("comments")
    .select("id, post_id, parent_id, user_id, content, moderation_status, edited_at, deleted_at, deleted_by, created_at")
    .eq("post_id", postId)
    .order("created_at", { ascending: true }) as SupabaseSelectResult<CommentRow>;

  if (commentsResult.error) {
    console.warn("getCommentsForPost full comment query failed, using legacy fallback:", commentsResult.error.message);
    const fallbackResult = await supabase
      .from("comments")
      .select("id, post_id, user_id, content, created_at")
      .eq("post_id", postId)
      .order("created_at", { ascending: true }) as SupabaseSelectResult<Partial<CommentRow>>;

    commentsResult = {
      data: (fallbackResult.data || []).map((comment) => ({
        id: String(comment.id || ""),
        post_id: String(comment.post_id || postId),
        parent_id: parseLegacyCommentContent(String(comment.content || "")).parentId,
        user_id: String(comment.user_id || ""),
        content: String(comment.content || ""),
        moderation_status: "visible",
        edited_at: null,
        deleted_at: null,
        deleted_by: null,
        created_at: String(comment.created_at || new Date().toISOString()),
      })),
      error: fallbackResult.error,
    };
  }

  if (commentsResult.error) {
    console.error("getCommentsForPost query error:", commentsResult.error.message, commentsResult.error.code, commentsResult.error.details);
    return [];
  }

  const rows = (commentsResult.data || []) as CommentRow[];
  const commentIds = rows.map((comment) => comment.id);
  const userIds = Array.from(new Set(rows.map((comment) => comment.user_id).filter(Boolean)));

  const [commentUsersSettled, likesSettled, bansSettled] = await Promise.allSettled([
    userIds.length > 0
      ? readSupabase.from("users").select("id, display_name, handle, avatar_url, role").in("id", userIds)
      : Promise.resolve({ data: [] }),
    commentIds.length > 0
      ? readSupabase.from("comment_likes").select("comment_id, user_id").in("comment_id", commentIds)
      : Promise.resolve({ data: [] }),
    post?.author_id
      ? readSupabase.from("creator_comment_bans").select("user_id").eq("creator_id", post.author_id)
      : Promise.resolve({ data: [] }),
  ]);

  const commentUsersResult =
    commentUsersSettled.status === "fulfilled" ? commentUsersSettled.value : { data: [] };
  const likesResult =
    likesSettled.status === "fulfilled" ? likesSettled.value : { data: [] };
  const bansResult =
    bansSettled.status === "fulfilled" ? bansSettled.value : { data: [] };

  const usersById = new Map(
    ((commentUsersResult.data || []) as CommentUserRow[]).map((commentUser) => [commentUser.id, commentUser])
  );
  const likesByComment = new Map<string, Array<{ user_id: string }>>();
  const likesTableAvailable = !("error" in likesResult) || !likesResult.error;
  for (const like of (likesResult.data || []) as Array<{ comment_id: string; user_id: string }>) {
    likesByComment.set(like.comment_id, [...(likesByComment.get(like.comment_id) || []), { user_id: like.user_id }]);
  }
  const bannedUserIds = new Set(((bansResult.data || []) as Array<{ user_id: string }>).map((ban) => ban.user_id));

  if (user && rows.length > 0) {
    const viewRows = rows
      .filter((comment) => comment.user_id !== user.id)
      .map((comment) => ({ comment_id: comment.id, viewer_id: user.id }));

    if (viewRows.length > 0) {
      supabase
        .from("comment_views")
        .upsert(viewRows, { onConflict: "comment_id,viewer_id", ignoreDuplicates: true })
        .then(
          ({ error }) => {
            if (error) console.error("comment_views upsert failed (non-blocking):", error);
          },
          (err: unknown) => {
            console.error("comment_views upsert exception (non-blocking):", err);
          }
        );
    }
  }

  const [creatorIdentityMap, subscriberIdentityMap] = await Promise.all([
    getCreatorIdentityMap(supabase, userIds),
    getSubscriberIdentityMap(supabase, userIds),
  ]);

  const byId = new Map<string, PostCommentView>();

  for (const comment of rows) {
    const commentUser = usersById.get(comment.user_id) || null;
    const identity =
      commentUser?.role === "creator"
        ? creatorIdentityMap.get(commentUser.id)
        : commentUser?.role === "subscriber"
          ? subscriberIdentityMap.get(commentUser.id)
          : commentUser
            ? creatorIdentityMap.get(commentUser.id) || subscriberIdentityMap.get(commentUser.id)
            : undefined;
    const legacyComment = parseLegacyCommentContent(comment.content || "");
    const tableLikes = likesByComment.get(comment.id) || [];
    const commentLikes = likesTableAvailable
      ? tableLikes
      : legacyComment.likedUserIds.map((likedUserId) => ({ user_id: likedUserId }));
    const removed = Boolean(comment.deleted_at || comment.moderation_status === "removed");
    const isPostOwner = Boolean(user && post?.author_id === user.id);
    const isCommentAuthor = Boolean(user && comment.user_id === user.id);

    byId.set(comment.id, {
      id: comment.id,
      postId: comment.post_id,
      parentId: comment.parent_id || legacyComment.parentId,
      userId: comment.user_id,
      content: normalizeCommentContent(comment),
      createdAt: comment.created_at,
      editedAt: comment.edited_at,
      deletedAt: comment.deleted_at,
      moderationStatus: comment.moderation_status || "visible",
      author: commentUser
        ? {
            id: commentUser.id,
            displayName: identity?.display_name || commentUser.display_name,
            handle: identity?.handle || commentUser.handle,
            avatarUrl: sanitizePersistedAvatarUrl(identity?.avatar_url || commentUser.avatar_url),
            role: commentUser.role,
          }
        : null,
      likesCount: commentLikes.length,
      likedByMe: Boolean(user && commentLikes.some((like) => like.user_id === user.id)),
      canEdit: Boolean(isCommentAuthor && !removed),
      canRemove: Boolean((isCommentAuthor || isPostOwner) && !removed),
      canBan: Boolean(isPostOwner && !removed && comment.user_id !== user?.id),
      isBannedFromCreator: bannedUserIds.has(comment.user_id),
      replies: [],
    });
  }

  for (const comment of byId.values()) {
    if (!comment.parentId) continue;
    const parent = byId.get(comment.parentId);
    parent?.replies.push(comment);
  }

  function pruneVisibleReplies(comment: PostCommentView): PostCommentView | null {
    const replies = comment.replies
      .map(pruneVisibleReplies)
      .filter((reply): reply is PostCommentView => Boolean(reply));
    const removedComment = Boolean(comment.deletedAt || comment.moderationStatus === "removed");

    if (removedComment && replies.length === 0) return null;
    return { ...comment, replies };
  }

  return Array.from(byId.values()).map(pruneVisibleReplies).filter((comment): comment is PostCommentView => {
    if (!comment) return false;
    if (comment.parentId) return false;
    if (!comment.deletedAt && comment.moderationStatus !== "removed") return true;
    return comment.replies.length > 0;
  });
}

export async function toggleCommentLike(commentId: string) {
  const session = await getOptionalSession();
  const supabase = session?.supabase || (await createClient());
  const writeSupabase = getPrivilegedClient(supabase);
  const user = session?.user || null;

  if (!user) return { error: "Nao autenticado" };
  if (!commentId) return { error: "Comentario invalido." };

  const existingResult = await writeSupabase
    .from("comment_likes")
    .select("comment_id")
    .eq("comment_id", commentId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingResult.error) {
    if (!isMissingTableError(existingResult.error)) return { error: existingResult.error.message };
    return toggleLegacyCommentLike(writeSupabase, commentId, user.id);
  }

  const existing = existingResult.data;

  if (existing) {
    const { error } = await writeSupabase
      .from("comment_likes")
      .delete()
      .eq("comment_id", commentId)
      .eq("user_id", user.id);
    if (error) {
      if (!isMissingTableError(error)) return { error: error.message };
      return toggleLegacyCommentLike(writeSupabase, commentId, user.id);
    }
  } else {
    const { error } = await writeSupabase.from("comment_likes").insert({
      comment_id: commentId,
      user_id: user.id,
    });
    if (error) {
      if (!isMissingTableError(error)) return { error: error.message };
      return toggleLegacyCommentLike(writeSupabase, commentId, user.id);
    }
  }

  revalidatePath("/dashboard/user/feed");
  revalidatePath("/dashboard/creator/posts");
  return { success: true, liked: !existing };
}

async function toggleLegacyCommentLike(
  supabase: Awaited<ReturnType<typeof createClient>>,
  commentId: string,
  userId: string
) {
  const { data: comment, error: commentError } = await supabase
    .from("comments")
    .select("id, content")
    .eq("id", commentId)
    .maybeSingle();

  if (commentError) return { error: commentError.message };
  if (!comment?.content) return { error: "Comentario nao encontrado." };

  const parsed = parseLegacyCommentContent(comment.content);
  const liked = !parsed.likedUserIds.includes(userId);
  const likedUserIds = liked
    ? [...parsed.likedUserIds, userId]
    : parsed.likedUserIds.filter((likedUserId) => likedUserId !== userId);

  const { error } = await supabase
    .from("comments")
    .update({
      content: buildLegacyCommentContent({
        parentId: parsed.parentId,
        likedUserIds,
        content: parsed.content,
      }),
    })
    .eq("id", commentId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/user/feed");
  revalidatePath("/dashboard/creator/posts");
  return { success: true, liked };
}

export async function editComment(commentId: string, content: string) {
  const session = await getOptionalSession();
  const supabase = session?.supabase || (await createClient());
  const user = session?.user || null;
  const normalizedContent = content.trim();

  if (!user) return { error: "Nao autenticado" };
  if (!commentId) return { error: "Comentario invalido." };
  if (!normalizedContent) return { error: "Comentario vazio." };

  let commentResult = await supabase
    .from("comments")
    .select("id, post_id, user_id, content, deleted_at, moderation_status")
    .eq("id", commentId)
    .maybeSingle();

  if (commentResult.error) {
    console.warn("editComment full comment query failed, using legacy fallback:", commentResult.error.message);
    commentResult = await supabase
      .from("comments")
      .select("id, post_id, user_id, content")
      .eq("id", commentId)
      .maybeSingle();
  }

  const safeComment = commentResult.data as Pick<CommentRow, "id" | "post_id" | "user_id" | "content"> &
    Partial<Pick<CommentRow, "deleted_at" | "moderation_status">> | null;

  if (!safeComment) return { error: "Comentario nao encontrado." };
  if (safeComment.user_id !== user.id) return { error: "Voce so pode editar seus comentarios." };
  if (safeComment.deleted_at || safeComment.moderation_status === "removed") {
    return { error: "Comentario removido nao pode ser editado." };
  }

  const legacyComment = parseLegacyCommentContent(safeComment.content || "");
  const nextContent = buildLegacyCommentContent({
    parentId: legacyComment.parentId,
    likedUserIds: legacyComment.likedUserIds,
    content: normalizedContent,
  });

  let updateResult = await supabase
    .from("comments")
    .update({ content: nextContent, edited_at: new Date().toISOString() })
    .eq("id", commentId)
    .eq("user_id", user.id);

  if (updateResult.error) {
    console.warn("editComment edited_at update failed, using legacy fallback:", updateResult.error.message);
    updateResult = await supabase
      .from("comments")
      .update({ content: nextContent })
      .eq("id", commentId)
      .eq("user_id", user.id);
  }

  if (updateResult.error) return { error: updateResult.error.message };

  revalidatePath("/dashboard/user/feed");
  revalidatePath("/dashboard/creator/posts");
  return { success: true };
}

export async function removeComment(commentId: string): Promise<ActionResult> {
  const session = await getOptionalSession();
  const supabase = session?.supabase || (await createClient());
  const user = session?.user || null;

  if (!user) return { error: "Nao autenticado" };
  if (!commentId) return { error: "Comentario invalido." };

  let commentResult = await supabase
    .from("comments")
    .select("id, post_id, user_id, deleted_at, moderation_status")
    .eq("id", commentId)
    .maybeSingle();

  if (commentResult.error) {
    commentResult = await supabase
      .from("comments")
      .select("id, post_id, user_id")
      .eq("id", commentId)
      .maybeSingle();
  }

  const comment = commentResult.data as Pick<CommentRow, "id" | "post_id" | "user_id"> &
    Partial<Pick<CommentRow, "deleted_at" | "moderation_status">> | null;

  const { data: post } = comment?.post_id
    ? await supabase.from("posts").select("author_id").eq("id", comment.post_id).maybeSingle()
    : { data: null };

  if (!comment) return { error: "Comentario nao encontrado." };
  if (comment.deleted_at || comment.moderation_status === "removed") {
    return { success: true };
  }

  const isAuthor = comment.user_id === user.id;
  const isPostOwner = post?.author_id === user.id;

  if (!isAuthor && !isPostOwner) {
    return { error: "Voce nao pode remover este comentario." };
  }

  let removeResult = await supabase
    .from("comments")
    .update({
      moderation_status: "removed",
      deleted_at: new Date().toISOString(),
      deleted_by: user.id,
    })
    .eq("id", commentId);

  if (removeResult.error) {
    removeResult = await supabase.from("comments").delete().eq("id", commentId);
  }

  if (removeResult.error) return { error: removeResult.error.message };

  if (isPostOwner && comment.user_id !== user.id) {
    await notifyUser(supabase, comment.user_id, {
      type: "comments",
      title: "Comentario removido",
      body: "Um creator removeu seu comentario por moderacao.",
      data: { post_id: comment.post_id, comment_id: commentId, actor_id: user.id },
    });
  }

  revalidatePath("/dashboard/creator/comments");
  revalidatePath("/dashboard/creator/posts");
  revalidatePath("/dashboard/user/feed");
  return { success: true };
}

export async function removeCommentAsCreator(commentId: string) {
  return removeComment(commentId);
}

export async function banUserFromCreatorComments(commentId: string, reason = "Moderacao do creator") {
  const { user, supabase } = await requireRole("creator");

  if (!commentId) return { error: "Comentario invalido." };

  const { data: comment } = await supabase
    .from("comments")
    .select("id, post_id, user_id")
    .eq("id", commentId)
    .maybeSingle();

  const { data: post } = comment?.post_id
    ? await supabase.from("posts").select("author_id").eq("id", comment.post_id).maybeSingle()
    : { data: null };

  if (!comment || post?.author_id !== user.id) {
    return { error: "Voce so pode banir usuarios nos seus posts." };
  }

  if (comment.user_id === user.id) {
    return { error: "Voce nao pode banir seu proprio perfil de creator." };
  }

  const { error } = await supabase.from("creator_comment_bans").upsert(
    {
      creator_id: user.id,
      user_id: comment.user_id,
      banned_by: user.id,
      reason,
    },
    { onConflict: "creator_id,user_id" }
  );

  if (error) return { error: error.message };

  await notifyUser(supabase, comment.user_id, {
    type: "comments",
    title: "Comentarios bloqueados",
    body: "Voce nao pode mais comentar nos posts deste creator.",
    data: { post_id: comment.post_id, comment_id: commentId, creator_id: user.id },
  });

  revalidatePath("/dashboard/creator/comments");
  revalidatePath("/dashboard/creator/posts");
  revalidatePath("/dashboard/user/feed");
  revalidatePath("/dashboard/user/notifications");
  return { success: true };
}

export async function toggleFavorite(postId: string) {
  const { user, supabase } = await requireRole("subscriber");

  const { data: existing } = await supabase
    .from("favorites")
    .select("*")
    .eq("user_id", user.id)
    .eq("post_id", postId)
    .maybeSingle();

  if (existing) {
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
  return { success: true, favorited: !existing };
}

export async function getFeed() {
  const db = await createClient();
  const {
    data: { user },
  } = await db.auth.getUser();

  const { data, error } = await db
    .from("posts")
    .select("*, author:users(id, display_name, handle, avatar_url, role), likes(user_id), comments(id)")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("getFeed error:", error.message);
    return [];
  }

  const rows = (data || []) as FeedPostRow[];
  const creatorIds = Array.from(new Set(rows.map((post) => post.author_id)));
  const postIds = rows.map((post) => post.id);
  const [creatorIdentityMap, myLikesResult, myFavoritesResult] = await Promise.all([
    getCreatorIdentityMap(db, creatorIds),
    user && postIds.length > 0
      ? db.from("likes").select("post_id").eq("user_id", user.id).in("post_id", postIds)
      : Promise.resolve({ data: [] }),
    user && postIds.length > 0
      ? db.from("favorites").select("post_id").eq("user_id", user.id).in("post_id", postIds)
      : Promise.resolve({ data: [] }),
  ]);
  const likedPostIds = new Set(((myLikesResult.data || []) as Array<{ post_id: string }>).map((like) => like.post_id));
  const favoritePostIds = new Set(
    ((myFavoritesResult.data || []) as Array<{ post_id: string }>).map((favorite) => favorite.post_id)
  );

  return rows.map((p) => ({
    ...p,
    authorId: p.author_id,
    mediaUrl: p.media_url,
    postType: p.post_type,
    accessTier: p.access_tier,
    createdAt: p.created_at,
    author: p.author
      ? (() => {
          const identity = creatorIdentityMap.get(p.author.id);
          return {
            id: p.author.id,
            displayName: identity?.display_name || p.author.display_name,
            handle: identity?.handle || p.author.handle,
            avatarUrl: sanitizePersistedAvatarUrl(identity?.avatar_url || p.author.avatar_url),
            role: p.author.role,
          };
        })()
      : null,
    likes: (p.likes || []).map((l) => ({ userId: l.user_id })),
    comments: p.comments || [],
    likedByMe: likedPostIds.has(p.id),
    favoritedByMe: favoritePostIds.has(p.id),
  }));
}

export async function searchPosts(query: string) {
  const supabase = (await import("@/lib/supabase/server")).createClient();
  const db = await supabase;

  const { data, error } = await db
    .from("posts")
    .select("*, author:users(id, display_name, handle, avatar_url)")
    .ilike("content", `%${query}%`)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("searchPosts error:", error.message);
    return [];
  }

  const rows = (data || []) as FeedPostRow[];
  const creatorIds = Array.from(new Set(rows.map((post) => post.author_id)));
  const creatorIdentityMap = await getCreatorIdentityMap(db, creatorIds);

  return rows.map((p) => ({
    ...p,
    authorId: p.author_id,
    mediaUrl: p.media_url,
    postType: p.post_type,
    accessTier: p.access_tier,
    createdAt: p.created_at,
    author: p.author
      ? (() => {
          const identity = creatorIdentityMap.get(p.author.id);
          return {
            id: p.author.id,
            displayName: identity?.display_name || p.author.display_name,
            handle: identity?.handle || p.author.handle,
            avatarUrl: sanitizePersistedAvatarUrl(identity?.avatar_url || p.author.avatar_url),
          };
        })()
      : null,
  }));
}

export async function searchCreators(query: string) {
  const supabase = (await import("@/lib/supabase/server")).createClient();
  const db = await supabase;
  const normalizedQuery = query.trim().toLowerCase();

  const { data, error } = await db
    .from("users")
    .select("id, display_name, handle, avatar_url, role")
    .eq("role", "creator")
    .limit(200);

  if (error) {
    console.error("searchCreators error:", error.message);
    return [];
  }

  const creators = (data || []) as Array<{
    id: string;
    display_name: string | null;
    handle: string | null;
    avatar_url: string | null;
  }>;
  if (creators.length === 0) return [];

  const creatorIdentityMap = await getCreatorIdentityMap(
    db,
    creators.map((creator) => creator.id)
  );

  const withPublicIdentity = creators.map((creator) => {
    const identity = creatorIdentityMap.get(creator.id);
    return {
      id: creator.id,
      display_name: identity?.display_name || creator.display_name,
      handle: identity?.handle || creator.handle,
      avatar_url: sanitizePersistedAvatarUrl(identity?.avatar_url || creator.avatar_url),
    };
  });

  if (!normalizedQuery) {
    return withPublicIdentity.slice(0, 20);
  }

  return withPublicIdentity
    .filter((creator) => {
      const display = (creator.display_name || "").toLowerCase();
      const handle = (creator.handle || "").toLowerCase();
      return display.includes(normalizedQuery) || handle.includes(normalizedQuery);
    })
    .slice(0, 20);
}

export async function getMyPosts() {
  const { user, supabase } = await requireRole("creator");

  const { data, error } = await supabase
    .from("posts")
    .select("*, likes(user_id), comments(id)")
    .eq("author_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getMyPosts error:", error.message);
    return [];
  }

  return data || [];
}

export async function getCreatorCommentInbox() {
  const { user, supabase } = await requireRole("creator");

  const { data: posts, error } = await supabase
    .from("posts")
    .select("id, content, media_url, post_type, created_at, comments(id)")
    .eq("author_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getCreatorCommentInbox posts error:", error.message);
    return [];
  }

  const postsWithComments = (posts || []).filter((post) => (post.comments || []).length > 0);
  const inbox = await Promise.all(
    postsWithComments.map(async (post) => ({
      post,
      comments: await getCommentsForPost(post.id),
    }))
  );

  return inbox.filter((item) => item.comments.length > 0);
}
