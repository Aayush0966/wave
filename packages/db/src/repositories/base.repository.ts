type Model = {
	findUnique: (args: any) => Promise<any>;
	findMany: (args?: any) => Promise<any[]>;
	create: (args: any) => Promise<any>;
	update: (args: any) => Promise<any>;
	delete: (args: any) => Promise<any>;
};

export type Repository = {
	getById: (id: string) => Promise<any>;
	getAll: () => Promise<any>;
	create: (data: any) => Promise<any>;
	update: (id: string, data: any) => Promise<any>;
	delete: (id: string) => Promise<any>;
};

const CreateRepository = (model: Model): Repository => {
	return {
		getById: async (id: string) => {
			return model.findUnique({ where: { id } });
		},

		getAll: async () => {
			return model.findMany();
		},

		create: async (data: any) => {
			return model.create({ data });
		},

		update: async (id: string, data: any) => {
			return model.update({ where: { id }, data });
		},

		delete: async (id: string) => {
			return model.delete({ where: { id } });
		},
	};
};

export default CreateRepository;
