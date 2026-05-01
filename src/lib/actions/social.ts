"use server";

import { revalidatePath } from "next/cache";
import type { User } from "@supabase/supabase-js";
import { sendTip } from "./financial";
import { ensurePublicUserProfile } from "@/lib/auth/ensure-user-profile";
import {
  getCreatorIdentityMap,
  getSubscriberIdentityMap,
  type IdentityView,
} from "@/lib/identity/context-profiles";
import { sanitizePersistedAvatarUrl } from "@/lib/media/post-media";
import { createClient } from "@/lib/supabase/server";

type FollowerProfile = {
  id: string;
  display_name: string | null;
  handle: string | null;
  avatar_url: string | null;
  role?: string | null;
};

type ChatParticipant = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  handle: string | null;
  role?: string | null;
};

type ConversationMessage = {
  id: string;
  content: string | null;
  created_at: string;
  is_read: boolean;
  sender_id: string;
  message_type: string;
};

export type ConversationSummary = {
  id: string;
  otherUser: ChatParticipant;
  lastMessage: ConversationMessage | null;
  updatedAt: string;
};

export type ChatMessageRow = {
  id: string;
  chat_id: string;
  sender_id: string;
  message_type: string;
  content: string | null;
  media_url: string | null;
  price: string | null;
  is_read: boolean;
  created_at: string;
  media_kind?: "image" | "video";
  access_state?: "owner" | "unlocked" | "locked";
};

type RawChatMessageRow = Omit<ChatMessageRow, "access_state">;

function takeFirstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function inferMediaKind(mediaUrl: string | null): "image" | "video" | undefined {
  if (!mediaUrl) return undefined;
  if (/\.(mp4|mov|webm|m4v)(\?|$)/i.test(mediaUrl)) return "video";
  return "image";
}

function buildChatMessageView(
  message: RawChatMessageRow,
  currentUserId: string,
  unlockedMessageIds: Set<string>
): ChatMessageRow {
  const isOwner = message.sender_id === currentUserId;
  const isPremiumMessage =
    message.message_type === "ppv_locked" && Number.parseFloat(message.price || "0") > 0;
  const isUnlocked = isOwner || !isPremiumMessage || unlockedMessageIds.has(message.id);

  return {
    ...message,
    media_kind: message.media_kind || inferMediaKind(message.media_url),
    access_state: isOwner ? "owner" : isUnlocked ? "unlocked" : "locked",
    media_url: isUnlocked ? message.media_url : null,
  };
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount);
}

function applyContextIdentity(
  profile: FollowerProfile | ChatParticipant,
  creatorIdentityMap: Map<string, IdentityView>,
  subscriberIdentityMap: Map<string, IdentityView>
) {
  const preferredIdentity =
    profile.role === "creator"
      ? creatorIdentityMap.get(profile.id)
      : profile.role === "subscriber"
        ? subscriberIdentityMap.get(profile.id)
        : creatorIdentityMap.get(profile.id) || subscriberIdentityMap.get(profile.id);

  return {
    ...profile,
    display_name: preferredIdentity?.display_name || profile.display_name,
    handle: preferredIdentity?.handle || profile.handle,
    avatar_url: sanitizePersistedAvatarUrl(preferredIdentity?.avatar_url || profile.avatar_url),
  };
}

export async function followUser(userId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Nao autenticado" };

  const { data: existing } = await supabase
    .from("follows")
    .select("follower_id")
    .eq("follower_id", user.id)
    .eq("following_id", userId)
    .single();

  if (existing) {
    await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", userId);
  } else {
    await supabase.from("follows").insert({ follower_id: user.id, following_id: userId });
    if (user.id !== userId) {
      await supabase.from("notifications").insert({
        user_id: userId,
        type: "new_follower",
        title: "Novo seguidor",
        body: "Um usuario comecou a seguir seu perfil.",
        data: { follower_id: user.id },
      });
    }
  }

  revalidatePath("/dashboard/user/feed");
  revalidatePath("/dashboard/user/search");
  revalidatePath("/dashboard/creator/followers");
  return { success: true, following: !existing };
}

