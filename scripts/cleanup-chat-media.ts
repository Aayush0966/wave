import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const root = fileURLToPath(new URL("../", import.meta.url));
dotenv.config({ path: path.join(root, ".env") });
dotenv.config({ path: path.join(root, ".env.local"), override: true });
process.env.MEDIA_STORAGE_DIR ||= path.join(root, "apps/web/.chat-media");
const { prisma } = await import("../packages/db/src/index");
const { cleanupOrphanedMedia } = await import(
	"../packages/api/src/media-cleanup"
);
try {
	console.log(
		await cleanupOrphanedMedia(
			prisma,
			process.env.MEDIA_STORAGE_DIR,
			process.argv.includes("--dry-run"),
		),
	);
} finally {
	await prisma.$disconnect();
}
