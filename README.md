
# 📈 DUCS LeetCode Tracker API

A full‑stack solution for tracking LeetCode progress of Department of Computer Science (DUCS) students. The service stores user details in MongoDB, fetches their latest accepted submissions via the **leetcode‑query** library, and exposes REST endpoints for registration, daily tracking, leader‑boards, total statistics, and background updates.

Live API Base URL: **[https://ducs-leetcode-tracker-1.onrender.com](https://ducs-leetcode-tracker-1.onrender.com)**

---

## ✨ Features

| Feature                   | Description                                                                                                                                      |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **User Registration**     | Validates username on LeetCode and persists in MongoDB.                                                                                          |
| **Daily Tracking**        | Fetches each user’s accepted submissions for the current IST day, de‑duplicates, categorises by difficulty, and upserts daily summary documents. |
| **Rankings**              | Calculates leader‑boards for *today*, *this week*, *this month*, or *all‑time* via MongoDB aggregation.                                          |
| **Total Stats Refresh**   | Periodically recomputes grand totals for every user.                                                                                             |
| **Hourly Background Job** | New endpoint `/background-track` triggers hourly data collection in background without waiting for a full response.                             |
| **CORS**                  | Allows requests from localhost + deployed Vercel frontend.                                                                                       |
| **Type‑Safe Schemas**     | Mongoose models for `User`, `SubmissionSummary`, and `TotalStats`.                                                                               |
| **Time‑Zone Awareness**   | All calculations use **Asia/Kolkata** to avoid off‑by‑one errors.                                                                                |

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

```env
PORT=3000
MONGO_URI=mongodb://127.0.0.1:27017/leetcode
```

---

## 🌐 API Reference

> Base URL: **[https://ducs-leetcode-tracker-1.onrender.com](https://ducs-leetcode-tracker-1.onrender.com)**  
> All responses are JSON; **401** or **404** errors include an `error` message.

### 📌 Register User

```http
POST /users
```
[🔗 Try it](https://ducs-leetcode-tracker-1.onrender.com/users) *(use POST method with JSON body)*

**Request Body:**

```json
{
  "username": "krishcoder07",
  "name": "Krish Kshx"
}
```

---

### 👥 List Users

```http
GET /users
```
[🔗 Try it](https://ducs-leetcode-tracker-1.onrender.com/users)

---

### 🕒 Manual Daily Tracking

```http
GET /track
```
[🔗 Try it](https://ducs-leetcode-tracker-1.onrender.com/track)

---

### 📊 Rankings

```http
GET /ranking?type=<period>
```

| Type         | Example Link                                                                 |
| ------------ | ----------------------------------------------------------------------------- |
| `today`      | [🔗 Today](https://ducs-leetcode-tracker-1.onrender.com/ranking?type=today) |
| `this_week`  | [🔗 This Week](https://ducs-leetcode-tracker-1.onrender.com/ranking?type=this_week) |
| `this_month` | [🔗 This Month](https://ducs-leetcode-tracker-1.onrender.com/ranking?type=this_month) |
| `total`      | [🔗 Total](https://ducs-leetcode-tracker-1.onrender.com/ranking?type=total) |

---

### 🔁 Refresh Total Stats

```http
GET /refresh-total
```
[🔗 Try it](https://ducs-leetcode-tracker-1.onrender.com/refresh-total)

---

### 🏆 Total Leaderboard

```http
GET /total-leaderboard
```
[🔗 Try it](https://ducs-leetcode-tracker-1.onrender.com/total-leaderboard)

---

### 🧑 LeetCode Profile Snapshot

```http
GET /leetcode/:username
```
Example: [🔗 krishcoder07](https://ducs-leetcode-tracker-1.onrender.com/leetcode/krishcoder07)

---

### ⏱️ Background Hourly Tracker *(NEW)*

```http
GET /background-track
```
[🔗 Try it](https://ducs-leetcode-tracker-1.onrender.com/background-track)

> This endpoint triggers LeetCode data collection every hour. It **responds instantly** while processing continues in the **background**. Ideal for CRON jobs or serverless pings.

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

1. **Create Web Service** → Language: *Node.js*  
   Build Command: `npm install`  
   Start Command: `node index.js`
2. **Set Environment Variables** → Add `MONGO_URI`, `PORT` (optional)
3. **CORS Settings** → Add frontend Vercel/Render URL to allowed origins
4. **Health Check** → Use `/users` or `/background-track`

---

## 📝 Contributing

1. Fork 🪝 & clone
2. Create feature branch: `git checkout -b feat/my-feature`
3. Follow *Conventional Commits* style
4. Submit PR to **main**

---

## ⚖️ License

MIT © 2025 *Krishna Kumar* / DUCS

---

## 💡 TODO / Ideas

* [x] Hourly CRON-like tracker (`/background-track`)
* [ ] WebSocket push for live dashboards
* [ ] Dockerfile & docker-compose
* [ ] Test suite (Jest + Supertest)
* [ ] Rate-limit or queue LeetCode API calls

---

> Made with ❤️ in DUCS
