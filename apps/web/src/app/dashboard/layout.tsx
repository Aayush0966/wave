import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/index.css";
import Providers from "@/components/providers";
import Sidebar from "@/components/sidebar";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

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
		<div className="flex w-full gap-4 bg-night-800 p-10">
			<div className="hidden h-screen w-28 flex-shrink-0 bg-night-800 lg:block">
				<Sidebar />
			</div>
			<main className="flex h-screen w-full items-center justify-center overflow-hidden rounded-3xl bg-white dark:bg-night-500">
				{children}
			</main>
		</div>
	);
}
