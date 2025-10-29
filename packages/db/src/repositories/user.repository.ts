import type { User } from "@prisma/client";
import prisma from "src/client";
import { BaseRepository } from "./base.repository";

class UserRepository extends BaseRepository<User> {
	constructor() {
		super(prisma.user);
	}
	async getByUsername(username: string): Promise<User | null> {
		return this.model.findUnique({ where: { username } });
	}
}

export default UserRepository;
