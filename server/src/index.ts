import { env } from "./config/env";
import { createApp } from "./app";
import { startReminderScheduler } from "./lib/reminderScheduler";

const app = createApp();

app.listen(env.PORT, () => {
  console.log(`Server listening on port ${env.PORT} (${env.NODE_ENV})`);
});

startReminderScheduler();
