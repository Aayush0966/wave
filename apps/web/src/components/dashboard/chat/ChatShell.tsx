"use client";
import { useParams } from "next/navigation";
import type { ReactNode } from "react";

export default function ChatShell({
	sidebar,
	children,
}: {
	sidebar: ReactNode;
	children: ReactNode;
}) {
	const { chatId } = useParams<{ chatId?: string }>();
	return (
		<div className="flex h-full min-h-0 w-full overflow-hidden">
			<aside
				className={`${chatId ? "hidden md:flex" : "flex"} min-h-0 w-full shrink-0 flex-col border-gray-200 border-r md:w-80 lg:w-96 dark:border-gray-700`}
			>
				{sidebar}
			</aside>
			<section
				className={`${chatId ? "flex" : "hidden md:flex"} min-h-0 min-w-0 flex-1`}
			>
				{children}
			</section>
		</div>
	);
}
