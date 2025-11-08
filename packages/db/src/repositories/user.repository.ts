import type { PrismaClient, User } from "@prisma/client";
import CreateRepository, { type Repository } from "./base.repository";

export type UserRepository = Repository & {
	getByUsername: (username: string) => Promise<User | null>;
};

export const CreateUserRepository = (db: PrismaClient): UserRepository => {
	return {
		...CreateRepository(db.user),
		getByUsername: (username: string) => {
			return db.user.findUnique({ where: { username } });
		},
	};
};
