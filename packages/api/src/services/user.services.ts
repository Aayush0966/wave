import { TRPCError } from "@trpc/server";
import { UserRepository } from "@wave/db";

class UserService {
	constructor(private user = new UserRepository()) {}

	async getProfile(id: string) {
		const user = await this.user.getById(id);
		if (!user)
			throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
		return user;
	}
}

export default UserService;
