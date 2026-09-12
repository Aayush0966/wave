import { auth } from "@wave/auth";
import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

type RouteRule = {
	path: string;
	type: "protected" | "public";
};

export async function proxy(request: NextRequest) {
	const routes: RouteRule[] = [
		{ path: "/dashboard", type: "protected" },
		{ path: "/auth", type: "public" },
	];

	const session = await auth.api.getSession({
		headers: await headers(),
	});
	const matchingRoute = routes.find((r) =>
		request.nextUrl.pathname.startsWith(r.path),
	);

	if (matchingRoute?.type === "protected" && !session) {
		return NextResponse.redirect(new URL("/auth/signin", request.url));
	}

	if (matchingRoute?.type === "public" && session) {
		return NextResponse.redirect(new URL("/dashboard", request.url));
	}
	return NextResponse.next();
}

export const config = {
	matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
	runtime: "nodejs",
};
