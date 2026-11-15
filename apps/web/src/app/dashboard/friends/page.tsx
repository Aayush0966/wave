import PageContent from "@/components/dashboard/PageContent";
import PeopleList from "@/components/dashboard/PeopleList";
import SearchUser from "@/components/dashboard/SearchUser";
import { trpc } from "@/lib/trpc-server";

export default async function PeoplePage() {
	const server = await trpc();
	const chats = await server.chat.getUserChats();
	return (
		<PageContent
			title="People"
			description="The people you have conversations with."
			action={<SearchUser />}
		>
			<PeopleList chats={chats} />
		</PageContent>
	);
}