export async function getFollowers() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("follows")
    .select("follower:users!follows_follower_id_fkey(id, display_name, handle, avatar_url, role)")
    .eq("following_id", user.id)
    .order("created_at", { ascending: false });

  const followers = (data || [])
    .map((follow) => takeFirstRelation((follow as { follower: FollowerProfile | FollowerProfile[] | null }).follower))
    .filter((follower): follower is FollowerProfile => Boolean(follower));

  if (followers.length === 0) return [];

  const followerIds = followers.map((follower) => follower.id);
  const [creatorIdentityMap, subscriberIdentityMap] = await Promise.all([
    getCreatorIdentityMap(supabase, followerIds),
    getSubscriberIdentityMap(supabase, followerIds),
  ]);

  return followers.map((follower) =>
    applyContextIdentity(follower, creatorIdentityMap, subscriberIdentityMap)
  );
}

async function getOrCreateChatId(currentUserId: string, receiverId: string) {
  const supabase = await createClient();
  const sortedParticipants =
    currentUserId < receiverId
      ? { participant1_id: currentUserId, participant2_id: receiverId }
      : { participant1_id: receiverId, participant2_id: currentUserId };

  const { data: existingChats, error: existingChatsError } = await supabase
    .from("chats")
    .select("id, updated_at")
    .or(
      `and(participant1_id.eq.${currentUserId},participant2_id.eq.${receiverId}),and(participant1_id.eq.${receiverId},participant2_id.eq.${currentUserId})`
    )
    .order("updated_at", { ascending: false })
    .limit(1);

  if (existingChatsError) return { error: existingChatsError.message };

  const existingChat = (existingChats || [])[0];
  if (existingChat?.id) {
    return { chatId: existingChat.id };
  }

  const { data: newChat, error: createError } = await supabase
    .from("chats")
    .insert(sortedParticipants)
    .select("id")
    .single();

  if (createError) {
    // Idempotent fallback for race conditions / legacy duplicate pair ordering.
    const { data: retryChats, error: retryError } = await supabase
      .from("chats")
      .select("id, updated_at")
      .or(
        `and(participant1_id.eq.${currentUserId},participant2_id.eq.${receiverId}),and(participant1_id.eq.${receiverId},participant2_id.eq.${currentUserId})`
      )
      .order("updated_at", { ascending: false })
      .limit(1);

    if (retryError) return { error: retryError.message };
    const retryChat = (retryChats || [])[0];
    if (!retryChat?.id) return { error: createError.message };
    return { chatId: retryChat.id };
  }

  return { chatId: newChat.id };
}

async function ensureAuthUserProfileOrError(supabase: Awaited<ReturnType<typeof createClient>>, user: User) {
  const profileSync = await ensurePublicUserProfile(supabase, user);
  if (!profileSync.success) {
    return { error: profileSync.error || "Nao foi possivel sincronizar seu perfil no app." };
  }
  return { success: true };
}

// ===========================
// CHAT (Realtime-ready)
// ===========================

export async function sendMessage(receiverId: string, content: string, price?: number, mediaUrl?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Nao autenticado" };

  const profileSync = await ensureAuthUserProfileOrError(supabase, user);
  if ("error" in profileSync) return { error: profileSync.error };

  const chatResult = await getOrCreateChatId(user.id, receiverId);
  if ("error" in chatResult) return { error: chatResult.error };

  let messageType = "text";
  if (price && price > 0) messageType = "ppv_locked";
  else if (mediaUrl) messageType = "media";

  const { data: insertedMessage, error } = await supabase
    .from("chat_messages")
    .insert({
      chat_id: chatResult.chatId,
      sender_id: user.id,
      content,
      media_url: mediaUrl || null,
      price: price ? String(price) : null,
      message_type: messageType,
    })
    .select("*")
    .single();

  if (error) return { error: error.message };

  return { success: true, chatId: chatResult.chatId, message: insertedMessage as ChatMessageRow };
}

