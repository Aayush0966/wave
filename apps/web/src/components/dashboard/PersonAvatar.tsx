import { cn } from "@/lib/utils";

export default function PersonAvatar({
	name,
	image,
	className,
}: {
	name: string;
	image?: string | null;
	className?: string;
}) {
	const initials =
		name
			.trim()
			.split(/\s+/)
			.slice(0, 2)
			.map((part) => part[0] ?? "")
			.join("")
			.toUpperCase() || "?";
	return image ? (
		<img
			src={image}
			alt=""
			className={cn("size-10 shrink-0 rounded-full object-cover", className)}
		/>
	) : (
		<span
			aria-hidden="true"
			className={cn(
				"flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 font-medium text-emerald-700 text-sm dark:bg-emerald-950/50 dark:text-emerald-300",
				className,
			)}
		>
			{initials}
		</span>
	);
}
