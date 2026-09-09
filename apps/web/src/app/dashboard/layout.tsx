import type { Metadata } from "next";
import "@/index.css";
import Sidebar from "@/components/sidebar";

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
		<div className="flex h-screen w-full gap-4 overflow-hidden bg-background-primary">
			<div className="hidden h-screen w-28 shrink-0 lg:block">
				<Sidebar />
			</div>
			<main className="flex h-screen w-full overflow-hidden rounded-3xl bg-white dark:bg-background-secondary">
				{children}
			</main>
		</div>
	);
}
