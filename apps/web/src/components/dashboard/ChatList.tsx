import Image from "next/image";
import type { Chat } from "@/types/chat";

const ChatList = ({ chat }: { chat: Chat }) => {
	return (
		<div className="m-2 flex h-24 w-[450px] cursor-pointer items-center rounded-xl p-4 transition-colors duration-200 hover:bg-gray-200 dark:border-gray-700 dark:hover:bg-background-tertiary">
			<div className="relative h-16 w-16 flex-shrink-0">
				<Image
					alt="profile image"
					src={chat.image || "/default-avatar.png"}
					width={64}
					height={64}
					className="rounded-full object-cover ring-2 ring-gray-200 dark:ring-gray-600"
				/>
				<div className="-bottom-1 -right-1 absolute h-4 w-4 rounded-full border-2 border-white bg-green-500 dark:border-gray-800" />
			</div>

			<div className="ml-4 flex min-w-0 flex-1 flex-col">
				<div className="mb-1 flex items-center justify-between">
					<h3 className="truncate font-semibold text-gray-900 text-lg dark:text-text-primary">
						{chat.title ?? chat.name}
					</h3>
					<span className="ml-2 flex-shrink-0 text-gray-500 text-sm dark:text-text-secondary">
						{chat.time}
					</span>
				</div>
				<div className="flex items-center justify-between">
					<p className="flex-1 truncate text-gray-600 text-sm dark:text-text-secondary">
						{chat.lastMessage}
					</p>
					{chat.unseenMessageCount > 0 && (
						<div className="ml-2 flex h-6 w-6 min-w-[24px] items-center justify-center rounded-full bg-blue-500 font-bold text-white text-xs">
							{chat.unseenMessageCount > 99 ? "99+" : chat.unseenMessageCount}
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default ChatList;
