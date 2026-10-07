import "reflect-metadata";
import "dotenv/config";
import { DataSource } from "typeorm";
import { databaseOptions } from "./options";
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
export default new DataSource(databaseOptions(process.env.DATABASE_URL));
