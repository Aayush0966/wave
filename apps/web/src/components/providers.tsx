"use client";

import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ThemeProvider } from "next-themes";
import { TRPCProvider } from "@/lib/trpc-client";
import { Toaster } from "./ui/sonner";

export default function Providers({ children }: { children: React.ReactNode }) {
	return (
		<ThemeProvider attribute="class" defaultTheme="light" enableSystem>
			<TRPCProvider>
				{children}
				<ReactQueryDevtools />
			</TRPCProvider>
			<Toaster richColors />
		</ThemeProvider>
	);
}
