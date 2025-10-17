import path from "node:path";
import dotenv from "dotenv";
import type { NextConfig } from "next";

dotenv.config({
	path: path.resolve(import.meta.dirname, "../../.env.local"),
});

const nextConfig: NextConfig = {
	typedRoutes: true,
};

export default nextConfig;
