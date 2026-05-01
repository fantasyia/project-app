"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  ArrowLeft,
  Coins,
  Crown,
  Filter,
  Image as ImageIcon,
  Lock,
  MessageSquare,
  Search,
  Send,
  Sparkles,
  Star,
  Unlock,
  X,
} from "lucide-react";
import {
  getMessagesWithUser,
  markChatAsRead,
  sendChatTip,
  sendLockedMediaMessage,
  sendMessage,
  unlockChatMessage,
} from "@/lib/actions/social";
import { useRealtimeMessages, type ChatMessage, type LiveChatMessage } from "@/lib/hooks/use-realtime-messages";

type ChatParticipant = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
};

type ConversationLastMessage = {
  id: string;
  content: string | null;
  is_read: boolean;
  sender_id: string;
  message_type: string;
} | null;

type Conversation = {
  id: string;
  otherUser: ChatParticipant;
  lastMessage: ConversationLastMessage;
  updatedAt: string;
};

type ThreadActivity = {
  lastMessage: LiveChatMessage;
  markAsRead: boolean;
};

type ConversationFilter = "all" | "favorites" | "unread" | "premium" | "media";
type ComposerMode = "text" | "tip" | "premium";

const conversationFilters: Array<{
  id: ConversationFilter;
  label: string;
}> = [
  { id: "all", label: "Todas" },
  { id: "favorites", label: "Favoritas" },
  { id: "unread", label: "Nao lidas" },
  { id: "premium", label: "Premium" },
  { id: "media", label: "Midia" },
];

const tipPresets = [10, 25, 50, 100];

function sortConversations(conversations: Conversation[]) {
  return [...conversations].sort(
    (left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
  );
}

function matchesConversationFilter(
  conversation: Conversation,
  currentUserId: string,
  filter: ConversationFilter,
  favoriteChatIds: Set<string>
) {
  const lastMessage = conversation.lastMessage;

  if (filter === "all") return true;
  if (filter === "favorites") return favoriteChatIds.has(conversation.id);
  if (filter === "unread") {
    return Boolean(lastMessage && !lastMessage.is_read && lastMessage.sender_id !== currentUserId);
  }
  if (filter === "premium") return lastMessage?.message_type === "ppv_locked";
  if (filter === "media") return lastMessage?.message_type === "media" || lastMessage?.message_type === "ppv_locked";
  return true;
}

function getConversationCount(
  conversations: Conversation[],
  currentUserId: string,
  filter: ConversationFilter,
  favoriteChatIds: Set<string>
) {
  return conversations.filter((conversation) =>
    matchesConversationFilter(conversation, currentUserId, filter, favoriteChatIds)
  ).length;
}

function matchesConversationSearch(conversation: Conversation, searchQuery: string) {
  const normalizedQuery = searchQuery.trim().toLowerCase();
  if (!normalizedQuery) return true;

  const lastMessage = conversation.lastMessage?.content?.toLowerCase() || "";
  const displayName = conversation.otherUser.display_name?.toLowerCase() || "";

  return displayName.includes(normalizedQuery) || lastMessage.includes(normalizedQuery);
}

function isTipReceiptMessage(message: LiveChatMessage) {
  return message.content?.startsWith("Gorjeta enviada:") ?? false;
}

function formatCurrency(price: string | null) {
  const numericPrice = Number.parseFloat(price || "0");
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number.isFinite(numericPrice) ? numericPrice : 0);
}

function renderMediaFrame(message: LiveChatMessage, alt: string) {
  if (!message.media_url) return null;

  if (message.media_kind === "video") {
    return (
      <video
        src={message.media_url}
        controls
        playsInline
        className="mb-3 max-h-72 w-full rounded-[18px] border border-white/8 object-cover"
      />
    );
  }

  return (
    <Image
      unoptimized
      src={message.media_url}
      alt={alt}
      width={1200}
      height={900}
      className="mb-3 max-h-72 w-full rounded-[18px] border border-white/8 object-cover"
    />
  );
}

