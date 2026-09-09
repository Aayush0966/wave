import Image from "next/image";
import { trpc } from "@/lib/trpc-server";
import { auth } from "@wave/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { avatars, icons } from "@wave/ui";
import { Settings } from "lucide-react";
import MessageComposer from "../../../../components/dashboard/chat/MessageComposer";
import { sendMessage } from "./actions";
import MessageList from "../../../../components/dashboard/chat/MessageList";

const page = async ({ params }: { params: Promise<{ chatId: string }> }) => {
  const chatId = (await params)?.chatId;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/auth/signin");
  }
  const serverTrpc = await trpc();
  const chat = await serverTrpc.chat.getChatById({ chatId });
  const otherParticipant = chat.chatParticipants.find(
    (participant: { user: { id: string } }) => participant.user.id !== session.user.id,
  );
  const messages = (await serverTrpc.message.getMessagesByChatId({ chatId })) ?? [];
  const sender = chat.chatParticipants.find(
    (participant: { user: { id: string } }) => participant.user.id === session.user.id,
  );
  const sendMessageForChat = sendMessage.bind(null, chatId, sender.id);

  return (
    <div className="flex min-w-0 flex-1 flex-col bg-white dark:bg-background-secondary">
      {/* header */}
      <div className="flex h-20 w-full shrink-0 items-center justify-between border-gray-200 border-b px-4 sm:px-8 dark:border-gray-700">
        <div className="flex min-w-0 items-center gap-3">
          <Image
            src={
              otherParticipant?.user.image || avatars.defaultAvatar
            }
            alt="User Avatar"
            width={36}
            height={36}
            className="rounded-full"
          />
          <span className="truncate text-base font-semibold sm:text-lg">
            {otherParticipant?.user.name ?? session.user.name}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1 sm:gap-3">
          <button type="button" title="Start call" className="cursor-pointer rounded-full p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800">
            <Image src={icons.callLogo} alt="Call" width={24} height={24} />
          </button>
          <button type="button" title="Start video call" className="cursor-pointer rounded-full p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800">
            <Image src={icons.videoCallLogo} alt="Video Call" width={24} height={24} />
          </button>
          <button type="button" title="Chat settings" className="cursor-pointer rounded-full p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800">
            <Settings size={22} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* messages */}
      <MessageList initialMessages={messages} senderId={sender.id} chatId={chatId} />

      {/* message composer */}
      <MessageComposer action={sendMessageForChat} chatId={chatId} senderId={sender.id} />
    </div>
  )
}
export default page;




