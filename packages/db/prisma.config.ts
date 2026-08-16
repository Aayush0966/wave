import path from "node:path";
import dotenv from "dotenv";
import type { PrismaConfig } from "prisma";
import { env } from "prisma/config";

dotenv.config({
  path: "../../.env",
});

export default {
  schema: path.join("prisma", "schema"),
  migrations: {
    path: path.join("prisma", "migrations"),
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
} satisfies PrismaConfig;
