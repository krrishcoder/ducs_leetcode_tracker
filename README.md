# 📈 DUCS LeetCode Tracker API

A full‑stack solution for tracking LeetCode progress of Department of Computer Science (DUCS) students. The service stores user details in MongoDB, fetches their latest accepted submissions via the **leetcode‑query** library, and exposes REST endpoints for registration, daily tracking, leader‑boards, and total statistics.

---

## ✨ Features

| Feature                 | Description                                                                                                                                      |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **User Registration**   | Validates username on LeetCode and persists in MongoDB.                                                                                          |
| **Daily Tracking**      | Fetches each user’s accepted submissions for the current IST day, de‑duplicates, categorises by difficulty, and upserts daily summary documents. |
| **Rankings**            | Calculates leader‑boards for *today*, *this week*, *this month*, or *all‑time* via MongoDB aggregation.                                          |
| **Total Stats Refresh** | Periodically recomputes grand totals for every user.                                                                                             |
| **CORS**                | Allows requests from localhost + deployed Vercel frontend.                                                                                       |
| **Type‑Safe Schemas**   | Mongoose models for `User`, `SubmissionSummary`, and `TotalStats`.                                                                               |
| **Time‑Zone Awareness** | All calculations use **Asia/Kolkata** to avoid off‑by‑one errors.                                                                                |

---

## 🛠️ Tech Stack

* **Node.js** 18+
* **Express** 4.x
* **MongoDB Atlas / Self‑Hosted MongoDB**
* **Mongoose** ODM
* **dotenv** – environment variables
* **leetcode‑query** – unofficial LeetCode GraphQL wrapper
* **Render / Vercel / Railway** – optional deployment targets

---

## 🚀 Quick Start

```bash
# 1. Clone repository
$ git clone https://github.com/<your‑org>/ducs‑leetcode‑tracker.git
$ cd ducs‑leetcode‑tracker

# 2. Install dependencies
$ npm install

# 3. Create .env file (see below)
$ cp .env.example .env

# 4. Run local dev server
$ npm run dev        # nodemon
# or
$ node index.js
```

The API will boot at **[http://localhost:3000](http://localhost:3000)** (or the `PORT` you set).

---

## 🔐 Environment Variables

| Key         | Purpose                   | Example                                                          |
| ----------- | ------------------------- | ---------------------------------------------------------------- |
| `PORT`      | HTTP port (optional)      | `3000`                                                           |
| `MONGO_URI` | MongoDB connection string | `mongodb+srv://<user>:<pass>@cluster0.abcd.mongodb.net/leetcode` |

Create a `.env` file in the project root:

```env
PORT=3000
MONGO_URI=mongodb://127.0.0.1:27017/leetcode
```

---

## 🌐 API Reference

> All responses are JSON; **401** or **404** errors include an `error` message.

### Register User

```http
POST /users
Content‑Type: application/json

{
  "username": "krishcoder07",
  "name": "Krish Kshx"
}
```

Returns `201 Created` on success.

### List Users

```http
GET /users
```

---

### Manual Daily Tracking

```http
GET /track
```

* Iterates through every saved user.
* Updates/creates a `SubmissionSummary` document for **each** user for **today** (IST).
* Returns array of per‑user results.

### Rankings

```http
GET /ranking?type=<period>
```

| `type` value        | Window                            |
| ------------------- | --------------------------------- |
| `today` *(default)* | 00:00 – 23:59 IST current day     |
| `this_week`         | Last 7 days                       |
| `this_month`        | First → last day of current month |
| `total`             | All time                          |

### Refresh Total Stats

```http
GET /refresh-total
```

Calculates grand totals for each user and upserts `TotalStats`.

### Total Leader‑Board

```http
GET /total-leaderboard
```

### Direct LeetCode Profile Snapshot

```http
GET /leetcode/:username
```

Fetches fresh stats for a single user without touching DB.

---

## 🗄️ Data Models

### User

```js
{
  _id: ObjectId,
  username: String (unique, required),
  name: String,
  joined: Date
}
```

### SubmissionSummary

```js
{
  _id: ObjectId,
  user: ObjectId (ref User),
  date: "YYYY-MM-DD", // IST
  totalCount: Number,
  difficulty: {
    easy: Number,
    medium: Number,
    hard: Number
  }
}
```

### TotalStats

```js
{
  _id: ObjectId,
  user: ObjectId (ref User),
  username: String,
  totalSolved: Number,
  easy: Number,
  medium: Number,
  hard: Number,
  lastUpdated: Date
}
```

---

## 🖥️ Deployment Guide *(Render)*

1. **Create Web Service** → Language *Node* → Build Command `npm install` → Start Command `node index.js`.
2. **Environment Vars** → Add `MONGO_URI`, `PORT` (optional).
3. **Allow Origin** → Your Render URL (copy into CORS array).
4. **Health Check** → `/users`.

> **Tip**: For Vercel or Railway, swap step 1 with their respective dash‑board settings; code remains unchanged.

---

## 📝 Contributing

1. Fork 🪝 & clone.
2. Create a feature branch: `git checkout -b feat/my‑feature`.
3. Commit with *Conventional Commits* style.
4. Open a PR against **main**.

---

## ⚖️ License

MIT © 2025 *Krish Kshx* / DUCS

---

## 💡 TODO / Ideas

* [ ] CRON‑like job to auto‑track every midnight IST.
* [ ] WebSocket push for live dashboards.
* [ ] Dockerfile & Compose.
* [ ] Test suite (Jest + Supertest).
* [ ] Rate‑limit or queue LeetCode API calls.

---

> Made with ❤️ in DUCS
