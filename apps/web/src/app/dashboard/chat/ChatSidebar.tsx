import { auth } from "@wave/auth";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import ChatBox from "@/components/dashboard/chat/ChatBox";
import { trpc } from "@/lib/trpc-server";

const ChatSidebar = async () => {
	const session = await auth.api.getSession({ headers: await headers() });

	if (!session) {
		redirect("/auth/signin");
	}

	const serverTrpc = await trpc();
	const chats = await serverTrpc.chat.getUserChats();
	return (
		<div>
			<div className="overflow-y-auto">
				{chats?.map((chat) => (
					<Link
						href={`/dashboard/chat/${chat.id}`}
						key={chat.id}
						className="relative flex cursor-pointer items-center border-gray-100 border-b dark:border-gray-500"
					>
						<ChatBox chat={chat} name={session.user.name} />
					</Link>
				))}
			</div>
		</div>
	);
};

export default ChatSidebar;
