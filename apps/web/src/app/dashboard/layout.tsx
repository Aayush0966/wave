import type { Metadata } from "next";
import "@/index.css";
import Sidebar from "@/components/sidebar";

export const metadata: Metadata = {
	title: "wave",
	description: "wave",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<div className="flex w-full gap-4 bg-background-primary p-10">
			<div className="hidden h-screen w-28 flex-shrink-0 lg:block">
				<Sidebar />
			</div>
			<main className="flex h-screen w-full items-center justify-center overflow-hidden rounded-3xl bg-white dark:bg-background-secondary">
				{children}
			</main>
		</div>
	);
}
