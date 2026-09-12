type Model = {
	findUnique: (args: any) => Promise<any>;
	findMany: (args?: any) => Promise<any[]>;
	create: (args: any) => Promise<any>;
	update: (args: any) => Promise<any>;
	delete: (args: any) => Promise<any>;
};

const CreateRepository = (model: Model) => {
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