export async function sendLockedMediaMessage(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Nao autenticado" };

  const profileSync = await ensureAuthUserProfileOrError(supabase, user);
  if ("error" in profileSync) return { error: profileSync.error };

  const receiverId = formData.get("receiverId") as string;
  const caption = ((formData.get("caption") as string) || "").trim();
  const priceInput = (formData.get("price") as string) || "";
  const file = formData.get("media") as File | null;
  const price = Number.parseFloat(priceInput.replace(",", "."));

  if (!receiverId) return { error: "Conversa invalida." };
  if (!file || file.size === 0) return { error: "Envie uma imagem ou video para travar no chat." };
  if (!Number.isFinite(price) || price <= 0) return { error: "Informe um preco valido para a midia premium." };

  const chatResult = await getOrCreateChatId(user.id, receiverId);
  if ("error" in chatResult) return { error: chatResult.error };

  const extension = file.name.split(".").pop() || "bin";
  const fileName = `chat-media/${user.id}/${Date.now()}.${extension}`;

  const { error: uploadError } = await supabase.storage.from("post-media").upload(fileName, file);
  if (uploadError) return { error: uploadError.message };

  const { data: urlData } = supabase.storage.from("post-media").getPublicUrl(fileName);
  const mediaUrl = urlData.publicUrl;

  const { data: insertedMessage, error } = await supabase
    .from("chat_messages")
    .insert({
      chat_id: chatResult.chatId,
      sender_id: user.id,
      content: caption || "Midia premium exclusiva enviada no chat.",
      media_url: mediaUrl,
      price: price.toFixed(2),
      message_type: "ppv_locked",
    })
    .select("*")
    .single();

  if (error) return { error: error.message };

  return {
    success: true,
    chatId: chatResult.chatId,
    message: {
      ...(insertedMessage as RawChatMessageRow),
      media_kind: file.type.startsWith("video/") ? "video" : "image",
      access_state: "owner" as const,
    },
  };
}

export async function sendChatTip(receiverId: string, amount: number, note?: string) {
  const normalizedNote = note?.trim() || undefined;
  const tipResult = await sendTip(receiverId, amount, normalizedNote);
  if (!tipResult?.success) return { error: tipResult?.error || "Nao foi possivel enviar a gorjeta." };

  const receiptMessage = normalizedNote
    ? `Gorjeta enviada: ${formatCurrency(amount)}. Recado: ${normalizedNote}`
    : `Gorjeta enviada: ${formatCurrency(amount)}.`;

  const messageResult = await sendMessage(receiverId, receiptMessage);

  if (messageResult?.error) {
    return { success: true, message: null };
  }

  return { success: true, chatId: messageResult.chatId, message: messageResult.message };
}

export async function getConversations() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("chats")
    .select(`
      id,
      updated_at,
      last_message_at,
      participant1:users!chats_participant1_id_fkey(id, display_name, avatar_url, handle, role),
      participant2:users!chats_participant2_id_fkey(id, display_name, avatar_url, handle, role),
      chat_messages(id, content, created_at, is_read, sender_id, message_type)
    `)
    .or(`participant1_id.eq.${user.id},participant2_id.eq.${user.id}`)
    .order("last_message_at", { ascending: false });

  if (!data) return [];

  const participantIds = new Set<string>();
  for (const rawChat of data) {
    const chat = rawChat as {
      participant1: ChatParticipant | ChatParticipant[] | null;
      participant2: ChatParticipant | ChatParticipant[] | null;
    };
    const participant1 = takeFirstRelation(chat.participant1);
    const participant2 = takeFirstRelation(chat.participant2);
    if (participant1?.id) participantIds.add(participant1.id);
    if (participant2?.id) participantIds.add(participant2.id);
  }

  const allParticipantIds = Array.from(participantIds);
  const [creatorIdentityMap, subscriberIdentityMap] = await Promise.all([
    getCreatorIdentityMap(supabase, allParticipantIds),
    getSubscriberIdentityMap(supabase, allParticipantIds),
  ]);

  const conversations: ConversationSummary[] = [];

  for (const chat of data) {
    const safeChat = chat as {
      id: string;
      updated_at: string;
      last_message_at?: string | null;
      participant1: ChatParticipant | ChatParticipant[] | null;
      participant2: ChatParticipant | ChatParticipant[] | null;
      chat_messages: ConversationMessage[] | null;
    };
    const participant1 = takeFirstRelation(safeChat.participant1);
    const participant2 = takeFirstRelation(safeChat.participant2);
    const rawOtherUser = participant1?.id === user.id ? participant2 : participant1;
    const otherUser = rawOtherUser
      ? applyContextIdentity(rawOtherUser, creatorIdentityMap, subscriberIdentityMap)
      : null;
    if (!otherUser) continue;

    const sortedMessages = [...(safeChat.chat_messages || [])].sort(
      (left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime()
    );
    const lastMessage = sortedMessages[0] || null;

    conversations.push({
      id: safeChat.id,
      otherUser,
      lastMessage,
      updatedAt: safeChat.last_message_at || lastMessage?.created_at || safeChat.updated_at,
    });
  }

  return conversations;
}

