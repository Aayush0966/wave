import path from "node:path";
import dotenv from "dotenv";
import type { NextConfig } from "next";

dotenv.config({
	path: path.resolve(import.meta.dirname, "../../.env.local"),
});

const nextConfig: NextConfig = {
	images: {
		remotePatterns: [
			{ hostname: "plus.unsplash.com" },
			{ hostname: "example.com" },
		],
	},
	cacheComponents: true,
	typedRoutes: true,
	transpilePackages: ["ui"],
	turbopack: {
		rules: {
			"*.lottie": {
				type: "asset",
			},
		},
	},
	webpack: (config) => {
		config.module.rules.push({
			test: /\.lottie$/,
			type: "asset/resource",
		});
		return config;
	},
};

export default nextConfig;
