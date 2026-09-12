import type { PrismaClient } from "@prisma/client";
import CreateRepository from "./base.repository";

export const CreateUserRepository = (db: PrismaClient) => {
	return {
		...CreateRepository(db.user),
		getByUsername: (username: string) => {
			return db.user.findMany({ where: { username: { contains: username } } });
		},
	};
};
