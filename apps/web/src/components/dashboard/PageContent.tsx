import type { ReactNode } from "react";

export default function PageContent({
	title,
	description,
	action,
	children,
}: {
	title: string;
	description: string;
	action?: ReactNode;
	children: ReactNode;
}) {
	return (
		<div className="min-h-0 min-w-0 flex-1 overflow-y-auto text-night-800 dark:text-text-primary">
			<div className="mx-auto w-full max-w-3xl px-5 py-7 sm:px-10 sm:py-10">
				<header className="mb-8 flex items-start justify-between gap-4">
					<div>
						<h1 className="font-semibold text-2xl tracking-tight">{title}</h1>
						<p className="mt-1.5 text-gray-500 text-sm dark:text-text-secondary">
							{description}
						</p>
					</div>
					{action}
				</header>
				{children}
			</div>
		</div>
	);
}
