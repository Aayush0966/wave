import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../index.css";
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
		<html lang="en" suppressHydrationWarning>
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased`}
			>
				<Providers>
					<div className="flex min-h-screen gap-4 bg-silver p-10 dark:bg-night-800">
						<div className="w-28 flex-shrink-0">
							<Sidebar />
						</div>

						<main className="flex w-full items-center justify-center overflow-hidden rounded-3xl bg-white dark:bg-night-500">
							{children}
						</main>
					</div>
				</Providers>
			</body>
		</html>
	);
}
