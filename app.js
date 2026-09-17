require('dotenv').config();
const express   = require('express');
const mongoose  = require('mongoose');
const cors      = require('cors');
const path      = require('path');
const Task      = require('./models/Task');
const { SEED_TASKS }          = require('./models/seed');
const taskRoutes               = require('./routes/tasks');
const feedbackRoutes           = require('./routes/feedback');
const { isAdmin }              = require('./middleware/auth');

// ── MongoDB (cached so serverless invocations reuse one connection) ─────────
let connecting = null;

async function connectAndSeed() {
  if (mongoose.connection.readyState === 1) return;
  if (!connecting) {
    if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not set');
    connecting = (async () => {
      await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
      console.log('[MongoDB] Connected to Atlas');

      const count = await Task.countDocuments();
      if (count === 0) {
        await Task.insertMany(SEED_TASKS);
        console.log(`[Seed] Inserted ${SEED_TASKS.length} tasks`);
      } else {
        console.log(`[Seed] ${count} tasks already in DB — skipping seed`);
      }
    })().catch(err => { connecting = null; throw err; });
  }
  await connecting;
}

// Mongoose's top-level message always blames the IP list; the per-server errors say what really failed
function describeDbError(err) {
  const causes = [...(err.reason?.servers?.values() || [])]
    .map(s => s.error && `${s.address}: ${s.error.message}`)
    .filter(Boolean);
  const host = (process.env.MONGODB_URI || '').match(/@([^/?]+)/)?.[1] || 'unknown host';
  return { host, causes };
}

const app = express();

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api', async (req, res, next) => {
  try {
    await connectAndSeed();
    next();
  } catch (err) {
    const { host, causes } = describeDbError(err);
    console.error('[MongoDB] Connection failed:', err.message, host, causes);
    res.status(503).json({
      success: false,
      message: 'Database unavailable: ' + err.message,
      host,
      causes,
    });
  }
});

// ── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/tasks', taskRoutes);
app.use('/api/feedback', feedbackRoutes);

// Tells the frontend whether this browser holds the developer key
app.get('/api/auth', (req, res) => {
  res.json({ success: true, data: { admin: isAdmin(req), configured: !!process.env.ADMIN_KEY } });
});

// Serve the frontend for any non-API route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

module.exports = app;
module.exports.connectAndSeed = connectAndSeed;
module.exports.describeDbError = describeDbError;