export async function ensureConversationWithUser(otherUserId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Nao autenticado" };
  if (!otherUserId || otherUserId === user.id) return { error: "Usuario invalido" };

  const profileSync = await ensureAuthUserProfileOrError(supabase, user);
  if ("error" in profileSync) return { error: profileSync.error };

  const { data: otherUser, error: otherUserError } = await supabase
    .from("users")
    .select("id, display_name, avatar_url, handle, role")
    .eq("id", otherUserId)
    .maybeSingle();

  const chatResult = await getOrCreateChatId(user.id, otherUserId);
  if ("error" in chatResult) return { error: chatResult.error };

  const { data: lastMessage } = await supabase
    .from("chat_messages")
    .select("id, content, created_at, is_read, sender_id, message_type")
    .eq("chat_id", chatResult.chatId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const normalizedLastMessage = (lastMessage || null) as ConversationMessage | null;

  const [creatorIdentityMap, subscriberIdentityMap] = await Promise.all([
    getCreatorIdentityMap(supabase, [otherUserId]),
    getSubscriberIdentityMap(supabase, [otherUserId]),
  ]);
  const normalizedOtherUser = otherUser
    ? applyContextIdentity(
        otherUser as FollowerProfile,
        creatorIdentityMap,
        subscriberIdentityMap
      )
    : null;

  return {
    success: true,
    conversation: {
      id: chatResult.chatId,
      otherUser: {
        id: normalizedOtherUser?.id || otherUserId,
        display_name: normalizedOtherUser?.display_name || (otherUserError ? "Creator" : null),
        avatar_url: normalizedOtherUser?.avatar_url || null,
        handle: normalizedOtherUser?.handle || null,
      },
      lastMessage: normalizedLastMessage,
      updatedAt: normalizedLastMessage?.created_at || new Date().toISOString(),
    } satisfies ConversationSummary,
  };
}

export async function getMessagesWithUser(otherUserId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: chats } = await supabase
    .from("chats")
    .select("id")
    .or(
      `and(participant1_id.eq.${user.id},participant2_id.eq.${otherUserId}),and(participant1_id.eq.${otherUserId},participant2_id.eq.${user.id})`
    )
    .order("updated_at", { ascending: false })
    .limit(1);

  const chat = (chats || [])[0];

  if (!chat) return [];

  const { data: messages } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("chat_id", chat.id)
    .order("created_at", { ascending: true });

  const safeMessages = (messages || []) as RawChatMessageRow[];
  const premiumMessageIds = safeMessages
    .filter((message) => message.message_type === "ppv_locked")
    .map((message) => message.id);

  const unlockedMessageIds = new Set<string>();

  if (premiumMessageIds.length > 0) {
    const { data: unlocks } = await supabase
      .from("ppv_unlocks")
      .select("message_id")
      .eq("subscriber_id", user.id)
      .in("message_id", premiumMessageIds);

    ((unlocks || []) as Array<{ message_id: string | null }>).forEach((unlock) => {
      if (unlock.message_id) unlockedMessageIds.add(unlock.message_id);
    });
  }

  await supabase
    .from("chat_messages")
    .update({ is_read: true })
    .eq("chat_id", chat.id)
    .eq("sender_id", otherUserId)
    .eq("is_read", false);

  return safeMessages.map((message) => buildChatMessageView(message, user.id, unlockedMessageIds));
}

