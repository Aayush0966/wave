import { TRPCError } from "@trpc/server";

export class BaseRepository<T, CreateInput = any, UpdateInput = any> {
	constructor(protected model: any) {}

	async getById(id: string): Promise<T | null> {
		return this.model.findUnique({ where: { id } });
	}

	async getAll(): Promise<T[]> {
		return this.model.findMany();
	}

	async create(data: CreateInput): Promise<T> {
		return this.model.create({ data });
	}

	async update(id: string, data: UpdateInput): Promise<T> {
		const updated = await this.model.update({
			where: { id },
			data,
		});
		if (!updated)
			throw new TRPCError({ code: "NOT_FOUND", message: "Record not found" });
		return updated;
	}

	async delete(id: string): Promise<T> {
		const deleted = await this.model.delete({ where: { id } });
		if (!deleted)
			throw new TRPCError({ code: "NOT_FOUND", message: "Record not found" });
		return deleted;
	}
}
