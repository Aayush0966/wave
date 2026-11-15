"use client";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme-provider";

const choices = [
	{ value: "light", label: "Light", icon: Sun },
	{ value: "dark", label: "Dark", icon: Moon },
	{ value: "system", label: "System", icon: Monitor },
] as const;
export default function AppearanceSetting() {
	const { theme, setTheme } = useTheme();
	return (
		<fieldset aria-label="Appearance" className="mt-4 grid grid-cols-3 gap-2">
			{choices.map(({ value, label, icon: Icon }) => (
				<button
					key={value}
					type="button"
					aria-pressed={theme === value}
					onClick={() => setTheme(value)}
					className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${theme === value ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" : "border-gray-200 text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:text-text-secondary dark:hover:bg-background-tertiary"}`}
				>
					<Icon size={16} />
					{label}
				</button>
			))}
		</fieldset>
	);
}
