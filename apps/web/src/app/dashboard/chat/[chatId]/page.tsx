import { TRPCError } from "@trpc/server";
import { auth } from "@wave/auth";
import { avatars, icons } from "@wave/ui";
import { ArrowLeft, Settings } from "lucide-react";
import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import ChatPresence from "@/components/dashboard/chat/ChatPresence";
import ChatSearch from "@/components/dashboard/chat/ChatSearch";
import { trpc } from "@/lib/trpc-server";
import MessageComposer from "../../../../components/dashboard/chat/MessageComposer";
import MessageList from "../../../../components/dashboard/chat/MessageList";
import { sendMessage } from "./actions";

const page = async ({ params }: { params: Promise<{ chatId: string }> }) => {
	const chatId = (await params)?.chatId;
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session) {
		redirect("/auth/signin");
	}
	const serverTrpc = await trpc();
	const chat = await serverTrpc.chat
		.getChatById({ chatId })
		.catch((error: unknown) => {
			if (error instanceof TRPCError && error.code === "NOT_FOUND") notFound();
			throw error;
		});
	if (!chat) {
		redirect("/dashboard");
	}
	const otherParticipant = chat.chatParticipants.find(
		(participant) => participant.user.id !== session.user.id,
	);
	const result =
		(await serverTrpc.message.getMessagesByChatId({ chatId })) ?? [];
	const sender = chat.chatParticipants.find(
		(participant) => participant.user.id === session.user.id,
	);
	if (!sender) {
		redirect("/dashboard");
	}
	const sendMessageForChat = sendMessage.bind(null, chatId, sender.id);

	return (
		<div className="flex min-w-0 flex-1 flex-col bg-white dark:bg-background-secondary">
			{/* header */}
			<div className="flex h-20 w-full shrink-0 items-center justify-between border-gray-200 border-b px-4 sm:px-8 dark:border-gray-700">
				<div className="flex min-w-0 items-center gap-3">
					<Link
						href="/dashboard/chat"
						aria-label="Back to chats"
						className="rounded-full p-2 md:hidden"
					>
						<ArrowLeft size={20} />
					</Link>
					<Image
						src={otherParticipant?.user.image || avatars.defaultAvatar}
						alt="User Avatar"
						width={36}
						height={36}
						className="rounded-full"
					/>
					<div className="min-w-0">
						<span className="block truncate font-semibold text-base sm:text-lg">
							{otherParticipant?.user.name ?? session.user.name}
						</span>
						<ChatPresence chatId={chatId} senderId={sender.id} />
					</div>
				</div>
				<div className="flex shrink-0 items-center gap-1 sm:gap-3">
					<ChatSearch
						key={`search:${chatId}`}
						chatId={chatId}
						currentParticipantId={sender.id}
						participantNames={Object.fromEntries(
							chat.chatParticipants.map((participant) => [
								participant.id,
								participant.user.name,
							]),
						)}
					/>
					<button
						type="button"
						title="Start call"
						className="cursor-pointer rounded-full p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
					>
						<Image src={icons.callLogo} alt="Call" width={24} height={24} />
					</button>
					<button
						type="button"
						title="Start video call"
						className="cursor-pointer rounded-full p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
					>
						<Image
							src={icons.videoCallLogo}
							alt="Video Call"
							width={24}
							height={24}
						/>
					</button>
					<button
						type="button"
						title="Chat settings"
						className="cursor-pointer rounded-full p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
					>
						<Settings size={22} aria-hidden="true" />
					</button>
				</div>
			</div>

			{/* messages */}
			<MessageList
				key={`messages:${chatId}`}
				initialMessages={result.messages}
				senderId={sender.id}
				chatId={chatId}
				initialHasMore={result.hasMore}
				cursor={result.nextCursor}
			/>

			{/* message composer */}
			<MessageComposer
				initialBlocked={chat.isBlocked}
				key={`composer:${chatId}`}
				action={sendMessageForChat}
				chatId={chatId}
				senderId={sender.id}
			/>
		</div>
	);
};
export default page;
