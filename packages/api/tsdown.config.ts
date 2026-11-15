import { defineConfig } from "tsdown";

export default defineConfig({
	entry: ["src/**/*.ts"],
	sourcemap: true,
	dts: {
		build: true,
		incremental: false,
		compilerOptions: { incremental: false },
	},
});
