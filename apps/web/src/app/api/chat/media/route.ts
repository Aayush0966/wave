import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { createContext } from "@wave/api";
import { broadcast, chatChannel, notifyChatList } from "@wave/api/chat-events";
import { sweepMediaIfDue } from "@wave/api/media-cleanup";
import { type MessageFull, prisma } from "@wave/db";
import { MAX_MESSAGE_LENGTH } from "@wave/db/schemas/message.schemas";
import { z } from "zod";
import {
	MAX_MEDIA_BYTES,
	MEDIA_TYPES,
	matchesMediaSignature,
	validateMedia,
} from "@/lib/chat-media";
import { mediaDirectory } from "@/lib/chat-media-storage";

export async function POST(request: Request) {
	const ctx = await createContext(request);
	if (!ctx.session)
		return Response.json({ error: "Authentication required" }, { status: 401 });
	if (request.headers.get("origin") !== new URL(request.url).origin) {
		return Response.json({ error: "Invalid origin" }, { status: 403 });
	}
	// Bound the request before parsing multipart data, including clients without Content-Length.
	const reader = request.body?.getReader();
	if (!reader)
		return Response.json({ error: "Choose a file" }, { status: 400 });
	const chunks: Uint8Array[] = [];
	let size = 0;
	while (true) {
		const { done, value } = await reader.read();
		if (done) break;
		size += value.length;
		if (size > MAX_MEDIA_BYTES + 64 * 1024) {
			await reader.cancel();
			return Response.json(
				{ error: "Files must be 25 MB or smaller" },
				{ status: 413 },
			);
		}
		chunks.push(value);
	}
	let form: FormData;
	try {
		form = await new Response(Buffer.concat(chunks), {
			headers: { "Content-Type": request.headers.get("content-type") || "" },
		}).formData();
	} catch {
		return Response.json({ error: "Invalid upload" }, { status: 400 });
	}
	const file = form.get("file");
	const chatId = String(form.get("chatId") || "");
	const content = String(form.get("content") || "").trim();
	const key = z.string().uuid().safeParse(form.get("clientMessageId"));
	const replyToId = String(form.get("replyToId") || "") || undefined;
	if (!key.success)
		return Response.json(
			{ error: "A valid send identifier is required" },
			{ status: 400 },
		);
	if (!(file instanceof File))
		return Response.json({ error: "Choose a file" }, { status: 400 });
	const validation = validateMedia(file);
	if (validation || content.length > MAX_MESSAGE_LENGTH)
		return Response.json(
			{ error: validation || "Caption is too long" },
			{ status: 400 },
		);
	const participant = await ctx.repos.message.getParticipant(
		chatId,
		ctx.session.user.id,
	);
	if (!participant)
		return Response.json({ error: "Chat not found" }, { status: 404 });
	if (
		(await ctx.repos.chat.getBlockStatus(chatId, ctx.session.user.id)).isBlocked
	)
		return Response.json(
			{ error: "Messaging is blocked for this conversation" },
			{ status: 403 },
		);
	const existing = await ctx.repos.message.findByClientId(
		participant.id,
		key.data,
	);
	if (existing) {
		if (existing.chatId !== chatId)
			return Response.json(
				{ error: "Send identifier already used in another chat" },
				{ status: 409 },
			);
		return Response.json(existing);
	}
	if (
		replyToId &&
		!(await ctx.repos.message.validReply(replyToId, chatId, participant.id))
	)
		return Response.json(
			{ error: "Reply target is unavailable" },
			{ status: 400 },
		);
	const bytes = Buffer.from(await file.arrayBuffer());
	if (!matchesMediaSignature(bytes, file.type))
		return Response.json(
			{ error: "File contents do not match its media type" },
			{ status: 400 },
		);
	const filename = `${randomUUID()}.${MEDIA_TYPES[file.type as keyof typeof MEDIA_TYPES]}`;
	const directory = mediaDirectory();
	await mkdir(directory, { recursive: true });
	await writeFile(
		path.join(/* turbopackIgnore: true */ directory, filename),
		bytes,
		{
			flag: "wx",
			mode: 0o600,
		},
	);
	let message: MessageFull;
	try {
		message = await ctx.repos.message.createIdempotent({
			chatId,
			senderId: participant.id,
			content: content || null,
			messageType: file.type.startsWith("image/") ? "IMAGE" : "VIDEO",
			attachmentUrl: `/api/chat/media/${filename}`,
			clientMessageId: key.data,
			replyToId,
		});
		if (
			!message.MessageAttachment.some(
				(attachment) =>
					attachment.attachmentUrl === `/api/chat/media/${filename}`,
			)
		) {
			await unlink(
				path.join(/* turbopackIgnore: true */ directory, filename),
			).catch(() => {});
		}
	} catch (error) {
		await unlink(
			path.join(/* turbopackIgnore: true */ directory, filename),
		).catch(() => {});
		throw error;
	}
	await sweepMediaIfDue(prisma);
	await broadcast(chatChannel(chatId), "new-message", message);
	await notifyChatList(ctx, chatId);
	return Response.json(message, { status: 201 });
}
