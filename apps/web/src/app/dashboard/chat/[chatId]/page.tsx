import Image from "next/image";
import { trpc } from "@/lib/trpc-server";
import { auth } from "@wave/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { avatars, icons } from "@wave/ui";
import { ImageIcon, Mic, Paperclip, Send, Settings } from "lucide-react";

const page = async ({ params }: { params: Promise<{ chatId: string }> }) => {
  const chatId = (await params)?.chatId;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/login");
  }
  const serverTrpc = await trpc();
  const chat = await serverTrpc.chat.getChatById({ chatId });
  const otherParticipant = chat.chatParticipants.find(
    (participant: { user: { id: string } }) => participant.user.id !== session.user.id,
  );

  return (
    <div className="flex w-full max-w-screen flex-col">
      {/* header */}
      <div className="flex rounded-2xl w-full h-20 justify-between border-b border-gray-700 border-r dark:border-gray-200">
        <div className="flex items-center gap-4 ml-12">
          <Image
            src={
              otherParticipant?.user.image || avatars.defaultAvatar
            }
            alt="User Avatar"
            width={30}
            height={30}
            className="rounded-full"
          />
          <span className="text-lg font-semibold">
            {otherParticipant?.user.name ?? session.user.name}
          </span>
        </div>
        <div className="flex items-center gap-4 mr-10">
          <Image className="cursor-pointer" src={icons.callLogo} alt="Call" width={30} height={30} />
          <Image className="cursor-pointer" src={icons.videoCallLogo} alt="Video Call" width={30} height={30} />
          <Settings className="cursor-pointer" size={30} aria-label="Settings" />
        </div>
      </div>

      {/* messages */}
      <div className="flex flex-1 h-screen items-center justify-center">

      </div>
      {/* message input */}
      <div className="mx-3 flex h-20 items-center">
        <div className="flex w-full items-center gap-3 rounded-2xl border border-gray-700 px-4 py-2">

          <div className="flex shrink-0 items-center gap-2">
            <Paperclip className="cursor-pointer" size={28} aria-label="Attach file" />
            <ImageIcon className="cursor-pointer" size={24} aria-label="Add image" />
            <Mic className="cursor-pointer" size={24} aria-label="Voice message" />
          </div>

          <input
            type="text"
            className="h-10 min-w-0 flex-1 rounded-full border border-gray-300 bg-gray-100 px-4 text-sm  dark:border-gray-600 dark:bg-gray-800 dark:text-white "
            placeholder="Type a message..."
          />
          <Send className="shrink-0 cursor-pointer" size={24} />
        </div>
      </div>
    </div>
  )
}
export default page;




