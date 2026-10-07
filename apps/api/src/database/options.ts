import { join } from "node:path";
import { DataSourceOptions } from "typeorm";
export function databaseOptions(url: string): DataSourceOptions {
  return {
    type: "postgres",
    url,
    synchronize: false,
    migrationsRun: false,
    entities: [join(__dirname, "../**/*.entity{.ts,.js}")],
    migrations: [join(__dirname, "migrations/*{.ts,.js}")],
    extra: { connectionTimeoutMillis: 3000, statement_timeout: 5000 },
  };
}
