import { drizzle } from "drizzle-orm/node-postgres";
import { SQLDatabase } from "encore.dev/storage/sqldb";

const DB = new SQLDatabase("railway", {
  migrations: {
    path: "./migrations",
    source: "drizzle",
  },
});

const db = drizzle(DB.connectionString);

export { db };
