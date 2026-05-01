"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type ChatMessage = {
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

export type LiveChatMessage = ChatMessage & {
  deliveryState?: "sending" | "failed";
};

function sortMessages(messages: LiveChatMessage[]) {
  return [...messages].sort((left, right) => new Date(left.created_at).getTime() - new Date(right.created_at).getTime());
}

function inferMediaKind(mediaUrl: string | null): "image" | "video" | undefined {
  if (!mediaUrl) return undefined;
  if (/\.(mp4|mov|webm|m4v)(\?|$)/i.test(mediaUrl)) return "video";
  return "image";
}

/**
 * Subscribes to new messages in a specific chat via Supabase Realtime.
 * Returns the live messages array (initial + realtime inserts).
 */
export function useRealtimeMessages(chatId: string, currentUserId: string, initialMessages: ChatMessage[]) {
  const [messages, setMessages] = useState<LiveChatMessage[]>(initialMessages);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    if (!chatId) return;

    const supabase = createClient();

    const channel = supabase
      .channel(`chat-${chatId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          const isLockedPremium =
            newMsg.message_type === "ppv_locked" &&
            Number.parseFloat(newMsg.price || "0") > 0 &&
            newMsg.sender_id !== currentUserId;
          const decoratedMessage: ChatMessage = {
            ...newMsg,
            media_kind: newMsg.media_kind || inferMediaKind(newMsg.media_url),
            access_state: newMsg.sender_id === currentUserId ? "owner" : isLockedPremium ? "locked" : "unlocked",
            media_url: isLockedPremium ? null : newMsg.media_url,
          };
          setMessages((prev) => {
            // Prevent duplicates
            if (prev.some((m) => m.id === decoratedMessage.id)) return prev;
            return sortMessages([...prev, decoratedMessage]);
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId, currentUserId]);

  // Auto-scroll on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function appendMessage(message: LiveChatMessage) {
    setMessages((prev) => {
      if (prev.some((existingMessage) => existingMessage.id === message.id)) return prev;
      return sortMessages([...prev, message]);
    });
  }

  function replaceMessage(tempMessageId: string, nextMessage: ChatMessage) {
    setMessages((prev) => {
      const withoutTemp = prev.filter((message) => message.id !== tempMessageId);
      if (withoutTemp.some((message) => message.id === nextMessage.id)) return withoutTemp;
      return sortMessages([...withoutTemp, nextMessage]);
    });
  }

  function markMessageFailed(tempMessageId: string) {
    setMessages((prev) =>
      prev.map((message) => (message.id === tempMessageId ? { ...message, deliveryState: "failed" } : message))
    );
  }

  function updateMessage(nextMessageId: string, updater: (message: LiveChatMessage) => LiveChatMessage) {
    setMessages((prev) => prev.map((message) => (message.id === nextMessageId ? updater(message) : message)));
  }

  return { messages, bottomRef, appendMessage, replaceMessage, markMessageFailed, updateMessage };
}
