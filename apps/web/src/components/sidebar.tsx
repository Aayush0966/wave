"use client";
import { icons } from "@wave/ui";
import {
	BarChart3,
	MessageCircle,
	Settings,
	UserRound,
	UsersRound,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import LogoutButton from "./LogoutButton";

const items = [
	{ label: "Chats", icon: MessageCircle, route: "/dashboard/chat" },
	{ label: "People", icon: UsersRound, route: "/dashboard/friends" },
	{ label: "Profile", icon: UserRound, route: "/dashboard/profile" },
	{ label: "Activity", icon: BarChart3, route: "/dashboard/reports" },
	{ label: "Settings", icon: Settings, route: "/dashboard/settings" },
] as const;

function NavigationLinks({
	mobile = false,
	pathname = "",
}: {
	mobile?: boolean;
	pathname?: string;
}) {
	return items.map(({ route, label, icon: Icon }) => {
		const active = pathname === route || pathname.startsWith(`${route}/`);
		return (
			<Link
				key={route}
				href={route}
				aria-current={active ? "page" : undefined}
				className={`flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2.5 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 ${mobile ? "min-w-0 flex-1" : "w-16"} ${active ? "bg-emerald-500/10 text-emerald-400" : mobile ? "text-gray-500 hover:bg-gray-100 dark:text-text-secondary dark:hover:bg-background-tertiary" : "text-silver hover:bg-white/5 hover:text-white"}`}
			>
				<Icon size={mobile ? 20 : 22} aria-hidden="true" />
				<span className="text-[10px]">{label}</span>
			</Link>
		);
	});
}
function ActiveNavigationLinks({ mobile = false }: { mobile?: boolean }) {
	const pathname = usePathname();
	return <NavigationLinks mobile={mobile} pathname={pathname} />;
}

export default function Sidebar() {
	return (
		<aside className="hidden h-full w-20 shrink-0 flex-col items-center py-3 lg:flex">
			<Link
				href="/dashboard/chat"
				aria-label="Wave messages"
				className="mb-7 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
			>
				<Image
					src={icons.lightLogo}
					width={52}
					height={52}
					alt=""
					className="object-contain"
				/>
			</Link>
			<nav aria-label="Main navigation" className="flex flex-col gap-2">
				<Suspense fallback={<NavigationLinks />}>
					<ActiveNavigationLinks />
				</Suspense>
			</nav>
			<div className="mt-auto pt-5">
				<LogoutButton />
			</div>
		</aside>
	);
}
export function MobileNavigation() {
	return (
		<nav
			aria-label="Main navigation"
			className="flex shrink-0 items-center border-gray-200 border-t bg-white px-1 pb-[env(safe-area-inset-bottom)] lg:hidden dark:border-gray-700 dark:bg-background-secondary"
		>
			<Suspense fallback={<NavigationLinks mobile />}>
				<ActiveNavigationLinks mobile />
			</Suspense>
		</nav>
	);
}
