"use client";

import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { TRPCProvider } from "@/lib/trpc-client";
import { ThemeProvider } from "./theme-provider";
import { Toaster } from "./ui/sonner";

export default function Providers({ children }: { children: React.ReactNode }) {
	return (
		<ThemeProvider>
			<TRPCProvider>
				{children}
				<ReactQueryDevtools />
			</TRPCProvider>
			<Toaster richColors />
		</ThemeProvider>
	);
}
