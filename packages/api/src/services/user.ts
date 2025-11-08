import type { User } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import type { UserRepository } from "@wave/db";

export type UserService = {
	getProfile: (id: string) => Promise<User>;
	getByUsername: (username: string) => Promise<User>;
};

const CreateUserService = (repo: UserRepository): UserService => {
	return {
		async getProfile(id: string) {
			const user = await repo.getById(id);
			if (!user)
				throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
			return user;
		},

		async getByUsername(username: string) {
			const user = await repo.getByUsername(username);
			if (!user)
				throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
			return user;
		},
	};
};

export default CreateUserService;
