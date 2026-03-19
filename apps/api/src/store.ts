import { InMemoryStage1Repository } from "./repositories/inMemoryRepository.js";
import { PostgresStage1Repository } from "./repositories/postgresRepository.js";
import { Stage1Repository } from "./repository.js";

function parseBool(value: string | undefined, defaultValue: boolean) {
  if (value === undefined) {
    return defaultValue;
  }
  return value.toLowerCase() === "true";
}

export function createStage1Repository(): Stage1Repository {
  const forceInMemory = parseBool(process.env.USE_IN_MEMORY_STORE, false);
  const databaseUrl = process.env.DATABASE_URL;

  if (!forceInMemory && databaseUrl) {
    const sslEnabled = parseBool(process.env.DATABASE_SSL, true);
    return new PostgresStage1Repository(databaseUrl, sslEnabled);
  }

  return new InMemoryStage1Repository();
}
