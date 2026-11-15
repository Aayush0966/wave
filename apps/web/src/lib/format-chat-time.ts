export function formatChatTime(time: string, now: number): string {
	const timestamp = new Date(time).getTime();
	if (!Number.isFinite(timestamp)) return "";
	const minutes = Math.floor(Math.max(0, now - timestamp) / 60_000);
	if (minutes < 1) return "Just now";
	if (minutes < 60) return `${minutes} min ago`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours} hr ago`;
	const days = Math.floor(hours / 24);
	return `${days} ${days === 1 ? "day" : "days"} ago`;
}
