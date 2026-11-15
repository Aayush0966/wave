import { auth } from "@wave/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { trpc } from "@/lib/trpc-server";
import ChatSidebarList from "./ChatSidebarList";

const ChatSidebar = async () => {
	const session = await auth.api.getSession({ headers: await headers() });

	if (!session) {
		redirect("/auth/signin");
	}

	const serverTrpc = await trpc();
	const chats = await serverTrpc.chat.getUserChats();
	return (
		<ChatSidebarList
			userId={session.user.id}
			initialChats={chats}
			name={session.user.name}
		/>
	);
};

export default ChatSidebar;
