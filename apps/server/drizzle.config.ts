import { defineConfig } from "drizzle-kit";

const config:any = defineConfig({
	schema: "./src/db/schema",
	out: "./src/db/migrations",
	dialect: "mysql",
	dbCredentials: {
		url: process.env.DATABASE_URL || "",
	},
});

export default config;
