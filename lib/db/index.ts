import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString && process.env.NODE_ENV === "production") {
  throw new Error("DATABASE_URL environment variable is missing.");
}

const sql = neon(connectionString || "postgresql://placeholder:placeholder@localhost:5432/ricils");

export const db = drizzle(sql, { schema });
export * from "./schema";
