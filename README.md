# Mazad · Zoho Project Tracker

Real-time project tracker backed by **MongoDB Atlas** — every change syncs to all users instantly.

---

## Stack
| Layer | Tech |
|---|---|
| Frontend | Vanilla HTML + CSS + JS (zero dependencies) |
| Backend | Node.js + Express |
| Database | MongoDB Atlas |
| Reminders | node-cron + Nodemailer (email) |

---

## Setup in 5 minutes

### 1. Install dependencies
```bash
cd mazad-tracker
npm install
```

### 2. Configure environment
Edit `.env`:
```env
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/mazad_tracker?retryWrites=true&w=majority
PORT=3000

# Email (for reminders) — use Gmail App Password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=your_16_char_app_password
REMINDER_FROM=Mazad Tracker <your@gmail.com>
```

**Getting your MongoDB Atlas URI:**
1. Go to https://cloud.mongodb.com
2. Create a free cluster (M0)
3. Click "Connect" → "Drivers" → copy the connection string
4. Replace `<password>` with your DB user password

**Gmail App Password:**
1. Enable 2FA on your Google account
2. Go to https://myaccount.google.com/apppasswords
3. Generate a password for "Mail"

### 3. Run
```bash
# Development (auto-reload)
npm run dev

# Production
npm start
```

Open **http://localhost:3000**

On first run the server automatically seeds all 154 tasks into MongoDB.

---

## Deployment (Render.com — free)

1. Push this folder to a GitHub repo
2. Go to https://render.com → New Web Service
3. Connect your repo
4. Set environment variables in Render dashboard (same as `.env`)
5. Build command: `npm install`
6. Start command: `node server.js`
7. Done — you get a public URL everyone on your team can use

---

## Features

| Feature | Details |
|---|---|
| **Real-time sync** | Polls every 8s — all users see changes within seconds |
| **Status dropdown** | Not Started / In Progress / Completed / Blocked / On Hold |
| **Priority** | High / Medium / Low per task |
| **Dates** | Start date + Due date with overdue highlighting |
| **Notes** | Editable inline per task |
| **Reminders** | Set date/time + email — server sends email automatically |
| **Overdue alerts** | Daily 9 AM digest email for all overdue tasks |
| **KPI dashboard** | Live counts: total, by status, overdue, due this week |
| **Gantt strip** | Milestone-level progress bars |
| **Milestone cards** | Per-milestone breakdown with completion % |
| **Filter & search** | By status, priority, milestone, or keyword |
| **CSV export** | Download full task list at any time |

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/tasks` | All tasks (supports `?milestoneId=&status=`) |
| GET | `/api/tasks/:id` | Single task |
| PATCH | `/api/tasks/:id` | Update any field |
| GET | `/api/tasks/meta/summary` | KPI summary counts |
| GET | `/api/tasks/meta/reminders` | Reminders due in next 24h |

---

## File Structure

```
mazad-tracker/
├── server.js              ← Express entry point
├── package.json
├── .env                   ← Your secrets (never commit)
├── models/
│   ├── Task.js            ← Mongoose schema
│   └── seed.js            ← 154 task seed data
├── routes/
│   └── tasks.js           ← REST API routes
├── middleware/
│   └── reminders.js       ← Cron + email sender
└── public/
    └── index.html         ← Full frontend (HTML+CSS+JS)
```
