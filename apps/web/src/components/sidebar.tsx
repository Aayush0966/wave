import { icons } from "@wave/ui";
import {
	BarChart,
	LogOutIcon,
	MessageCircle,
	Settings,
	User,
	Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const Sidebar = () => {
	const navItems = [
		{ label: "Chats", icon: MessageCircle, route: "/" },
		{ label: "Friends", icon: Users, route: "/friends" },
		{ label: "Profile", icon: User, route: "/profile" },
		{ label: "Reports", icon: BarChart, route: "/reports" },
		{ label: "Settings", icon: Settings, route: "/settings" },
		{ label: "Logout", icon: LogOutIcon, route: "/logout" },
	];

	return (
		<div className="absolute top-10 left-0 hidden w-full max-w-32 flex-col items-center gap-15 bg-silver py-8 lg:flex dark:bg-night-800">
			<div className="">
				<Image
					src={icons.lightLogo}
					width={80}
					height={80}
					alt="logo"
					className="object-contain"
				/>
			</div>
			<nav className="flex flex-col items-center gap-12">
				{navItems.slice(0, 3).map((item) => {
					const Icon = item.icon;
					return (
						<Link
							key={item.route}
							href={{ pathname: item.route }}
							className="flex flex-col items-center justify-center gap-1.5 text-center transition-opacity hover:opacity-70"
						>
							<Icon className="h-6 w-6" />
							<span className="text-xs">{item.label}</span>
						</Link>
					);
				})}

				<div className="my-2 h-px w-12 bg-gray-300 dark:bg-gray-600" />

				{navItems.slice(3).map((item) => {
					const Icon = item.icon;
					return (
						<Link
							key={item.route}
							href={{ pathname: item.route }}
							className="flex flex-col items-center justify-center gap-1.5 text-center transition-opacity hover:opacity-70"
						>
							<Icon className="h-6 w-6" />
							<span className="text-xs">{item.label}</span>
						</Link>
					);
				})}
			</nav>
		</div>
	);
};

export default Sidebar;
