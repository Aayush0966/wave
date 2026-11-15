"use client";
import type { MessageStatus } from "@prisma/client";
import type { MessageFull } from "@wave/db";
import { useChatStore } from "@wave/state";
import { Check, CheckCheck, Clock3 } from "lucide-react";
import MessageActions from "./MessageActions";
import MessageReactions from "./MessageReactions";

type MessageProps = {
	message: MessageFull;
	currentUserId: string;
};

const Message = ({ message, currentUserId }: MessageProps) => {
	const replyHidden = useChatStore(
		(state) => !!state.hiddenMessageIds[message.replyToId ?? ""],
	);
	const isUnsent = message.deletedBy.some(
		(deleted) => deleted.deleteType === "EVERYONE",
	);
	const createdAt = new Date(message.createdAt);
	const isOwnMessage = message.senderId === currentUserId;
	type ExtendedStatus = MessageStatus | "SEEN";

	const STATUS_CONFIG: Record<
		ExtendedStatus,
		{
			label: string;
			icon: typeof Check;
			className: string;
		}
	> = {
		PENDING: { label: "Pending", icon: Clock3, className: "text-emerald-100" },
		SENT: { label: "Sent", icon: Check, className: "text-emerald-100" },
		DELIVERED: {
			label: "Delivered",
			icon: CheckCheck,
			className: "text-emerald-100",
		},
		SEEN: { label: "Seen", icon: CheckCheck, className: "text-blue-300" },
	};

	const currentStatusKey: ExtendedStatus =
		(message.seenBy?.length ?? 0) > 0 ? "SEEN" : message.messageStatus;

	const status = STATUS_CONFIG[currentStatusKey];
	const StatusIcon = status.icon;
	return (
		<div
			className={`flex w-full ${!isOwnMessage ? "justify-start" : "justify-end"}`}
		>
			<div
				className={`flex max-w-[min(80%,32rem)] flex-col ${isOwnMessage ? "items-end" : "items-start"}`}
			>
				<div
					className={`w-full rounded-2xl px-4 py-3 shadow-sm ${
						isOwnMessage
							? "rounded-br-md bg-emerald-600 text-white"
							: "rounded-bl-md bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white"
					}`}
				>
					{isUnsent ? (
						<p className="text-sm italic opacity-70">Message unsent</p>
					) : (
						<>
							{message.replyToId && (
								<blockquote className="mb-2 rounded-lg border-current border-l-2 bg-black/5 px-3 py-2 text-xs opacity-80">
									{(!replyHidden && message.replyTo?.content) ||
										(!replyHidden && message.replyTo
											? message.replyTo.messageType === "IMAGE"
												? "Photo"
												: "Video"
											: "Original message unavailable")}
								</blockquote>
							)}
							{message.MessageAttachment.map((attachment) =>
								message.messageType === "VIDEO" ? (
									<video
										key={attachment.id}
										src={attachment.attachmentUrl}
										controls
										preload="metadata"
										className="max-h-96 w-full rounded-lg"
									>
										<track kind="captions" />
									</video>
								) : (
									<a
										key={attachment.id}
										href={attachment.attachmentUrl}
										target="_blank"
										rel="noreferrer"
									>
										<img
											src={attachment.attachmentUrl}
											alt={message.content || "Shared image"}
											loading="lazy"
											className="max-h-96 max-w-full rounded-lg object-contain"
										/>
									</a>
								),
							)}
							{message.content && (
								<p className="wrap-break-word whitespace-pre-wrap text-sm leading-relaxed">
									{message.content}
								</p>
							)}
						</>
					)}
					<div
						className={`mt-1 flex items-center justify-end gap-1 text-[11px] ${isOwnMessage ? "text-emerald-100" : "text-gray-500 dark:text-gray-400"}`}
					>
						{message.editedAt && (
							<span
								title={`Edited ${new Date(message.editedAt).toLocaleString()}`}
							>
								edited ·{" "}
							</span>
						)}
						<time dateTime={createdAt.toISOString()}>
							{createdAt.toLocaleTimeString([], {
								hour: "numeric",
								minute: "2-digit",
							})}
						</time>
						{isOwnMessage && (
							<span title={status.label}>
								<StatusIcon
									className={status.className}
									size={14}
									strokeWidth={2.5}
									aria-hidden="true"
								/>
							</span>
						)}
					</div>
				</div>
				<div className="flex flex-wrap items-center gap-1">
					{!isUnsent && (
						<MessageReactions message={message} currentUserId={currentUserId} />
					)}
					<MessageActions message={message} own={isOwnMessage} />
				</div>
			</div>
		</div>
	);
};
export default Message;
