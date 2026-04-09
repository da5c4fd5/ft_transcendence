import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client";

const adapter = new PrismaPg(process.env.DATABASE_URL!);

export const db = new PrismaClient({ adapter });
export type Database = typeof db;
