import type { Metadata } from "next";
import "@/index.css";
import Sidebar, { MobileNavigation } from "@/components/sidebar";

export const metadata: Metadata = {
	title: "wave",
	description: "wave",
};

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<div className="flex h-dvh w-full flex-col overflow-hidden bg-background-primary lg:flex-row lg:gap-3 lg:p-3">
			<Sidebar />
			<main className="flex min-h-0 min-w-0 flex-1 overflow-hidden bg-white lg:rounded-2xl dark:bg-background-secondary">
				{children}
			</main>
			<MobileNavigation />
		</div>
	);
}
