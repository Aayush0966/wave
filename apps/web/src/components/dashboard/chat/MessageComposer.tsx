"use client";
import type { MessageFull } from "@wave/db";
import { MAX_MESSAGE_LENGTH } from "@wave/db/schemas/message.schemas";
import { useChatStore } from "@wave/state";
import { ImageIcon, Send, Video, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { MEDIA_ACCEPT, validateMedia } from "@/lib/chat-media";
import { deserializeMessage } from "@/lib/deserialize-message";
import { trpc } from "@/lib/trpc-client";

type MessageComposerProps = {
	action: (formData: FormData) => Promise<MessageFull | null | undefined>;
	chatId: string;
	senderId: string;
	initialBlocked?: boolean;
};

const MessageComposer = ({
	action,
	chatId,
	senderId,
	initialBlocked = false,
}: MessageComposerProps) => {
	const blocked = useChatStore(
		(state) =>
			state.chats.find((chat) => chat.id === chatId)?.isBlocked ??
			initialBlocked,
	);
	const blockedByMe = useChatStore(
		(state) => state.chats.find((chat) => chat.id === chatId)?.blockedByMe,
	);
	const reply = useChatStore((state) => state.replyDrafts[chatId]);
	const edit = useChatStore((state) => state.editDrafts[chatId]);
	const editMutation = trpc.message.edit.useMutation();
	const typingMutation = trpc.message.typing.useMutation();
	const typingSend = useRef(typingMutation.mutate);
	typingSend.current = typingMutation.mutate;
	const lastTyping = useRef(0);
	const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const sendKey = useRef<string | null>(null);
	const normalDraft = useRef("");
	const stopTyping = () => {
		if (typingTimer.current) clearTimeout(typingTimer.current);
		if (lastTyping.current) typingSend.current({ chatId, typing: false });
		lastTyping.current = 0;
	};
	useEffect(
		() => () => {
			if (typingTimer.current) clearTimeout(typingTimer.current);
			if (lastTyping.current) typingSend.current({ chatId, typing: false });
		},
		[chatId],
	);
	const fileRef = useRef<HTMLInputElement>(null);
	const [file, setFile] = useState<File | null>(null);
	const [preview, setPreview] = useState<string | null>(null);
	const [content, setContent] = useState("");
	const [sending, setSending] = useState(false);
	const sendingRef = useRef(false);
	const [error, setError] = useState<string | null>(null);
	const contentRef = useRef(content);
	contentRef.current = content;
	const previousEdit = useRef<string | null>(null);
	const previousReply = useRef(reply?.id);
	const replyId = reply?.id;
	useEffect(() => {
		if (edit) {
			if (!previousEdit.current) normalDraft.current = contentRef.current;
			setContent(edit.content || "");
			setFile(null);
		} else if (previousEdit.current) {
			setContent(normalDraft.current);
			normalDraft.current = "";
		}
		previousEdit.current = edit?.id ?? null;
		sendKey.current = null;
	}, [edit]);
	useEffect(() => {
		if (replyId !== previousReply.current) {
			sendKey.current = null;
			previousReply.current = replyId;
		}
	}, [replyId]);

	useEffect(() => {
		if (!file) {
			setPreview(null);
			return;
		}
		const url = URL.createObjectURL(file);
		setPreview(url);
		return () => URL.revokeObjectURL(url);
	}, [file]);

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (blocked || sendingRef.current || (!content.trim() && !file)) return;
		sendingRef.current = true;
		const submittedContent = content;
		setSending(true);
		setError(null);
		const clientMessageId = sendKey.current ?? crypto.randomUUID();
		sendKey.current = clientMessageId;
		const temporaryMessageId = `temp-${clientMessageId}`;
		const formData = new FormData();
		formData.set("content", content.trim());
		formData.set("clientMessageId", clientMessageId);
		if (reply) formData.set("replyToId", reply.id);
		if (!edit) setContent("");
		try {
			if (edit) {
				const saved = await editMutation.mutateAsync({
					messageId: edit.id,
					content: content.trim(),
				});
				useChatStore.getState().updateMessage(deserializeMessage(saved));
				useChatStore.getState().setEditDraft(chatId, null);
			} else if (file) {
				formData.set("file", file);
				formData.set("chatId", chatId);
				const response = await fetch("/api/chat/media", {
					method: "POST",
					body: formData,
				});
				if (!response.ok) {
					const body = await response.json().catch(() => null);
					throw new Error(body?.error || "Upload failed. Please try again.");
				}
				const message = deserializeMessage(await response.json());
				useChatStore.getState().addMessage(message);
				useChatStore.getState().incrementUnreadCount(chatId, 0, message);
			} else {
				const now = new Date();
				useChatStore.getState().sendMessage({
					content: content.trim(),
					chatId,
					senderId,
					messageType: "TEXT",
					id: temporaryMessageId,
					messageStatus: "PENDING",
					createdAt: now,
					updatedAt: now,
					seenBy: [],
					reacts: [],
					deletedBy: [],
					MessageAttachment: [],
					clientMessageId,
					editedAt: null,
					replyToId: reply?.id ?? null,
					replyTo: reply
						? {
								id: reply.id,
								content: reply.content,
								messageType: reply.messageType,
								senderId: reply.senderId,
								deletedBy: reply.deletedBy,
							}
						: null,
				});
				const message = await action(formData);
				if (!message)
					throw new Error("Message could not be sent. Please try again.");
				useChatStore.getState().replaceMessage(message, temporaryMessageId);
				useChatStore.getState().incrementUnreadCount(chatId, 0, message);
			}
			sendKey.current = null;
			stopTyping();
			if (!edit) useChatStore.getState().setReplyDraft(chatId, null);
			setFile(null);
			if (fileRef.current) fileRef.current.value = "";
		} catch (error) {
			if (!edit) setContent(submittedContent);
			useChatStore.getState().removePendingMessage(temporaryMessageId);
			setError(
				error instanceof Error
					? error.message
					: "Could not send. Please try again.",
			);
		} finally {
			sendingRef.current = false;
			setSending(false);
		}
	};

	return (
		<div className="w-full shrink-0 px-3 py-3 sm:px-6">
			{blocked && (
				<p
					role="status"
					className="mb-2 text-gray-500 text-xs dark:text-text-secondary"
				>
					{blockedByMe
						? "You blocked this person. Unblock them from conversation options to send messages."
						: "Messaging is unavailable for this conversation."}
				</p>
			)}
			{(reply || edit) && (
				<div className="mb-2 flex items-center justify-between gap-3 rounded-xl border-emerald-500 border-l-2 bg-gray-100 p-3 text-sm dark:bg-gray-800">
					<div className="min-w-0">
						<p className="font-medium">
							{edit ? "Editing message" : "Replying to message"}
						</p>
						<p className="truncate text-gray-500">
							{(edit || reply)?.content || "Attachment"}
						</p>
					</div>
					<button
						type="button"
						disabled={sending || blocked}
						aria-label="Cancel reply or edit"
						onClick={() => {
							if (edit) {
								useChatStore.getState().setEditDraft(chatId, null);
							} else useChatStore.getState().setReplyDraft(chatId, null);
						}}
					>
						<X size={18} />
					</button>
				</div>
			)}
			{file && preview && (
				<div className="mb-2 flex items-center gap-3 rounded-xl bg-gray-100 p-3 dark:bg-gray-800">
					{file.type.startsWith("image/") ? (
						<img
							src={preview}
							alt="Selected attachment"
							className="h-24 max-w-48 rounded-lg object-contain"
						/>
					) : (
						<video src={preview} controls className="h-32 max-w-64 rounded-lg">
							<track kind="captions" />
						</video>
					)}
					<span className="min-w-0 flex-1 truncate text-sm">{file.name}</span>
					<button
						type="button"
						disabled={sending || blocked}
						aria-label="Remove attachment"
						onClick={() => {
							setFile(null);
							if (fileRef.current) fileRef.current.value = "";
						}}
						className="rounded-full p-2 hover:bg-gray-200 dark:hover:bg-gray-700"
					>
						<X size={18} />
					</button>
				</div>
			)}
			{error && (
				<p role="alert" className="mb-2 text-red-600 text-sm">
					{error} Your draft is kept; send again to retry.
				</p>
			)}
			<form
				onSubmit={handleSubmit}
				className="flex w-full items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2 shadow-sm dark:border-gray-700 dark:bg-gray-900"
			>
				<input
					ref={fileRef}
					type="file"
					accept={MEDIA_ACCEPT}
					className="hidden"
					disabled={sending || blocked}
					onChange={(event) => {
						const selected = event.target.files?.[0];
						if (!selected) return;
						const validation = validateMedia(selected);
						if (validation) {
							toast.error(validation);
							event.target.value = "";
							return;
						}
						sendKey.current = null;
						setFile(selected);
						setError(null);
					}}
				/>
				<button
					type="button"
					disabled={sending || blocked || !!edit}
					aria-label="Share image or video"
					title="Share image or video (up to 25 MB)"
					onClick={() => {
						if (fileRef.current) {
							fileRef.current.accept = MEDIA_ACCEPT;
							fileRef.current.click();
						}
					}}
					className="rounded-full p-2 text-gray-500 hover:bg-gray-200 disabled:opacity-50 dark:hover:bg-gray-800"
				>
					<ImageIcon size={20} />
				</button>
				<button
					type="button"
					disabled={sending || blocked || !!edit}
					aria-label="Share video"
					onClick={() => {
						if (fileRef.current) {
							fileRef.current.accept = "video/mp4,video/webm";
							fileRef.current.click();
						}
					}}
					className="rounded-full p-2 text-gray-500 hover:bg-gray-200 disabled:opacity-50 dark:hover:bg-gray-800"
				>
					<Video size={20} />
				</button>
				<input
					name="content"
					type="text"
					value={content}
					onChange={(event) => {
						setContent(event.target.value);
						sendKey.current = null;
						if (event.target.value.trim()) {
							if (Date.now() - lastTyping.current > 2000) {
								typingSend.current({ chatId, typing: true });
								lastTyping.current = Date.now();
							}
							if (typingTimer.current) clearTimeout(typingTimer.current);
							typingTimer.current = setTimeout(stopTyping, 3000);
						} else stopTyping();
					}}
					onBlur={stopTyping}
					disabled={sending || blocked}
					maxLength={MAX_MESSAGE_LENGTH}
					autoComplete="off"
					className="h-10 min-w-0 flex-1 bg-transparent px-2 text-sm outline-none dark:text-white"
					placeholder={
						edit
							? "Edit message…"
							: file
								? "Add a caption..."
								: "Type a message..."
					}
				/>
				<button
					type="submit"
					disabled={blocked || sending || (!content.trim() && !file)}
					aria-label={sending ? "Sending message" : "Send message"}
					className="rounded-full bg-emerald-600 p-2 text-white hover:bg-emerald-700 disabled:opacity-50"
				>
					{sending ? (
						<span className="text-xs">Sending…</span>
					) : (
						<Send size={18} />
					)}
				</button>
			</form>
		</div>
	);
};
export default MessageComposer;
