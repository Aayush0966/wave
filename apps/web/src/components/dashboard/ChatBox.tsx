import Image from "next/image";
import type { Chat } from "@/types/chat";
import {avatars} from "@wave/ui";

const ChatBox = ({ chat, name }: { chat: Chat , name: string}) => {

	const formattedTime = (time: string) => {
		const now = new Date()
		const date = new Date(time)
		const diff = now.getTime() - date.getTime()
		const diffMins = Math.floor(diff / (1000* 60))
		const diffHours = Math.floor(diff / (1000 * 60 * 60))

		if (diffHours >= 1) {
			return `${diffHours} ago`
		}
		else {
			return `${diffMins} ago`
		}
	}

	return (
		<div className="group mx-2 my-1 flex h-20 w-112.5 cursor-pointer items-center rounded-2xl border border-gray-200 p-4  transition-all duration-300 ease-out hover:border-gray-200 hover:bg-gray-200  dark:border-gray-800 dark:hover:border-gray-700 dark:hover:bg-background-tertiary dark:shadow-gray-900/20">
			<div className="relative h-14 w-14 shrink-0">
				<Image
					alt="profile image"
					src={chat.image || avatars.defaultAvatar}
					width={56}
					height={56}
					className="rounded-full object-cover ring-2 ring-gray-200 transition-all duration-200 group-hover:ring-gray-300  dark:ring-gray-700 dark:group-hover:ring-gray-600"
				/>
				<div className="-bottom-0.5 -right-0.5 absolute h-4 w-4 rounded-full border-2 border-white bg-emerald-500 shadow-sm transition-all duration-200  dark:border-gray-800" />
			</div>

			<div className="ml-4 flex min-w-0 flex-1 flex-col justify-center space-y-1">
				<div className="flex items-center justify-between">
					<h3 className="truncate font-semibold font-sans text-lg text-gray-900 pb-3 leading-tight tracking-wide group-hover:text-gray-800 dark:text-text-primary dark:group-hover:text-white">
						{chat.title ? chat.title : chat.name ? chat.name : name ? name : "Unknown"}
					</h3>
					<span className="ml-3 shrink-0 font-medium text-gray-500 text-xs tracking-wide group-hover:text-gray-600 dark:text-text-secondary dark:group-hover:text-gray-300">
						{chat.time ? formattedTime(chat.time) : ""}
					</span>
				</div>
				<div className="flex items-center justify-between">
					<p className="flex-1 truncate font-normal text-gray-600 text-sm leading-relaxed group-hover:text-gray-700 dark:text-text-secondary dark:group-hover:text-gray-300">
						{chat.lastMessage}
					</p>
					{chat.unseenMessageCount > 0 && (
						<div className="ml-3 flex h-5 w-5 min-w-5 items-center justify-center rounded-full bg-linear-to-r from-blue-500 to-blue-600 font-semibold text-white text-xs shadow-lg transition-all duration-200 ">
							{chat.unseenMessageCount > 99 ? "99+" : chat.unseenMessageCount}
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default ChatBox;
