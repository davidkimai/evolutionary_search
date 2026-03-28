import { createApp } from "./api/app.js";
import { config } from "./core/config.js";

const app = createApp();

app.listen({ host: config.host, port: config.port }).then(() => {
  console.log(`OWES server listening on http://${config.host}:${config.port}`);
}).catch((error) => {
  console.error(error);
  process.exit(1);
});
