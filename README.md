# Mazad · Zoho Project Tracker

Real-time project tracker backed by **MongoDB Atlas** — every change syncs to all users instantly.

---

## Stack
| Layer | Tech |
|---|---|
| Frontend | Vanilla HTML + CSS + JS (zero dependencies) |
| Backend | Node.js + Express |
| Database | MongoDB Atlas |
| Access | Client link = view + feedback · Developer link (`?key=`) = full editing |

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
ADMIN_KEY=<long random string>   # developer key
```

### Access links
| Who | Link | Can do |
|---|---|---|
| Client | `https://<your-site>/` | See everything, give feedback |
| Developers | `https://<your-site>/?key=<ADMIN_KEY>` | Edit and delete tasks and milestones, reply to / resolve / delete feedback |

The developer link only needs to be opened once per browser — the key is saved and removed from the address bar. Click **exit** on the yellow "Developer mode" badge to switch that browser back to the client view. The server enforces this: without the key, every edit request is rejected.

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

On first run the server seeds all 154 tasks into MongoDB — once only (a `meta` marker records it), so deleted tasks and milestones never come back.

---

## Deployment

**Vercel:** import the repo (framework preset "Other"), set `MONGODB_URI` and `ADMIN_KEY` under Environment Variables. `api/index.js` serves the API; `public/` is served as static files.

**Render:** New → Blueprint → pick the repo. `render.yaml` configures everything; paste `MONGODB_URI` and `ADMIN_KEY` when prompted.

---

## Features

| Feature | Details |
|---|---|
| **Real-time sync** | Polls every 8s — all users see changes within seconds |
| **Status dropdown** | Pending / In Progress / Completed / On Hold |
| **Priority** | High / Medium / Low per task |
| **Dates** | Start date + Due date with overdue highlighting |
| **Notes** | Editable inline per task |
| **Client Feedback** | Client leaves feedback on a milestone or a specific task (💬 Give Feedback in the header, on milestone cards, or per task row). Developers reply and mark it resolved. Open count shows on the dashboard and sidebar |
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
| PATCH | `/api/tasks/:id` | Update a task (developer key) |
| DELETE | `/api/tasks/:id` | Permanently delete a task and its feedback (developer key) |
| DELETE | `/api/tasks/milestone/:milestoneId` | Permanently delete a milestone's tasks and feedback (developer key) |
| GET | `/api/tasks/meta/summary` | KPI summary counts |
| GET | `/api/feedback` | All feedback (supports `?milestoneId=&status=`) |
| POST | `/api/feedback` | Add feedback (`milestoneId`, optional `taskId`, `author`, `message`) |
| PATCH | `/api/feedback/:id` | Reply / change status (developer key) |
| DELETE | `/api/feedback/:id` | Delete feedback (developer key) |
| GET | `/api/auth` | Whether the request carries a valid developer key |

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
│   ├── Task.js            ← Task schema
│   ├── Feedback.js        ← Client feedback schema
│   └── seed.js            ← 154 task seed data
├── routes/
│   ├── tasks.js           ← Task API routes
│   └── feedback.js        ← Feedback API routes
├── middleware/
│   └── auth.js            ← Developer-key check
└── public/
    └── index.html         ← Full frontend (HTML+CSS+JS)
```
