import { type FileHandle, open } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { createContext } from "@wave/api";
import { prisma } from "@wave/db";
import { MEDIA_TYPES } from "@/lib/chat-media";
import { mediaDirectory, validMediaFilename } from "@/lib/chat-media-storage";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ filename: string }> },
) {
	const ctx = await createContext(request);
	if (!ctx.session) return new Response(null, { status: 401 });
	const { filename } = await params;
	if (!validMediaFilename(filename)) return new Response(null, { status: 404 });
	const attachment = await prisma.messageAttachment.findFirst({
		where: {
			attachmentUrl: `/api/chat/media/${filename}`,
			message: {
				chat: { chatParticipants: { some: { userId: ctx.session.user.id } } },
				deletedBy: {
					none: {
						OR: [
							{ deleteType: "EVERYONE" },
							{
								deleteType: "SELF",
								chatParticipant: { userId: ctx.session.user.id },
							},
						],
					},
				},
			},
		},
	});
	if (!attachment) return new Response(null, { status: 404 });
	let file: FileHandle;
	try {
		file = await open(
			path.join(/* turbopackIgnore: true */ mediaDirectory(), filename),
			"r",
		);
	} catch {
		return new Response(null, { status: 404 });
	}
	const { size } = await file.stat();
	const headers = new Headers({
		"Content-Type":
			Object.entries(MEDIA_TYPES).find(([, extension]) =>
				filename.endsWith(`.${extension}`),
			)?.[0] || "application/octet-stream",
		"Accept-Ranges": "bytes",
		"Cache-Control": "private, no-store",
		"X-Content-Type-Options": "nosniff",
	});
	let start = 0;
	let end = size - 1;
	const range = request.headers.get("range");
	if (range) {
		const match = /^bytes=(\d*)-(\d*)$/.exec(range);
		if (!match || (!match[1] && !match[2])) {
			await file.close();
			return new Response(null, {
				status: 416,
				headers: { "Content-Range": `bytes */${size}` },
			});
		}
		start = match[1] ? Number(match[1]) : Math.max(0, size - Number(match[2]));
		end =
			match[1] && match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
		if (
			start > end ||
			start >= size ||
			!Number.isSafeInteger(start) ||
			!Number.isSafeInteger(end)
		) {
			await file.close();
			return new Response(null, {
				status: 416,
				headers: { "Content-Range": `bytes */${size}` },
			});
		}
		headers.set("Content-Range", `bytes ${start}-${end}/${size}`);
	}
	headers.set("Content-Length", String(end - start + 1));
	return new Response(
		Readable.toWeb(
			file.createReadStream({ start, end, autoClose: true }),
		) as ReadableStream<Uint8Array>,
		{ status: range ? 206 : 200, headers },
	);
}
