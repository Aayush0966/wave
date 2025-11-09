import { SearchIcon } from "lucide-react";
import ChatList from "@/components/dashboard/ChatList";
import { Input } from "@/components/ui/input";
import type { Chat } from "@/types/chat";

export default function Home() {
	const chatData: Chat[] = [
		{
			title: "Office chat",
			id: "1",
			image: "https://example.com/office-chat-avatar.png",
			lastMessage: "I want to ask you to pick...",
			name: "Office chat",
			lastMessageSentBy: "Jenny",
			time: "4 m",
			unseenMessageCount: 5,
		},
		{
			title: "Harry Fettel",
			id: "2",
			image: "https://example.com/harry-fettel-avatar.png",
			lastMessage: "Our company needs to prepare",
			name: "Harry Fettel",
			lastMessageSentBy: "Harry",
			time: "15 m",
			unseenMessageCount: 0,
		},
		{
			title: "Frank Garcia",
			id: "3",
			image: "https://example.com/frank-garcia-avatar.png",
			lastMessage: "Our company needs to prepare",
			name: "Frank Garcia",
			lastMessageSentBy: "Frank",
			time: "9:31 am",
			unseenMessageCount: 0,
		},
		{
			title: "Maria Gonzalez",
			id: "4",
			image: "https://example.com/maria-gonzalez-avatar.png",
			lastMessage: "Our company needs to prepare",
			name: "Maria Gonzalez",
			lastMessageSentBy: "Maria",
			time: "9:31 am",
			unseenMessageCount: 0,
		},
		{
			title: "Jenny Li",
			id: "5",
			image: "https://example.com/jenny-li-avatar.png",
			lastMessage: "I want to ask you to pick...",
			name: "Jenny Li",
			lastMessageSentBy: "Jenny",
			time: "9:52 am",
			unseenMessageCount: 5,
		},
	];

	return (
		<div className="flex h-screen w-full py-4">
			<div className="w-full max-w-md border-gray-200 border-r dark:border-gray-700">
				<div className="p-4">
					<div className="relative">
						<SearchIcon className="-translate-y-1/2 absolute top-1/2 left-3 h-5 w-5 text-gray-400" />
						<Input
							placeholder="Search"
							maxLength={20}
							type="text"
							className="!text-lg h-12 w-full rounded-xl border-0 bg-gray-200 pl-10 text-gray-500 placeholder:text-gray-500 placeholder:text-lg dark:bg-background-tertiary dark:text-gray-200"
						/>
					</div>
				</div>

				<div className="overflow-y-auto">
					{chatData.map((chat) => (
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