export async function getChatIdWithUser(otherUserId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: chats } = await supabase
    .from("chats")
    .select("id")
    .or(
      `and(participant1_id.eq.${user.id},participant2_id.eq.${otherUserId}),and(participant1_id.eq.${otherUserId},participant2_id.eq.${user.id})`
    )
    .order("updated_at", { ascending: false })
    .limit(1);

  const chat = (chats || [])[0];
  return chat?.id || null;
}

export async function markChatAsRead(chatId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false };

  await supabase
    .from("chat_messages")
    .update({ is_read: true })
    .eq("chat_id", chatId)
    .neq("sender_id", user.id)
    .eq("is_read", false);

  return { success: true };
}

export async function unlockChatMessage(messageId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Nao autenticado" };

  const { data: message } = await supabase
    .from("chat_messages")
    .select("id, chat_id, sender_id, message_type, content, media_url, price, is_read, created_at")
    .eq("id", messageId)
    .maybeSingle();

  if (!message) return { error: "Mensagem nao encontrada." };
  if (message.sender_id === user.id) return { error: "Voce ja possui acesso a esta midia." };
  if (message.message_type !== "ppv_locked") return { error: "Esta mensagem nao exige unlock." };

  const amount = Number.parseFloat(message.price || "0");
  if (!Number.isFinite(amount) || amount <= 0) return { error: "Preco invalido para unlock." };

  const { data: chat } = await supabase
    .from("chats")
    .select("participant1_id, participant2_id")
    .eq("id", message.chat_id)
    .maybeSingle();

  const isParticipant =
    chat?.participant1_id === user.id || chat?.participant2_id === user.id;
  if (!isParticipant) return { error: "Voce nao faz parte desta conversa." };

  const { data: existingUnlock } = await supabase
    .from("ppv_unlocks")
    .select("id")
    .eq("subscriber_id", user.id)
    .eq("message_id", message.id)
    .maybeSingle();

  if (existingUnlock) {
    return {
      success: true,
      message: {
        ...(message as RawChatMessageRow),
        media_kind: inferMediaKind(message.media_url),
        access_state: "unlocked" as const,
      },
    };
  }

  const { error: unlockError } = await supabase.from("ppv_unlocks").insert({
    subscriber_id: user.id,
    creator_id: message.sender_id,
    message_id: message.id,
    amount_paid: amount.toFixed(2),
    currency: "BRL",
    stripe_payment_intent_id: `placeholder_chat_ppv_${Date.now()}`,
  });

  if (unlockError) return { error: unlockError.message };

  await supabase.from("notifications").insert([
    {
      user_id: user.id,
      type: "ppv_unlocked",
      title: "Midia do chat liberada",
      body: `Voce desbloqueou uma midia premium por ${formatCurrency(amount)} nesta conversa.`,
      data: { messageId: message.id, chatId: message.chat_id },
    },
    {
      user_id: message.sender_id,
      type: "ppv_unlocked",
      title: "Sua midia premium foi desbloqueada",
      body: `Uma midia do chat foi comprada por ${formatCurrency(amount)}.`,
      data: { messageId: message.id, chatId: message.chat_id, buyerId: user.id },
    },
  ]);

  revalidatePath("/dashboard/user/messages");
  revalidatePath("/dashboard/user/purchases");
  revalidatePath("/dashboard/creator/messages");

  return {
    success: true,
    message: {
      ...(message as RawChatMessageRow),
      media_kind: inferMediaKind(message.media_url),
      access_state: "unlocked" as const,
    },
  };
}
