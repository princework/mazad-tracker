// Local / long-running entry point. On Vercel, api/index.js serves app.js instead.
const app = require('./app');
const { startReminderCron } = require('./middleware/reminders');

const PORT = process.env.PORT || 3000;

app.connectAndSeed()
  .then(() => {
    startReminderCron();
    app.listen(PORT, () => {
      console.log(`[Server] Running at http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('[Startup] Fatal error:', err.message);
    process.exit(1);
  });
