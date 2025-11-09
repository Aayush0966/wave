import ChatList from "@/components/dashboard/ChatList";
import { appRouter } from "@wave/api";
import { auth } from "@wave/auth";
import { headers } from "next/headers";
import SearchUser from "@/components/dashboard/SearchUser";

export default async function Home() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) {
		return <div>Please sign in to view your chats</div>;
	}

	const caller = appRouter.createCaller({ session });
	const chats = await caller.chat.getUserChats();


	return (
		<div className="flex h-screen w-full py-4">
			<div className="w-full max-w-md border-gray-200 border-r dark:border-gray-700">

				<SearchUser />
				<div className="overflow-y-auto">
					{chats?.map((chat) => (
						<div
							key={chat.id}
							className="relative flex cursor-pointer items-center border-gray-100 border-b dark:border-gray-800"
						>
							<ChatList chat={chat} />
						</div>
					))}
				</div>
			</div>

			<div className="flex flex-1 items-center justify-center">
				<div className="text-center text-gray-500 dark:text-gray-400">
					<p className="text-lg">Select a chat to start messaging</p>
				</div>
			</div>
		</div>
	);
}
