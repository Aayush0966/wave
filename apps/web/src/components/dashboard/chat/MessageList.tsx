"use client";

import { useEffect, useRef } from "react";
import GhostAnimation from "../GhostAnimation";
import Message from "./Message";
import type { MessageFull } from "@wave/db";
import { useChatMessages } from "@wave/state";
import { useChatRoom } from "../../../hooks/useChatRoom";

type MessageListType = {
	initialMessages: MessageFull[];
	senderId: string;
	chatId: string;
};


const MessageList = ({
	initialMessages,
	senderId,
	chatId,
}: MessageListType) => {
	const bottomRef = useRef<HTMLDivElement>(null);
	 const messages = useChatMessages(chatId,initialMessages);
	useChatRoom(chatId,senderId, messages);
	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages.length]);

	return (
		<div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-6 sm:px-8">
			{messages.length ? (
				messages.map((message) => (
					<Message
						key={message.id}
						message={message}
						currentUserId={senderId}
					/>
				))
			) : (
				<div className="m-auto max-w-sm text-center text-gray-500 text-sm dark:text-gray-400">
					No messages yet. Start the conversation below.
					<GhostAnimation />
				</div>
			)}
			<div ref={bottomRef} aria-hidden="true" />
		</div>
	);
};

export default MessageList;
