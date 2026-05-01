import { MessageSquare } from "lucide-react";
import { getCurrentUser } from "@/lib/actions/auth";
import { ensureConversationWithUser, getConversations } from "@/lib/actions/social";
import { ChatLayout } from "./chat-layout";

export const metadata = { title: "Chat | Fantasyia" };

export default async function MessagesPage({
  searchParams,
}: {
  searchParams?: Promise<{ with?: string }> | { with?: string };
}) {
  const user = await getCurrentUser("subscriber");
  if (!user) {
    return (
      <div className="px-4 py-4">
        <div className="rounded-[28px] border border-dashed border-white/10 bg-black/20 px-6 py-16 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
            <MessageSquare size={24} className="text-brand-300" />
          </div>
          <h2 className="text-lg text-white">Faca login para acessar o chat</h2>
          <p className="mt-2 text-sm leading-6 text-brand-text-muted">O chat e um canal comercial central da plataforma e precisa de sessao ativa para abrir conversas.</p>
        </div>
      </div>
    );
  }

  let conversations = await getConversations();
  let initialConversationId: string | null = null;
  const resolvedSearchParams =
    searchParams && typeof (searchParams as Promise<{ with?: string }>).then === "function"
      ? await (searchParams as Promise<{ with?: string }>)
      : (searchParams as { with?: string } | undefined);
  const targetUserId = resolvedSearchParams?.with?.trim();

  if (targetUserId && targetUserId !== user.id) {
    const ensuredConversation = await ensureConversationWithUser(targetUserId);

    if (ensuredConversation?.success && ensuredConversation.conversation) {
      if (!conversations.some((conversation) => conversation.id === ensuredConversation.conversation.id)) {
        conversations = [ensuredConversation.conversation, ...conversations];
      }
      initialConversationId = ensuredConversation.conversation.id;
    }
  }

  return (
    <ChatLayout
      currentUserId={user.id}
      currentUserRole={user.role}
      initialConversations={conversations}
      initialConversationId={initialConversationId}
    />
  );
}
