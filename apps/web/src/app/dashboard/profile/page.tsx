import { auth } from "@wave/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ModeToggle } from "@/components/mode-toggle";

const page = async () => {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) {
		redirect("/auth/signin");
	}

	return (
		<div className="mx-auto flex items-center justify-center">
			Welcome {session.user.name}
			<div className="p-4">
				<ModeToggle />
			</div>
		</div>
	);
};

export default page;
