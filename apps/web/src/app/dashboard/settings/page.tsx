import ChatNotifications from "@/components/dashboard/chat/ChatNotifications";
import PageContent from "@/components/dashboard/PageContent";
import AppearanceSetting from "@/components/dashboard/settings/AppearanceSetting";
import BlockedPeople from "@/components/dashboard/settings/BlockedPeople";
import LogoutButton from "@/components/LogoutButton";

export default function SettingsPage() {
	return (
		<PageContent title="Settings" description="Just the essentials.">
			<div className="space-y-7">
				<section>
					<h2 className="font-medium text-sm">Appearance</h2>
					<AppearanceSetting />
				</section>
				<section className="flex flex-wrap items-center justify-between gap-4 border-gray-100 border-t pt-6 dark:border-gray-700">
					<div>
						<h2 className="font-medium text-sm">Desktop notifications</h2>
						<p className="mt-1 text-gray-500 text-xs dark:text-text-secondary">
							Message alerts on this browser.
						</p>
					</div>
					<ChatNotifications className="m-0 shrink-0" />
				</section>
				<section className="border-gray-100 border-t pt-6 dark:border-gray-700">
					<h2 className="font-medium text-sm">Blocked people</h2>
					<BlockedPeople />
				</section>
				<section className="flex items-center justify-between gap-4 border-gray-100 border-t pt-6 dark:border-gray-700">
					<h2 className="font-medium text-sm">Account</h2>
					<LogoutButton variant="row" />
				</section>
			</div>
		</PageContent>
	);
}
