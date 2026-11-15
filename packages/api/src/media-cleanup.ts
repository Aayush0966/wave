import { readdir, stat, unlink } from "node:fs/promises";
import path from "node:path";
import type { PrismaClient } from "@prisma/client";
import { mediaDirectory, validMediaFilename } from "./media-storage";

export async function cleanupOrphanedMedia(
	db: Pick<PrismaClient, "messageAttachment">,
	directory = mediaDirectory(),
	dryRun = false,
) {
	const filenames = await readdir(directory).catch(
		(error: NodeJS.ErrnoException) => {
			if (error.code === "ENOENT") return [];
			throw error;
		},
	);
	let removed = 0;
	let bytes = 0;
	for (const filename of filenames) {
		if (!validMediaFilename(filename)) continue;
		const location = path.join(/* turbopackIgnore: true */ directory, filename);
		const file = await stat(location).catch(() => null);
		// A grace period keeps in-progress writes safe before the message transaction commits.
		if (!file?.isFile() || Date.now() - file.mtimeMs < 86400000) continue;
		if (
			await db.messageAttachment.findFirst({
				where: { attachmentUrl: `/api/chat/media/${filename}` },
				select: { id: true },
			})
		)
			continue;
		if (!dryRun)
			await unlink(location).catch((error: NodeJS.ErrnoException) => {
				if (error.code !== "ENOENT") throw error;
			});
		removed++;
		bytes += file.size;
	}
	return { examined: filenames.length, removed, bytes, dryRun };
}
let nextSweep = 0;
export async function sweepMediaIfDue(
	db: Pick<PrismaClient, "messageAttachment">,
) {
	if (Date.now() < nextSweep) return;
	nextSweep = Date.now() + 3600000;
	await cleanupOrphanedMedia(db).catch((error: unknown) => {
		nextSweep = 0;
		console.error("Media orphan sweep failed", error);
	});
}
