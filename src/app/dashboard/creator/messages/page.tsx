import { Crown, MessageSquare } from "lucide-react";
import { getCurrentUser } from "@/lib/actions/auth";
import { getConversations } from "@/lib/actions/social";
import { ChatLayout } from "@/app/dashboard/subscriber/messages/chat-layout";

export const metadata = { title: "Inbox | Creator Studio" };

type ConversationSummary = {
  id: string;
  updatedAt: string;
  otherUser: {
    id: string;
    display_name: string;
    avatar_url: string | null;
  };
  lastMessage: {
    id: string;
    content: string | null;
    is_read: boolean;
    sender_id: string;
    message_type: string;
  } | null;
};

export default async function CreatorMessagesPage() {
  const user = await getCurrentUser("creator");
  if (!user) return <div className="p-6 text-brand-text-muted">Faça login para acessar a inbox.</div>;

  const conversations = (await getConversations()) as ConversationSummary[];
  const unreadCount = conversations.filter(
    (conversation) =>
      conversation.lastMessage &&
      !conversation.lastMessage.is_read &&
      conversation.lastMessage.sender_id !== user.id
  ).length;
  const premiumThreads = conversations.filter(
    (conversation) => conversation.lastMessage?.message_type === "ppv_locked"
  ).length;

  return (
    <div className="space-y-4">
      {/* Stats Row */}
      <div className="flex gap-3">
        <div className="flex flex-1 items-center gap-3 rounded-xl border border-white/[0.06] bg-brand-surface-low px-4 py-3">
          <MessageSquare size={16} className="text-brand-400" />
          <div>
            <p className="text-lg font-semibold text-white">{conversations.length}</p>
            <p className="text-[10px] text-brand-text-muted">Conversas</p>
          </div>
        </div>
        <div className="flex flex-1 items-center gap-3 rounded-xl border border-white/[0.06] bg-brand-surface-low px-4 py-3">
          <div className="h-2 w-2 rounded-full bg-brand-500" />
          <div>
            <p className="text-lg font-semibold text-white">{unreadCount}</p>
            <p className="text-[10px] text-brand-text-muted">Não lidas</p>
          </div>
        </div>
        <div className="flex flex-1 items-center gap-3 rounded-xl border border-white/[0.06] bg-brand-surface-low px-4 py-3">
          <Crown size={16} className="text-brand-300" />
          <div>
            <p className="text-lg font-semibold text-white">{premiumThreads}</p>
            <p className="text-[10px] text-brand-text-muted">PPV</p>
          </div>
        </div>
      </div>

      {/* Chat */}
      <div className="overflow-hidden rounded-xl border border-white/[0.06]">
        <ChatLayout
          currentUserId={user.id}
          currentUserRole={user.role}
          initialConversations={conversations}
          audience="creator"
          frame="embedded"
        />
      </div>
    </div>
  );
}
