"use client";
import type { Chat } from "@wave/state";
import { avatars } from "@wave/ui";
import { Ban, BellOff, Pin } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { formatChatTime } from "@/lib/format-chat-time";

const ChatBox = ({
	chat,
	name,
	active = false,
	pinned = false,
	muted = false,
}: {
	chat: Chat;
	name: string;
	active?: boolean;
	pinned?: boolean;
	muted?: boolean;
}) => {
	const [now, setNow] = useState<number | null>(null);
	useEffect(() => {
		setNow(Date.now());
		const timer = setInterval(() => setNow(Date.now()), 30_000);
		return () => clearInterval(timer);
	}, []);

	return (
		<div
			className={`group flex min-h-20 min-w-0 items-center rounded-xl py-4 pr-9 pl-3 transition-colors ${active ? "bg-emerald-50 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:ring-emerald-800" : "hover:bg-gray-100 dark:hover:bg-white/5"}`}
		>
			<div className="relative h-14 w-14 shrink-0">
				<Image
					alt="profile image"
					src={chat.image || avatars.defaultAvatar}
					width={56}
					height={56}
					className="rounded-full object-cover ring-2 ring-gray-200 transition-all duration-200 group-hover:ring-gray-300 dark:ring-gray-700 dark:group-hover:ring-gray-600"
				/>
			</div>

			<div className="ml-4 flex min-w-0 flex-1 flex-col justify-center space-y-1">
				<div className="flex items-center justify-between">
					<div className="flex min-w-0 items-center gap-1.5">
						<h3 className="truncate font-semibold text-gray-900 text-sm dark:text-text-primary">
							{chat.title
								? chat.title
								: chat.name
									? chat.name
									: name
										? name
										: "Unknown"}
						</h3>
						{pinned && (
							<span title="Pinned" className="shrink-0 text-gray-400">
								<Pin size={11} />
								<span className="sr-only">Pinned</span>
							</span>
						)}
						{chat.blockedByMe && (
							<span title="Blocked" className="shrink-0 text-gray-400">
								<Ban size={11} />
								<span className="sr-only">Blocked</span>
							</span>
						)}
						{muted && (
							<span
								title="Notifications muted"
								className="shrink-0 text-gray-400"
							>
								<BellOff size={11} />
								<span className="sr-only">Notifications muted</span>
							</span>
						)}
					</div>
					<span className="ml-2 shrink-0 text-[10px] text-gray-500 dark:text-text-secondary">
						{chat.time && now !== null ? formatChatTime(chat.time, now) : ""}
					</span>
				</div>
				<div className="flex items-center justify-between">
					<p
						className={`flex-1 truncate text-sm leading-relaxed ${chat.unseenMessageCount > 0 ? "font-medium text-gray-900 dark:text-gray-100" : "text-gray-500 dark:text-text-secondary"}`}
					>
						{chat.lastMessage && chat.lastMessageSentBy === chat.participantId
							? "You: "
							: ""}
						{chat.lastMessage || "Start a conversation"}
					</p>
					{chat.unseenMessageCount > 0 && (
						<div className="ml-3 flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-600 px-1 font-semibold text-white text-xs">
							{chat.unseenMessageCount > 99 ? "99+" : chat.unseenMessageCount}
							<span className="sr-only"> unread messages</span>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default ChatBox;
