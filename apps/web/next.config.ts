import type { NextConfig } from "next";
import dotenv from "dotenv";
import path from "node:path";

// Load root .env.local file
dotenv.config({
	path: path.resolve(import.meta.dirname, "../../.env.local"),
});

const nextConfig: NextConfig = {
	typedRoutes: true,
};

export default nextConfig;
