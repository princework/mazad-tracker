# Mazad · Zoho Project Tracker

Real-time project tracker backed by **MongoDB Atlas** — every change syncs to all users instantly.

---

## Stack
| Layer | Tech |
|---|---|
| Frontend | Vanilla HTML + CSS + JS (zero dependencies) |
| Backend | Node.js + Express |
| Database | MongoDB Atlas |
| Reminders | In-app notification bell (no email) |

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
```

**Getting your MongoDB Atlas URI:**
1. Go to https://cloud.mongodb.com
2. Create a free cluster (M0)
3. Click "Connect" → "Drivers" → copy the connection string
4. Replace `<password>` with your DB user password
5. Network Access → add `0.0.0.0/0` so Vercel/Render can connect

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

## Deployment

**Vercel:** import the repo (framework preset "Other"), set `MONGODB_URI` under Environment Variables. `api/index.js` serves the API; `public/` is served as static files.

**Render:** New → Blueprint → pick the repo. `render.yaml` configures everything; paste `MONGODB_URI` when prompted.

---

## Features

| Feature | Details |
|---|---|
| **Real-time sync** | Polls every 8s — all users see changes within seconds |
| **Status dropdown** | Not Started / In Progress / Completed / Blocked / On Hold |
| **Priority** | High / Medium / Low per task |
| **Dates** | Start date + Due date with overdue highlighting |
| **Notes** | Editable inline per task |
| **Reminders** | Set a date/time + note per task; when it's due it shows in the 🔔 notification bell — click to open the task, **Done** to dismiss |
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
| GET | `/api/tasks/meta/reminders` | Due reminders not yet marked done |

---

## File Structure

```
mazad-tracker/
├── app.js                 ← Express app (shared by server.js and api/index.js)
├── server.js              ← Local / Render entry point
├── api/index.js           ← Vercel serverless entry point
├── package.json
├── .env                   ← Your secrets (never commit)
├── models/
│   ├── Task.js            ← Mongoose schema
│   └── seed.js            ← 154 task seed data
├── routes/
│   └── tasks.js           ← REST API routes
└── public/
    └── index.html         ← Full frontend (HTML+CSS+JS)
```