export function ChatLayout({
  currentUserId,
  currentUserRole,
  initialConversations,
  initialConversationId = null,
  audience = "user",
  frame = "full",
}: {
  currentUserId: string;
  currentUserRole: string;
  initialConversations: Conversation[];
  initialConversationId?: string | null;
  audience?: "user" | "creator";
  frame?: "full" | "embedded";
}) {
  const favoritesStorageKey = `fantasyia:${audience}:chat-favorites:${currentUserId}`;
  const seededConversations = sortConversations(initialConversations);
  const [conversations, setConversations] = useState(() => seededConversations);
  const [activeChat, setActiveChat] = useState<Conversation | null>(() => {
    if (!initialConversationId) return null;
    return seededConversations.find((conversation) => conversation.id === initialConversationId) || null;
  });
  const [initialMessages, setInitialMessages] = useState<ChatMessage[]>([]);
  const [loadingThread, setLoadingThread] = useState(Boolean(initialConversationId));
  const [filter, setFilter] = useState<ConversationFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [favoriteChatIds, setFavoriteChatIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];

    try {
      const storedValue = window.localStorage.getItem(favoritesStorageKey);
      if (!storedValue) return [];

      const parsedValue = JSON.parse(storedValue);
      return Array.isArray(parsedValue)
        ? parsedValue.filter((value) => typeof value === "string")
        : [];
    } catch {
      return [];
    }
  });

  const favoriteChatIdSet = useMemo(() => new Set(favoriteChatIds), [favoriteChatIds]);

  const filteredConversations = useMemo(
    () =>
      conversations.filter((conversation) => {
        const matchesFilter = matchesConversationFilter(
          conversation,
          currentUserId,
          filter,
          favoriteChatIdSet
        );
        const matchesSearch = matchesConversationSearch(conversation, searchQuery);
        return matchesFilter && matchesSearch;
      }),
    [conversations, currentUserId, favoriteChatIdSet, filter, searchQuery]
  );

  useEffect(() => {
    window.localStorage.setItem(favoritesStorageKey, JSON.stringify(favoriteChatIds));
  }, [favoriteChatIds, favoritesStorageKey]);

  useEffect(() => {
    if (!initialConversationId) return;
    if (!activeChat || activeChat.id !== initialConversationId) return;

    let cancelled = false;

    void (async () => {
      const messages = (await getMessagesWithUser(activeChat.otherUser.id)) as ChatMessage[];
      if (cancelled) return;

      setInitialMessages(messages);
      setConversations((prev) =>
        prev.map((conversation) =>
          conversation.id === activeChat.id && conversation.lastMessage
            ? {
                ...conversation,
                lastMessage: { ...conversation.lastMessage, is_read: true },
              }
            : conversation
        )
      );
      setLoadingThread(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [activeChat, initialConversationId]);

  async function openChat(chat: Conversation) {
    setActiveChat(chat);
    setLoadingThread(true);
    const messages = (await getMessagesWithUser(chat.otherUser.id)) as ChatMessage[];
    setInitialMessages(messages);
    setConversations((prev) =>
      prev.map((conversation) =>
        conversation.id === chat.id && conversation.lastMessage
          ? {
              ...conversation,
              lastMessage: { ...conversation.lastMessage, is_read: true },
            }
          : conversation
      )
    );
    setLoadingThread(false);
  }

  function handleThreadActivity(chatId: string, activity: ThreadActivity) {
    setConversations((prev) =>
      sortConversations(
        prev.map((conversation) =>
          conversation.id === chatId
            ? {
                ...conversation,
                updatedAt: activity.lastMessage.created_at,
                lastMessage: {
                  id: activity.lastMessage.id,
                  content: activity.lastMessage.content,
                  is_read: activity.markAsRead ? true : activity.lastMessage.is_read,
                  sender_id: activity.lastMessage.sender_id,
                  message_type: activity.lastMessage.message_type,
                },
              }
            : conversation
        )
      )
    );

    setActiveChat((prev) =>
      prev?.id === chatId
        ? {
            ...prev,
            updatedAt: activity.lastMessage.created_at,
            lastMessage: {
              id: activity.lastMessage.id,
              content: activity.lastMessage.content,
              is_read: activity.markAsRead ? true : activity.lastMessage.is_read,
              sender_id: activity.lastMessage.sender_id,
              message_type: activity.lastMessage.message_type,
            },
          }
        : prev
    );
  }

  function toggleFavorite(chatId: string) {
    setFavoriteChatIds((prev) =>
      prev.includes(chatId) ? prev.filter((currentId) => currentId !== chatId) : [chatId, ...prev]
    );
  }

  const isCreatorView = audience === "creator";
  const isEmbeddedFrame = frame === "embedded";
  const shellHeightClass = isEmbeddedFrame
    ? "flex min-h-[720px] w-full"
    : "flex h-[calc(100vh-4rem)] w-full";
  const listPaneClass = isEmbeddedFrame
    ? `${activeChat ? "hidden md:flex" : "flex"} w-full flex-col border-r border-white/5 bg-brand-surface-low md:w-80 lg:w-96`
    : `${activeChat ? "hidden" : "flex"} w-full flex-col border-r border-white/5 bg-brand-surface-low`;
  const threadPaneClass = isEmbeddedFrame
    ? `${activeChat ? "flex" : "hidden md:flex"} flex-1 flex-col bg-black`
    : `${activeChat ? "flex" : "hidden"} flex-1 flex-col bg-black`;
  const listSubtitle = isCreatorView
    ? "Operacao comercial com subscribers"
    : "Canal comercial em tempo real";
  const emptyListTitle = isCreatorView ? "Nenhuma conversa ainda." : "Nenhuma conversa ainda.";
  const emptyListBody = isCreatorView
    ? "Seus subscribers, unlocks e conversas comerciais aparecem aqui."
    : "Interaja com creators para iniciar.";
  const emptyFilterBody = isCreatorView
    ? "Troque a vista para revisar outros estados da operacao."
    : "Troque a vista para ver outras interacoes.";
  const emptyPanelTitle = isCreatorView ? "Selecione uma conversa para operar" : "Selecione uma conversa";
  const emptyPanelBody = isCreatorView
    ? "As threads do creator aparecem aqui com contexto comercial e envio premium."
    : "Mensagens aparecem aqui em tempo real.";
  const searchPlaceholder = isCreatorView
    ? "Buscar subscriber ou ultima mensagem"
    : "Buscar creator ou conversa";
  const premiumCount = conversations.filter(
    (conversation) => conversation.lastMessage?.message_type === "ppv_locked"
  ).length;
  const unreadCount = conversations.filter(
    (conversation) =>
      conversation.lastMessage &&
      !conversation.lastMessage.is_read &&
      conversation.lastMessage.sender_id !== currentUserId
  ).length;

  return (
    <div className={shellHeightClass}>
      <aside className={listPaneClass}>
        <div className="border-b border-white/5 p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-thin tracking-wide text-white">Mensagens</h1>
              <p className="mt-1 text-[10px] uppercase tracking-widest text-brand-text-muted">
                {listSubtitle}
              </p>
            </div>
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-brand-text-muted">
              <Filter size={16} />
            </div>
          </div>

          {conversations.length > 0 && (
            <>
              <div className="mt-5 grid grid-cols-3 gap-2">
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3">
                  <p className="text-[9px] uppercase tracking-[0.22em] text-brand-text-muted">Nao lidas</p>
                  <p className="mt-1 text-lg font-light text-white">{unreadCount}</p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3">
                  <p className="text-[9px] uppercase tracking-[0.22em] text-brand-text-muted">PPV</p>
                  <p className="mt-1 text-lg font-light text-white">{premiumCount}</p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3">
                  <p className="text-[9px] uppercase tracking-[0.22em] text-brand-text-muted">Favoritas</p>
                  <p className="mt-1 text-lg font-light text-white">{favoriteChatIds.length}</p>
                </div>
              </div>

              <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
                {conversationFilters.map((item) => {
                  const isActive = filter === item.id;
                  const count = getConversationCount(
                    conversations,
                    currentUserId,
                    item.id,
                    favoriteChatIdSet
                  );

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setFilter(item.id)}
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-[10px] uppercase tracking-[0.24em] transition ${
                        isActive
                          ? "border-brand-500/30 bg-brand-500/10 text-brand-300"
                          : "border-white/10 bg-white/[0.03] text-brand-text-muted hover:border-white/20 hover:text-white"
                      }`}
                    >
                      <span>{item.label}</span>
                      <span className="rounded-full bg-black/20 px-1.5 py-0.5 text-[9px] text-inherit">{count}</span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 flex items-center gap-2 rounded-2xl border border-white/8 bg-black/25 px-3 py-3">
                <Search size={14} className="text-brand-text-muted" />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder={searchPlaceholder}
                  className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-brand-text-muted/60"
                />
                {searchQuery ? (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="rounded-full p-1 text-brand-text-muted transition hover:text-white"
                  >
                    <X size={14} />
                  </button>
                ) : null}
              </div>

              <p className="mt-4 text-[10px] uppercase tracking-[0.22em] text-brand-text-muted/80">
                {filteredConversations.length} conversa{filteredConversations.length === 1 ? "" : "s"} nesta vista
              </p>
            </>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-6">
              <div className="rounded-[28px] border border-dashed border-white/10 bg-white/[0.02] px-5 py-10 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-500/10 text-brand-300">
                  <MessageSquare size={22} />
                </div>
                <p className="mt-4 text-sm text-white">{emptyListTitle}</p>
                <p className="mt-2 text-xs leading-6 text-brand-text-muted">{emptyListBody}</p>
                <Link
                  href="/dashboard/user/search"
                  className="mt-5 inline-flex items-center justify-center rounded-full border border-brand-500/20 bg-brand-500/10 px-4 py-2 text-[10px] uppercase tracking-[0.22em] text-brand-300 transition hover:border-brand-500/35 hover:bg-brand-500/15"
                >
                  Abrir creators
                </Link>
              </div>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-6">
              <div className="rounded-[28px] border border-dashed border-white/10 bg-white/[0.02] px-5 py-10 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.04] text-brand-text-muted">
                  <Filter size={20} />
                </div>
                <p className="mt-4 text-sm text-white">Nenhuma conversa encontrada nesta combinacao.</p>
                <p className="mt-2 text-xs leading-6 text-brand-text-muted">{emptyFilterBody}</p>
              </div>
            </div>
          ) : (
            filteredConversations.map((chat) => {
              const user = chat.otherUser;
              const lastMsg = chat.lastMessage;
              const isActive = activeChat?.id === chat.id;
              const isFavorite = favoriteChatIdSet.has(chat.id);

              return (
                <div
                  key={chat.id}
                  className={`border-b border-white/5 p-4 transition-colors ${
                    isActive ? "border-l-2 border-l-brand-500 bg-brand-500/10" : "hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-500/20 text-lg font-bold text-brand-500">
                      {user.avatar_url ? (
                        <Image
                          src={user.avatar_url}
                          alt={user.display_name || "Usuario"}
                          width={48}
                          height={48}
                          unoptimized
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        user.display_name?.[0]?.toUpperCase() || "?"
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => openChat(chat)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="truncate text-sm font-medium text-white">{user.display_name}</p>
                        <span className="ml-2 flex-shrink-0 text-[9px] tracking-wider text-brand-text-muted">
                          {chat.updatedAt
                            ? new Date(chat.updatedAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
                            : ""}
                        </span>
                      </div>

                      <div className="mt-1 flex items-center gap-2">
                        <p className="min-w-0 truncate text-xs text-brand-text-muted">
                          {lastMsg?.message_type === "ppv_locked" ? (
                            <span className="flex items-center gap-1">
                              <Crown size={10} /> Oferta PPV no chat
                            </span>
                          ) : lastMsg?.message_type === "media" ? (
                            <span className="flex items-center gap-1">
                              <ImageIcon size={10} /> Foto/Video
                            </span>
                          ) : (
                            lastMsg?.content || "Nova Conversa"
                          )}
                        </p>

                        {lastMsg && !lastMsg.is_read && lastMsg.sender_id !== currentUserId && (
                          <div className="h-2.5 w-2.5 flex-shrink-0 animate-pulse rounded-full bg-brand-500" />
                        )}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleFavorite(chat.id)}
                      className={`flex h-9 w-9 items-center justify-center rounded-full border transition ${
                        isFavorite
                          ? "border-brand-500/25 bg-brand-500/10 text-brand-300"
                          : "border-white/10 bg-black/20 text-brand-text-muted hover:text-white"
                      }`}
                      aria-label={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                    >
                      <Star size={14} className={isFavorite ? "fill-current" : ""} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>

      <main className={threadPaneClass}>
        {activeChat ? (
          <ChatThread
            key={activeChat.id}
            chatId={activeChat.id}
            currentUserId={currentUserId}
            currentUserRole={currentUserRole}
            otherUser={activeChat.otherUser}
            initialMessages={initialMessages}
            loading={loadingThread}
            isEmbeddedFrame={isEmbeddedFrame}
            isFavoriteConversation={favoriteChatIdSet.has(activeChat.id)}
            onBack={() => setActiveChat(null)}
            onToggleFavorite={() => toggleFavorite(activeChat.id)}
            onThreadActivity={(activity) => handleThreadActivity(activeChat.id, activity)}
          />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-brand-500/10">
              <MessageSquare size={28} className="text-brand-500" />
            </div>
            <h2 className="mb-2 text-xl font-thin text-white">{emptyPanelTitle}</h2>
            <p className="text-sm text-brand-text-muted">{emptyPanelBody}</p>
          </div>
        )}
      </main>
    </div>
  );
}

function ChatThread({
  chatId,
  currentUserId,
  currentUserRole,
  otherUser,
  initialMessages,
  loading,
  isEmbeddedFrame,
  isFavoriteConversation,
  onBack,
  onToggleFavorite,
  onThreadActivity,
}: {
  chatId: string;
  currentUserId: string;
  currentUserRole: string;
  otherUser: ChatParticipant;
  initialMessages: ChatMessage[];
  loading: boolean;
  isEmbeddedFrame: boolean;
  isFavoriteConversation: boolean;
  onBack: () => void;
  onToggleFavorite: () => void;
  onThreadActivity: (activity: ThreadActivity) => void;
}) {
  const { messages, bottomRef, appendMessage, replaceMessage, markMessageFailed, updateMessage } =
    useRealtimeMessages(chatId, currentUserId, initialMessages);
  const [composerMode, setComposerMode] = useState<ComposerMode>("text");
  const [newMsg, setNewMsg] = useState("");
  const [tipAmount, setTipAmount] = useState("25");
  const [tipNote, setTipNote] = useState("");
  const [premiumPrice, setPremiumPrice] = useState("39,90");
  const [premiumCaption, setPremiumCaption] = useState("");
  const [premiumFile, setPremiumFile] = useState<File | null>(null);
  const [premiumPreviewUrl, setPremiumPreviewUrl] = useState<string | null>(null);
  const [composerError, setComposerError] = useState<string | null>(null);
  const [unlockingMessageId, setUnlockingMessageId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const lastSyncedMessageRef = useRef<string | null>(null);
  const canSendPremiumOffers = currentUserRole === "creator";
  const threadHeaderPaddingClass = isEmbeddedFrame ? "px-4 md:px-6" : "px-4";
  const threadBackButtonClass = isEmbeddedFrame
    ? "text-brand-text-muted transition-colors hover:text-brand-500 md:hidden"
    : "text-brand-text-muted transition-colors hover:text-brand-500";
  const threadBlockPaddingClass = isEmbeddedFrame ? "px-4 py-4 md:px-6" : "px-4 py-4";
  const threadTimelinePaddingClass = isEmbeddedFrame
    ? "flex-1 space-y-4 overflow-y-auto px-4 py-6 md:px-6"
    : "flex-1 space-y-4 overflow-y-auto px-4 py-6";
  const messageBubbleMaxWidthClass = isEmbeddedFrame ? "max-w-[78%] md:max-w-[62%]" : "max-w-[82%]";
  const tipGridClass = isEmbeddedFrame
    ? "grid gap-3 sm:grid-cols-[140px_minmax(0,1fr)]"
    : "grid gap-3";
  const premiumGridClass = isEmbeddedFrame
    ? "grid gap-3 sm:grid-cols-[minmax(0,1fr)_120px]"
    : "grid gap-3";

  useEffect(() => {
    return () => {
      if (premiumPreviewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(premiumPreviewUrl);
      }
    };
  }, [premiumPreviewUrl]);

  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage) return;

    const syncKey = `${lastMessage.id}:${lastMessage.deliveryState ?? "sent"}:${lastMessage.is_read ? "read" : "unread"}`;
    if (lastSyncedMessageRef.current === syncKey) return;
    lastSyncedMessageRef.current = syncKey;

    const markAsRead = lastMessage.sender_id !== currentUserId;
    onThreadActivity({ lastMessage, markAsRead });

    if (!markAsRead || lastMessage.deliveryState === "sending") return;
    void markChatAsRead(chatId);
  }, [chatId, currentUserId, messages, onThreadActivity]);

  function resetPremiumDraft() {
    if (premiumPreviewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(premiumPreviewUrl);
    }

    setPremiumCaption("");
    setPremiumFile(null);
    setPremiumPreviewUrl(null);
    setPremiumPrice("39,90");
  }

  function handlePremiumFileChange(file: File | null) {
    if (premiumPreviewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(premiumPreviewUrl);
    }

    setPremiumFile(file);
    setPremiumPreviewUrl(file ? URL.createObjectURL(file) : null);
  }

  function handleSendText() {
    const text = newMsg.trim();
    if (!text) return;

    setComposerError(null);

    const optimisticId = `temp-${Date.now()}`;
    const optimisticMessage: LiveChatMessage = {
      id: optimisticId,
      chat_id: chatId,
      sender_id: currentUserId,
      message_type: "text",
      content: text,
      media_url: null,
      price: null,
      is_read: true,
      created_at: new Date().toISOString(),
      deliveryState: "sending",
      access_state: "owner",
    };

    appendMessage(optimisticMessage);
    setNewMsg("");

    startTransition(async () => {
      const result = await sendMessage(otherUser.id, text);
      if (result?.success && result.message) {
        replaceMessage(optimisticId, result.message);
        return;
      }

      setComposerError(result?.error || "Nao foi possivel enviar a mensagem.");
      markMessageFailed(optimisticId);
    });

    inputRef.current?.focus();
  }

  function handleSendTip() {
    const amount = Number.parseFloat(tipAmount.replace(",", "."));
    const normalizedNote = tipNote.trim();

    if (!Number.isFinite(amount) || amount <= 0) {
      setComposerError("Informe um valor valido para a gorjeta.");
      return;
    }

    setComposerError(null);

    const content = normalizedNote
      ? `Gorjeta enviada: R$ ${amount.toFixed(2).replace(".", ",")}. Recado: ${normalizedNote}`
      : `Gorjeta enviada: R$ ${amount.toFixed(2).replace(".", ",")}.`;

    const optimisticId = `temp-tip-${Date.now()}`;
    const optimisticMessage: LiveChatMessage = {
      id: optimisticId,
      chat_id: chatId,
      sender_id: currentUserId,
      message_type: "text",
      content,
      media_url: null,
      price: null,
      is_read: true,
      created_at: new Date().toISOString(),
      deliveryState: "sending",
      access_state: "owner",
    };

    appendMessage(optimisticMessage);

    startTransition(async () => {
      const result = await sendChatTip(otherUser.id, amount, normalizedNote || undefined);

      if (result?.success && "message" in result && result.message) {
        replaceMessage(optimisticId, result.message);
        setTipNote("");
        setComposerMode("text");
        return;
      }

      if (result?.success) {
        replaceMessage(optimisticId, {
          ...optimisticMessage,
          id: `local-tip-${Date.now()}`,
          created_at: new Date().toISOString(),
        });
        setTipNote("");
        setComposerMode("text");
        return;
      }

      setComposerError(("error" in result ? result.error : null) || "Nao foi possivel enviar a gorjeta.");
      markMessageFailed(optimisticId);
    });
  }

  function handleSendPremiumMedia() {
    if (!canSendPremiumOffers) return;

    if (!premiumFile) {
      setComposerError("Selecione uma imagem ou video para travar no chat.");
      return;
    }

    const amount = Number.parseFloat(premiumPrice.replace(",", "."));
    if (!Number.isFinite(amount) || amount <= 0) {
      setComposerError("Informe um preco valido para a midia premium.");
      return;
    }

    setComposerError(null);

    const optimisticId = `temp-premium-${Date.now()}`;
    const optimisticMessage: LiveChatMessage = {
      id: optimisticId,
      chat_id: chatId,
      sender_id: currentUserId,
      message_type: "ppv_locked",
      content: premiumCaption.trim() || "Midia premium exclusiva enviada no chat.",
      media_url: premiumPreviewUrl,
      media_kind: premiumFile.type.startsWith("video/") ? "video" : "image",
      price: amount.toFixed(2),
      is_read: true,
      created_at: new Date().toISOString(),
      deliveryState: "sending",
      access_state: "owner",
    };

    appendMessage(optimisticMessage);

    const formData = new FormData();
    formData.set("receiverId", otherUser.id);
    formData.set("caption", premiumCaption.trim());
    formData.set("price", amount.toFixed(2));
    formData.set("media", premiumFile);

    startTransition(async () => {
      const result = await sendLockedMediaMessage(formData);

      if (result?.success && "message" in result && result.message) {
        replaceMessage(optimisticId, result.message as ChatMessage);
        resetPremiumDraft();
        setComposerMode("text");
        return;
      }

      setComposerError(("error" in result ? result.error : null) || "Nao foi possivel enviar a midia premium.");
      markMessageFailed(optimisticId);
    });
  }

  function handleUnlockMessage(message: LiveChatMessage) {
    setComposerError(null);
    setUnlockingMessageId(message.id);

    startTransition(async () => {
      const result = await unlockChatMessage(message.id);

      if (result?.success && result.message) {
        updateMessage(message.id, (currentMessage) => ({
          ...currentMessage,
          ...result.message,
          deliveryState: undefined,
        }));
        setUnlockingMessageId(null);
        return;
      }

      setComposerError(result?.error || "Nao foi possivel concluir o unlock agora.");
      setUnlockingMessageId(null);
    });
  }

  return (
    <>
      <header className={`flex h-16 flex-shrink-0 items-center gap-4 border-b border-white/5 bg-brand-surface-lowest ${threadHeaderPaddingClass}`}>
        <button onClick={onBack} className={threadBackButtonClass}>
          <ArrowLeft size={20} />
        </button>
        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-brand-500/20 font-bold text-brand-500">
          {otherUser.avatar_url ? (
            <Image
              src={otherUser.avatar_url}
              alt={otherUser.display_name || "Usuario"}
              width={40}
              height={40}
              unoptimized
              className="h-full w-full object-cover"
            />
          ) : (
            otherUser.display_name?.[0]?.toUpperCase() || "?"
          )}
        </div>
        <div>
          <h3 className="text-sm font-medium text-white">{otherUser.display_name}</h3>
          <div className="flex items-center gap-1">
            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-500" />
            <span className="text-[9px] font-bold uppercase tracking-widest text-brand-500">Realtime</span>
          </div>
        </div>
        <button
          type="button"
          onClick={onToggleFavorite}
          className={`ml-auto inline-flex h-10 w-10 items-center justify-center rounded-full border transition ${
            isFavoriteConversation
              ? "border-brand-500/25 bg-brand-500/10 text-brand-300"
              : "border-white/10 bg-white/[0.03] text-brand-text-muted hover:text-white"
          }`}
          aria-label={isFavoriteConversation ? "Remover dos favoritos" : "Adicionar aos favoritos"}
        >
          <Star size={15} className={isFavoriteConversation ? "fill-current" : ""} />
        </button>
      </header>

      <div className={`border-b border-white/5 ${threadBlockPaddingClass}`}>
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setComposerMode("text")}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-[10px] uppercase tracking-[0.24em] transition ${
              composerMode === "text"
                ? "border-brand-500/30 bg-brand-500/10 text-brand-300"
                : "border-white/10 bg-white/[0.03] text-brand-text-muted hover:border-white/20 hover:text-white"
            }`}
          >
            <MessageSquare size={12} />
            Mensagem
          </button>
          <button
            type="button"
            onClick={() => setComposerMode("tip")}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-[10px] uppercase tracking-[0.24em] transition ${
              composerMode === "tip"
                ? "border-brand-500/30 bg-brand-500/10 text-brand-300"
                : "border-white/10 bg-white/[0.03] text-brand-text-muted hover:border-white/20 hover:text-white"
            }`}
          >
            <Coins size={12} />
            Gorjeta
          </button>
          {canSendPremiumOffers && (
            <button
              type="button"
              onClick={() => setComposerMode("premium")}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-[10px] uppercase tracking-[0.24em] transition ${
                composerMode === "premium"
                  ? "border-brand-500/30 bg-brand-500/10 text-brand-300"
                  : "border-white/10 bg-white/[0.03] text-brand-text-muted hover:border-white/20 hover:text-white"
              }`}
            >
              <Crown size={12} />
              Midia PPV
            </button>
          )}
        </div>

        <p className="mt-3 text-[11px] leading-5 text-brand-text-muted">
          {composerMode === "text"
            ? "Conversa normal do app com entrega em tempo real."
            : composerMode === "tip"
              ? "Gorjeta local com registro financeiro mock e comprovante enviado na thread."
              : "Oferta de midia premium no chat com upload real e unlock individual na conversa."}
        </p>
      </div>

      <div className={threadTimelinePaddingClass}>
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="flex items-center gap-2 text-sm text-brand-text-muted">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-500/30 border-t-brand-500" />
              Carregando...
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="max-w-sm rounded-[28px] border border-dashed border-white/10 bg-white/[0.02] px-6 py-8">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-500/10 text-brand-300">
                <MessageSquare size={20} />
              </div>
              <p className="mt-4 text-sm text-white">Diga oi para abrir o canal.</p>
              <p className="mt-2 text-sm leading-6 text-brand-text-muted">
                O chat tambem funciona como canal comercial direto para assinatura, gorjeta e unlock
                de midias premium.
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.sender_id === currentUserId;
            const isTipMessage = isTipReceiptMessage(msg);
            const isLockedPremium = msg.message_type === "ppv_locked" && msg.access_state === "locked";
            const isUnlockedPremium = msg.message_type === "ppv_locked" && msg.access_state !== "locked";

            return (
              <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`${messageBubbleMaxWidthClass} rounded-2xl px-4 py-3 shadow-lg ${
                    isTipMessage
                      ? "border border-brand-500/25 bg-brand-500/10 text-white"
                      : isLockedPremium
                        ? "border border-brand-500/20 bg-[linear-gradient(180deg,rgba(0,168,107,0.12),rgba(5,7,6,0.94))] text-white"
                        : isUnlockedPremium
                          ? isMine
                            ? "border border-brand-500/25 bg-brand-500/12 text-white"
                            : "border border-white/8 bg-brand-surface-low text-white"
                          : isMine
                            ? "rounded-br-md bg-brand-500 text-black"
                            : "rounded-bl-md border border-white/5 bg-brand-surface-low text-white"
                  }`}
                >
                  {isLockedPremium ? (
                    <div>
                      <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/20 bg-black/25 px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] text-brand-300">
                        <Lock size={11} />
                        Midia premium
                      </div>
                      <p className="mt-3 text-sm leading-6 text-brand-text-base">
                        {msg.content || "Conteudo travado no chat. O unlock libera a midia original nesta conversa."}
                      </p>
                      <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-black/25 px-3 py-3">
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.22em] text-brand-text-muted">Unlock</p>
                          <p className="mt-1 text-sm text-white">{formatCurrency(msg.price)}</p>
                        </div>
                        <button
                          type="button"
                          disabled={unlockingMessageId === msg.id || pending}
                          onClick={() => handleUnlockMessage(msg)}
                          className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-black transition hover:bg-brand-400 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Unlock size={12} />
                          {unlockingMessageId === msg.id ? "Liberando..." : "Desbloquear"}
                        </button>
                      </div>
                    </div>
                  ) : isUnlockedPremium ? (
                    <div>
                      <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/20 bg-brand-500/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] text-brand-300">
                        <Sparkles size={11} />
                        {msg.access_state === "owner" ? "Oferta enviada" : "Midia liberada"}
                      </div>
                      {renderMediaFrame(msg, msg.content || "Midia premium")}
                      <p className="text-sm leading-6 text-white">{msg.content}</p>
                      <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/8 bg-black/25 px-3 py-1.5 text-[10px] uppercase tracking-[0.22em] text-brand-text-muted">
                        <Crown size={11} className="text-brand-300" />
                        {formatCurrency(msg.price)}
                      </div>
                    </div>
                  ) : msg.message_type === "media" && msg.media_url ? (
                    <div>
                      {renderMediaFrame(msg, msg.content || "Midia enviada")}
                      {msg.content && <p className="text-sm">{msg.content}</p>}
                    </div>
                  ) : isTipMessage ? (
                    <div>
                      <div className="flex items-center gap-2 text-sm text-brand-300">
                        <Sparkles size={14} />
                        <span className="font-medium uppercase tracking-[0.18em]">Gorjeta confirmada</span>
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-white">{msg.content?.replace("Gorjeta enviada: ", "")}</p>
                    </div>
                  ) : (
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                  )}

                  <div className="mt-1 flex items-center justify-between gap-3">
                    <span
                      className={`block text-[9px] tracking-wider ${
                        isTipMessage || isLockedPremium || isUnlockedPremium
                          ? "text-brand-text-muted"
                          : isMine
                            ? "text-black/50"
                            : "text-brand-text-muted"
                      }`}
                    >
                      {new Date(msg.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </span>

                    {msg.deliveryState === "sending" && (
                      <span
                        className={`text-[9px] uppercase tracking-[0.22em] ${
                          isMine && !isTipMessage && !isLockedPremium && !isUnlockedPremium
                            ? "text-black/50"
                            : "text-brand-text-muted"
                        }`}
                      >
                        Enviando
                      </span>
                    )}
                    {msg.deliveryState === "failed" && (
                      <span className="text-[9px] uppercase tracking-[0.22em] text-rose-200">Falha</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex-shrink-0 border-t border-white/5 bg-brand-surface-lowest p-4">
        {composerMode === "tip" ? (
          <div className="space-y-4">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {tipPresets.map((amount) => {
                const isActive = tipAmount === String(amount);

                return (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => setTipAmount(String(amount))}
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-[10px] uppercase tracking-[0.24em] transition ${
                      isActive
                        ? "border-brand-500/30 bg-brand-500/10 text-brand-300"
                        : "border-white/10 bg-white/[0.03] text-brand-text-muted hover:border-white/20 hover:text-white"
                    }`}
                  >
                    <Coins size={12} />
                    R$ {amount}
                  </button>
                );
              })}
            </div>

            <div className={tipGridClass}>
              <input
                value={tipAmount}
                onChange={(event) => setTipAmount(event.target.value)}
                inputMode="decimal"
                placeholder="25"
                className="h-12 rounded-2xl border border-white/10 bg-black/30 px-4 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-brand-500/40"
              />
              <input
                value={tipNote}
                onChange={(event) => setTipNote(event.target.value)}
                placeholder="Recado opcional"
                className="h-12 rounded-2xl border border-white/10 bg-black/30 px-4 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-brand-500/40"
              />
            </div>

            <button
              type="button"
              disabled={pending}
              onClick={handleSendTip}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-black transition hover:bg-brand-400 disabled:bg-brand-500/30"
            >
              <Coins size={16} />
              {pending ? "Processando..." : "Enviar gorjeta"}
            </button>
          </div>
        ) : composerMode === "premium" && canSendPremiumOffers ? (
          <div className="space-y-4">
            <div className="rounded-[24px] border border-brand-500/20 bg-brand-500/10 p-4">
              <p className="text-[10px] uppercase tracking-[0.26em] text-brand-300">Oferta PPV no chat</p>
              <p className="mt-2 text-sm leading-6 text-brand-text-base">
                Envie uma midia premium travada. O usuario libera a imagem ou video dentro da propria conversa.
              </p>
            </div>

            <div className={premiumGridClass}>
              <input
                value={premiumCaption}
                onChange={(event) => setPremiumCaption(event.target.value)}
                placeholder="Legenda ou teaser da oferta"
                className="h-12 rounded-2xl border border-white/10 bg-black/30 px-4 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-brand-500/40"
              />
              <input
                value={premiumPrice}
                onChange={(event) => setPremiumPrice(event.target.value)}
                inputMode="decimal"
                placeholder="39,90"
                className="h-12 rounded-2xl border border-white/10 bg-black/30 px-4 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-brand-500/40"
              />
            </div>

            <label className="flex cursor-pointer flex-col gap-3 rounded-[24px] border border-dashed border-white/12 bg-black/25 p-4 transition hover:border-brand-500/30">
              <span className="text-[10px] uppercase tracking-[0.26em] text-brand-text-muted">Selecionar midia</span>
              <input
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={(event) => handlePremiumFileChange(event.target.files?.[0] || null)}
              />
              {premiumPreviewUrl ? (
                premiumFile?.type.startsWith("video/") ? (
                  <video src={premiumPreviewUrl} controls playsInline className="max-h-56 w-full rounded-[18px] object-cover" />
                ) : (
                  <Image
                    unoptimized
                    src={premiumPreviewUrl}
                    alt="Preview da midia premium"
                    width={1200}
                    height={900}
                    className="max-h-56 w-full rounded-[18px] object-cover"
                  />
                )
              ) : (
                <div className="flex min-h-28 items-center justify-center rounded-[18px] border border-white/8 bg-white/[0.03] text-sm text-brand-text-muted">
                  Toque para escolher imagem ou video
                </div>
              )}
              <span className="text-xs text-brand-text-muted">
                {premiumFile ? premiumFile.name : "A midia sobe para o bucket local e vira oferta travada na thread."}
              </span>
            </label>

            <button
              type="button"
              disabled={pending || !premiumFile}
              onClick={handleSendPremiumMedia}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-black transition hover:bg-brand-400 disabled:bg-brand-500/30"
            >
              <Crown size={16} />
              {pending ? "Enviando oferta..." : "Enviar midia premium"}
            </button>
          </div>
        ) : (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              handleSendText();
            }}
            className="flex items-center gap-3"
          >
            <input
              ref={inputRef}
              value={newMsg}
              onChange={(event) => setNewMsg(event.target.value)}
              placeholder="Digite uma mensagem..."
              autoComplete="off"
              className="flex-1 border-0 border-b border-white/10 bg-transparent px-2 py-3 text-sm font-light text-white outline-none transition-colors placeholder:text-white/20 focus:border-brand-500"
            />
            <button
              type="submit"
              disabled={pending || !newMsg.trim()}
              className="rounded-xl bg-brand-500 p-3 text-black transition-colors hover:bg-brand-400 disabled:bg-brand-500/30"
            >
              <Send size={18} />
            </button>
          </form>
        )}

        {composerError && (
          <div className="mt-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {composerError}
          </div>
        )}
      </div>
    </>
  );
}
