import { createServer } from "http";
import app from "./app";
import { logger } from "./lib/logger";
import { setupGameSocket } from "./game/socket";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const httpServer = createServer(app);

setupGameSocket(httpServer);

httpServer.listen(port, () => {
  logger.info({ port }, "Server listening");
});

httpServer.on("error", (err) => {
  logger.error({ err }, "Server error");
  process.exit(1);
});
