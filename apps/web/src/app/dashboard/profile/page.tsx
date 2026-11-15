import PageContent from "@/components/dashboard/PageContent";
import PersonAvatar from "@/components/dashboard/PersonAvatar";
import ProfileForm from "@/components/dashboard/ProfileForm";
import { trpc } from "@/lib/trpc-server";

export default async function ProfilePage() {
	const server = await trpc();
	const profile = await server.user.me();
	return (
		<PageContent title="Profile" description="How you appear to other people.">
			<div className="mb-8 flex items-center gap-4">
				<PersonAvatar
					name={profile.name}
					image={profile.image}
					className="size-16 text-xl"
				/>
				<div className="min-w-0">
					<h2 className="truncate font-semibold text-lg">{profile.name}</h2>
					<p className="mt-1 truncate text-gray-500 text-sm dark:text-text-secondary">
						@{profile.username}
					</p>
				</div>
			</div>
			<ProfileForm initialName={profile.name} />
			<dl className="mt-8 space-y-5 border-gray-100 border-t pt-6 text-sm dark:border-gray-700">
				<div>
					<dt className="text-gray-500 text-xs dark:text-text-secondary">
						Username
					</dt>
					<dd className="mt-1">@{profile.username}</dd>
				</div>
				<div>
					<dt className="text-gray-500 text-xs dark:text-text-secondary">
						Email
					</dt>
					<dd className="mt-1 break-words">{profile.email}</dd>
				</div>
			</dl>
		</PageContent>
	);
}
