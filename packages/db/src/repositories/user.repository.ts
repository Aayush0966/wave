import type { PrismaClient } from "@prisma/client";
import CreateRepository from "./base.repository";

export const CreateUserRepository = (db: PrismaClient) => {
	return {
		...CreateRepository(db.user),
		getCurrentProfile: (userId: string) =>
			db.user.findUnique({
				where: { id: userId },
				select: {
					id: true,
					name: true,
					username: true,
					email: true,
					image: true,
				},
			}),
		getByUsername: (username: string) => {
			return db.user.findMany({ where: { username: { contains: username } } });
		},
	};
};
