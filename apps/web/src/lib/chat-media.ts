export const MAX_MEDIA_BYTES = 25 * 1024 * 1024;
export const MEDIA_ACCEPT =
	"image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm";

export const MEDIA_TYPES = {
	"image/jpeg": "jpg",
	"image/png": "png",
	"image/gif": "gif",
	"image/webp": "webp",
	"video/mp4": "mp4",
	"video/webm": "webm",
} as const;

export function validateMedia(file: { type: string; size: number }) {
	if (!(file.type in MEDIA_TYPES))
		return "Choose a JPEG, PNG, GIF, WebP, MP4, or WebM file.";
	if (file.size === 0) return "The selected file is empty.";
	if (file.size > MAX_MEDIA_BYTES) return "Files must be 25 MB or smaller.";
	return null;
}

export function matchesMediaSignature(bytes: Uint8Array, mime: string) {
	const ascii = (start: number, end: number) =>
		String.fromCharCode(...bytes.slice(start, end));
	switch (mime) {
		case "image/jpeg":
			return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
		case "image/png":
			return [137, 80, 78, 71, 13, 10, 26, 10].every(
				(value, i) => bytes[i] === value,
			);
		case "image/gif":
			return ["GIF87a", "GIF89a"].includes(ascii(0, 6));
		case "image/webp":
			return ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP";
		case "video/mp4":
			return ascii(4, 8) === "ftyp";
		case "video/webm":
			return [0x1a, 0x45, 0xdf, 0xa3].every((value, i) => bytes[i] === value);
		default:
			return false;
	}
}
