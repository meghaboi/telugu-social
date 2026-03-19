import { createStage1App } from "./app.js";
import { createStage1Repository } from "./store.js";

const port = Number(process.env.PORT ?? 4000);

async function main() {
  const repository = createStage1Repository();
  await repository.initialize();

  const app = createStage1App(repository);
  const server = app.listen(port, () => {
    console.log(`telugu-social-api listening on http://localhost:${port}`);
  });

  const shutdown = async (signal: string) => {
    console.log(`Received ${signal}. Shutting down.`);

    server.close(async () => {
      await repository.close();
      process.exit(0);
    });

    setTimeout(() => process.exit(1), 5000).unref();
  };

  process.on("SIGINT", () => {
    void shutdown("SIGINT");
  });

  process.on("SIGTERM", () => {
    void shutdown("SIGTERM");
  });
}

main().catch((error) => {
  console.error("Failed to start API", error);
  process.exit(1);
});
