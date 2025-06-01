import { AnkiServer } from "./server/server.js";

async function main() {
  try {
    const server = new AnkiServer();
    await server.start();
  } catch (error) {
    console.error("Fatal error in main():", error);
    process.exit(1);
  }
}

main();