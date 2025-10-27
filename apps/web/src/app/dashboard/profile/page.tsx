import { auth } from "@wave/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

const page = async () => {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) redirect("/auth/signin");

	return <div>Welcome {session.user.name}</div>;
};

export default page;
