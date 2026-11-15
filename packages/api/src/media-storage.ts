import { unlink } from "node:fs/promises";
import path from "node:path";

export const mediaDirectory = () => {
	const configured = process.env.MEDIA_STORAGE_DIR;
	if (process.env.NODE_ENV === "production" && !configured)
		throw new Error(
			"MEDIA_STORAGE_DIR must point to a persistent volume in production",
		);
	if (configured && !path.isAbsolute(configured))
		throw new Error("MEDIA_STORAGE_DIR must be an absolute path");
	return configured || path.join(process.cwd(), ".chat-media");
};
export const validMediaFilename = (filename: string) =>
	/^[0-9a-f-]{36}\.(jpg|png|gif|webp|mp4|webm)$/.test(filename);
export async function removeMedia(attachmentUrls: string[]) {
	await Promise.all(
		attachmentUrls.map(async (url) => {
			const filename = url.startsWith("/api/chat/media/")
				? url.slice("/api/chat/media/".length)
				: "";
			if (!validMediaFilename(filename)) return;
			await unlink(
				path.join(/* turbopackIgnore: true */ mediaDirectory(), filename),
			).catch((error: NodeJS.ErrnoException) => {
				if (error.code !== "ENOENT")
					console.error("Media cleanup failed; orphan sweep will retry", error);
			});
		}),
	);
}
