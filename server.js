require('dotenv').config();
const express   = require('express');
const mongoose  = require('mongoose');
const cors      = require('cors');
const path      = require('path');
const Task      = require('./models/Task');
const { SEED_TASKS }          = require('./models/seed');
const taskRoutes               = require('./routes/tasks');
const { startReminderCron }    = require('./middleware/reminders');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/tasks', taskRoutes);

// Serve the frontend for any non-API route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── MongoDB + Seed ──────────────────────────────────────────────────────────
async function connectAndSeed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('[MongoDB] Connected to Atlas');

  const count = await Task.countDocuments();
  if (count === 0) {
    await Task.insertMany(SEED_TASKS);
    console.log(`[Seed] Inserted ${SEED_TASKS.length} tasks`);
  } else {
    console.log(`[Seed] ${count} tasks already in DB — skipping seed`);
  }
}

// ── Start ────────────────────────────────────────────────────────────────────
connectAndSeed()
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
