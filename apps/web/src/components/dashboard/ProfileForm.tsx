"use client";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export default function ProfileForm({ initialName }: { initialName: string }) {
	const router = useRouter();
	const [name, setName] = useState(initialName);
	const [savedName, setSavedName] = useState(initialName);
	const [pending, setPending] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [saved, setSaved] = useState(false);
	const trimmed = name.trim();
	const save = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (pending || trimmed === savedName) return;
		setError(null);
		setSaved(false);
		if (trimmed.length < 2 || trimmed.length > 80) {
			setError("Use a name between 2 and 80 characters.");
			return;
		}
		setPending(true);
		try {
			const result = await authClient.updateUser({ name: trimmed });
			if (result.error) {
				setError(
					result.error.message || "Could not save your name. Please try again.",
				);
				return;
			}
			setName(trimmed);
			setSavedName(trimmed);
			setSaved(true);
			router.refresh();
		} catch {
			setError("Could not save your name. Please try again.");
		} finally {
			setPending(false);
		}
	};
	return (
		<form onSubmit={save} className="space-y-3">
			<label htmlFor="profile-name" className="block font-medium text-sm">
				Display name
			</label>
			<input
				id="profile-name"
				name="name"
				autoComplete="name"
				required
				maxLength={80}
				value={name}
				disabled={pending}
				onChange={(event) => {
					setName(event.target.value);
					setSaved(false);
					setError(null);
				}}
				aria-invalid={!!error}
				aria-describedby={error ? "profile-error" : undefined}
				className="h-11 w-full rounded-lg border border-gray-200 bg-transparent px-3 text-sm outline-none focus:border-emerald-500 disabled:opacity-60 dark:border-gray-700"
			/>
			{error && (
				<p
					id="profile-error"
					role="alert"
					className="text-red-600 text-xs dark:text-red-400"
				>
					{error}
				</p>
			)}
			<div className="flex items-center gap-3 pt-1">
				<button
					type="submit"
					disabled={pending || trimmed === savedName}
					className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 font-medium text-sm text-white outline-none hover:bg-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:opacity-50"
				>
					{pending && <Loader2 size={15} className="animate-spin" />}
					{pending ? "Saving…" : "Save changes"}
				</button>
				{saved && (
					<span
						role="status"
						className="text-emerald-600 text-xs dark:text-emerald-400"
					>
						Saved
					</span>
				)}
			</div>
		</form>
	);
}
