import Image from "next/image";
import { trpc } from "@/lib/trpc-server";
import { auth } from "@wave/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { avatars, icons } from "@wave/ui";

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
    <div className="flex-1">
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
          <Image className="cursor-pointer" src={icons.settingLogo} alt="Settings" width={30} height={30} />
        </div>
      </div>
    </div>
  )
}
export default page;




