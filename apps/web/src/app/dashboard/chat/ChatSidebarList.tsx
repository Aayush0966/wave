"use client";
import type { MessageFull } from "@wave/db";
import { type Chat, retainChatChannel, useChatStore } from "@wave/state";
import { MessageCircle, Search, X } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import ChatBox from "@/components/dashboard/chat/ChatBox";
import ChatItemMenu from "@/components/dashboard/chat/ChatItemMenu";
import ChatNotifications, {
	notificationsEnabled,
} from "@/components/dashboard/chat/ChatNotifications";
import { useChatPreferences } from "@/hooks/useChatPreferences";
import { pusherClient } from "@/lib/pusher-client";
import { trpc } from "@/lib/trpc-client";

export default function ChatSidebarList({
	initialChats,
	name,
	userId,
}: {
	initialChats: Chat[];
	name: string;
	userId: string;
}) {
	const { preferences, update: updatePreference } = useChatPreferences(userId);
	const preferencesRef = useRef(preferences);
	preferencesRef.current = preferences;
	const [search, setSearch] = useState("");
	const [unreadOnly, setUnreadOnly] = useState(false);
	const chats = useChatStore((state) => state.chats);
	const { chatId } = useParams<{ chatId?: string }>();
	const router = useRouter();
	const active = useRef(chatId);
	active.current = chatId;
	const received = useRef(new Set<string>());
	const utils = trpc.useUtils();
	const query = trpc.chat.getUserChats.useQuery(undefined, {
		initialData: initialChats,
		refetchOnWindowFocus: true,
		refetchInterval: 15000,
		staleTime: 0,
	});
	useEffect(() => {
		for (const chat of query.data ?? initialChats) {
			if (chat.lastMessageId) received.current.add(chat.lastMessageId);
		}
		useChatStore.getState().setChats(query.data ?? initialChats);
	}, [query.data, initialChats]);
	useEffect(() => {
		const channelName = `private-user-${userId}`;
		const channel = pusherClient.subscribe(channelName);
		const refresh = () => {
			void utils.chat.getUserChats.invalidate();
		};
		const hidden = ({
			chatId,
			messageId,
		}: {
			chatId: string;
			messageId: string;
		}) => {
			useChatStore.getState().hideMessage(chatId, messageId);
			refresh();
		};
		channel.bind("chat-list-updated", refresh);
		channel.bind("pusher:subscription_succeeded", refresh);
		channel.bind("message-hidden", hidden);
		return () => {
			channel.unbind("chat-list-updated", refresh);
			channel.unbind("pusher:subscription_succeeded", refresh);
			channel.unbind("message-hidden", hidden);
			pusherClient.unsubscribe(channelName);
		};
	}, [userId, utils]);
	const chatIds = (query.data ?? initialChats).map((chat) => chat.id).join(",");
	useEffect(() => {
		const cleanups = chatIds
			.split(",")
			.filter(Boolean)
			.map((id) => {
				const { channel, release } = retainChatChannel(pusherClient, id);
				const onNew = (message: MessageFull) => {
					if (received.current.has(message.id)) return;
					received.current.add(message.id);
					if (received.current.size > 5000)
						received.current.delete(
							received.current.values().next().value ?? "",
						);
					const chat = useChatStore
						.getState()
						.chats.find((chat) => chat.id === id);
					if (!chat) return;
					const reading =
						active.current === id &&
						document.hasFocus() &&
						document.visibilityState === "visible";
					const own = message.senderId === chat.participantId;
					const seen = message.seenBy.some(
						(record) => record.chatParticipantId === chat.participantId,
					);
					useChatStore
						.getState()
						.incrementUnreadCount(id, own || reading || seen ? 0 : 1, message);
					if (
						!own &&
						!reading &&
						!seen &&
						!preferencesRef.current[id]?.muted &&
						!chat.isBlocked
					) {
						const title = chat.name || chat.title || "New message";
						const description =
							message.content ||
							(message.messageType === "IMAGE"
								? "Shared a photo"
								: "Shared a video");
						toast(title, {
							description,
							action: {
								label: "Open",
								onClick: () => router.push(`/dashboard/chat/${id}`),
							},
						});
						if (
							!document.hasFocus() &&
							"Notification" in window &&
							Notification.permission === "granted" &&
							notificationsEnabled()
						) {
							const notification = new Notification(title, {
								body: description,
								tag: message.id,
							});
							notification.onclick = () => {
								window.focus();
								router.push(`/dashboard/chat/${id}`);
								notification.close();
							};
						}
					}
				};
				const unsent = (message: MessageFull) => {
					useChatStore.getState().applyUnsentMessage(message);
					void utils.chat.getUserChats.invalidate();
				};
				const edited = (message: MessageFull) =>
					useChatStore.getState().updateMessage(message);
				channel.bind("new-message", onNew);
				channel.bind("message-unsent", unsent);
				channel.bind("message-edited", edited);
				return () => {
					release();
					channel.unbind("new-message", onNew);
					channel.unbind("message-unsent", unsent);
					channel.unbind("message-edited", edited);
				};
			});
		return () => {
			for (const cleanup of cleanups) cleanup();
		};
	}, [chatIds, router, utils]);
	const allChats = chats.length ? chats : (query.data ?? initialChats);
	const unreadChats = allChats.filter(
		(chat) => chat.unseenMessageCount > 0,
	).length;
	const term = search.trim().toLocaleLowerCase();
	const visibleChats = allChats
		.toSorted(
			(a, b) =>
				Number(!!preferences[b.id]?.pinned) -
				Number(!!preferences[a.id]?.pinned),
		)
		.filter(
			(chat) =>
				(!unreadOnly || chat.unseenMessageCount > 0) &&
				(!term ||
					[chat.title, chat.name || name, chat.lastMessage].some((value) =>
						value.toLocaleLowerCase().includes(term),
					)),
		);
	return (
		<>
			<div className="shrink-0 space-y-3 border-gray-100 border-b px-4 pb-4 dark:border-gray-800">
				<div className="relative">
					<Search
						size={16}
						aria-hidden="true"
						className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400"
					/>
					<input
						type="search"
						aria-label="Search conversations"
						placeholder="Search conversations"
						value={search}
						onChange={(event) => setSearch(event.target.value)}
						className="h-10 w-full rounded-xl border border-gray-200 bg-transparent pr-9 pl-9 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-700"
					/>
					{search && (
						<button
							type="button"
							aria-label="Clear conversation search"
							onClick={() => setSearch("")}
							className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
						>
							<X size={14} />
						</button>
					)}
				</div>
				<div className="flex items-center gap-2">
					{[false, true].map((unread) => (
						<button
							key={String(unread)}
							type="button"
							aria-pressed={unreadOnly === unread}
							onClick={() => setUnreadOnly(unread)}
							className={`rounded-full px-3 py-1.5 font-medium text-xs transition-colors ${unreadOnly === unread ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400"}`}
						>
							{unread ? `Unread (${unreadChats})` : `All (${allChats.length})`}
						</button>
					))}
				</div>
			</div>
			{query.isError && (
				<div
					role="status"
					className="flex items-center justify-between gap-2 px-4 py-2 text-amber-700 text-xs dark:text-amber-400"
				>
					Could not refresh chats.
					<button
						type="button"
						disabled={query.isFetching}
						onClick={() => void query.refetch()}
						className="rounded px-2 py-1 underline disabled:opacity-50"
					>
						Retry
					</button>
				</div>
			)}
			<nav
				aria-label="Conversations"
				className="min-h-0 flex-1 space-y-1 overflow-y-auto p-3"
			>
				{visibleChats.map((chat) => (
					<div key={chat.id} className="group relative">
						<Link
							href={`/dashboard/chat/${chat.id}`}
							aria-current={chatId === chat.id ? "page" : undefined}
							className="block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
						>
							<ChatBox
								chat={chat}
								name={name}
								active={chatId === chat.id}
								pinned={preferences[chat.id]?.pinned}
								muted={preferences[chat.id]?.muted}
							/>
						</Link>
						<ChatItemMenu
							chat={chat}
							label={chat.title || chat.name || name}
							preference={preferences[chat.id]}
							onUpdate={(change) => updatePreference(chat.id, change)}
						/>
					</div>
				))}
				{!visibleChats.length && (
					<div
						role="status"
						className="flex flex-col items-center px-4 py-12 text-center"
					>
						<MessageCircle
							size={28}
							aria-hidden="true"
							className="mb-3 text-emerald-500"
						/>
						<p className="font-medium text-gray-900 text-sm dark:text-gray-100">
							{term
								? "No conversations found"
								: unreadOnly
									? "You're all caught up"
									: "Your conversations start here"}
						</p>
						<p className="mt-1 text-gray-500 text-xs leading-relaxed">
							{term
								? "Try another name or message."
								: unreadOnly
									? "New unread messages will appear here."
									: "Use New message to start a conversation."}
						</p>
					</div>
				)}
			</nav>
			<div className="shrink-0 border-gray-100 border-t dark:border-gray-800">
				<ChatNotifications />
			</div>
		</>
	);
}
