import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './models/User.js';


import { LeetCode } from 'leetcode-query';
import { SubmissionSummary } from './models/SubmissionSummary.js';

import cors from 'cors';



dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());


app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:5500',
    'https://ducs-leetcode-tracker07f.vercel.app'
  ],
  credentials: true
}));




// 🔗 MongoDB Connection 
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));



/////////////////////////////USER REGISTER///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

app.post('/users', async (req, res) => {
  const { username, name } = req.body;

  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  // 🔽 Convert to lowercase -- by debuggger18
  username = username.toLowerCase();

  try {
    // 1. Check if user already exists in MongoDB
    const existing = await User.findOne({ username });
    if (existing) {
      return res.status(400).json({ error: 'User already exists in database' });
    }

    // 2. Validate that the user exists on LeetCode
    const lc = new LeetCode();
    const userData = await lc.user(username);

    // 3. Check for known failure signals
    if (
      !userData ||
      !userData.matchedUser ||
      !Array.isArray(userData.recentSubmissionList)
    ) {
      return res.status(404).json({ error: 'Username not found on LeetCode' });
    }

    // 4. All good, save to DB
    const user = new User({ username, name });
    await user.save();

    return res.status(201).json({
      message: 'User added successfully',
      user
    });
  } catch (err) {
    console.error('❌ Error in /users:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});




////////////////////////////////////GET ALL USERS////////////////////////////////////////////////////////////////////////////////////////////////////////////
app.get('/users', async (req, res) => {
  const users = await User.find();
  res.json(users);
});

///////////////////////////////////////////// TRACK IN BACKGROUND /////////////////////////////////////////////////////////////////////

app.get('/background-track', async (req, res) => {

  res.status(202).send('Processing started');

  try {
    const users = await User.find();
    const lc = new LeetCode();

    /* ------------------------------------------------------------------
       ❶  Rolling‑24‑hour window
    ------------------------------------------------------------------ */
    const endTime   = Date.now();                       // “now” in ms
    const startTime = endTime - 24 * 60 * 60 * 1000;    // 24 h ago

    /* ❷  Label today’s record by IST calendar date
          (keeps compatibility with your /ranking pipeline)            */
    const istNow      = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
    const dateString  = new Date(istNow).toISOString().split('T')[0];

    const results = [];

    /* ------------------------------------------------------------------
       ❸  Iterate over users and aggregate last‑24h solves
    ------------------------------------------------------------------ */
    for (const user of users) {
      try {
        const data        = await lc.user(user.username);
        const submissions = data.recentSubmissionList || [];

        // filter Accepted submissions inside [startTime, endTime)
        const recentAcceptedRaw = submissions.filter(s => {
          const ts = s.timestamp * 1000;           // LeetCode → ms
          return (
            s.statusDisplay === 'Accepted' &&
            ts >= startTime &&
            ts <  endTime
          );
        });

        /* Deduplicate by titleSlug */
        const seen = new Set();
        const recentAccepted = recentAcceptedRaw.filter(s => {
          if (!s.titleSlug || seen.has(s.titleSlug)) return false;
          seen.add(s.titleSlug);
          return true;
        });

        /* Count by difficulty */
        let easy = 0, medium = 0, hard = 0;

        for (const sub of recentAccepted) {
          let difficulty = sub.difficulty;

          if (!difficulty && sub.titleSlug) {
            try {
              const prob = await lc.problem(sub.titleSlug);
              difficulty = prob.difficulty;
            } catch {
              difficulty = 'Unknown';
            }
          }

          const level = difficulty?.toLowerCase();
          if (level === 'easy')   easy++;
          else if (level === 'medium') medium++;
          else if (level === 'hard')   hard++;
        }

        const totalCount = easy + medium + hard;

        /* Upsert only if something was solved */
        if (totalCount > 0) {
          await SubmissionSummary.updateOne(
            { user: user._id, date: dateString },      // ← still keyed by IST day
            {
              $set: {
                totalCount,
                difficulty: { easy, medium, hard }
              }
            },
            { upsert: true }
          );
        }

        results.push({ user: user.username, totalCount, easy, medium, hard });

      } catch (err) {
        console.error(`❌ Error for user ${user.username}:`, err.message);
        results.push({ user: user.username, error: true });
      }
    }



  } catch (err) {
    console.error('❌ Global tracking error:', err.message);
    
  }
});


/////////////////////////////////////////////// TRACK --  IF USER WANT TO UPDATE AT CURRENT TIME , time taking task/////////////////////////////////////////////////////////////////////////////////////////////////



app.get('/track', async (req, res) => {


  try {
    const users = await User.find();
    const lc = new LeetCode();

    /* ------------------------------------------------------------------
       ❶  Rolling‑24‑hour window
    ------------------------------------------------------------------ */
    const endTime   = Date.now();                       // “now” in ms
    const startTime = endTime - 24 * 60 * 60 * 1000;    // 24 h ago

    /* ❷  Label today’s record by IST calendar date
          (keeps compatibility with your /ranking pipeline)            */
    const istNow      = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
    const dateString  = new Date(istNow).toISOString().split('T')[0];

    const results = [];

    /* ------------------------------------------------------------------
       ❸  Iterate over users and aggregate last‑24h solves
    ------------------------------------------------------------------ */
    for (const user of users) {
      try {
        const data        = await lc.user(user.username);
        const submissions = data.recentSubmissionList || [];

        // filter Accepted submissions inside [startTime, endTime)
        const recentAcceptedRaw = submissions.filter(s => {
          const ts = s.timestamp * 1000;           // LeetCode → ms
          return (
            s.statusDisplay === 'Accepted' &&
            ts >= startTime &&
            ts <  endTime
          );
        });

        /* Deduplicate by titleSlug */
        const seen = new Set();
        const recentAccepted = recentAcceptedRaw.filter(s => {
          if (!s.titleSlug || seen.has(s.titleSlug)) return false;
          seen.add(s.titleSlug);
          return true;
        });

        /* Count by difficulty */
        let easy = 0, medium = 0, hard = 0;

        for (const sub of recentAccepted) {
          let difficulty = sub.difficulty;

          if (!difficulty && sub.titleSlug) {
            try {
              const prob = await lc.problem(sub.titleSlug);
              difficulty = prob.difficulty;
            } catch {
              difficulty = 'Unknown';
            }
          }

          const level = difficulty?.toLowerCase();
          if (level === 'easy')   easy++;
          else if (level === 'medium') medium++;
          else if (level === 'hard')   hard++;
        }

        const totalCount = easy + medium + hard;

        /* Upsert only if something was solved */
        if (totalCount > 0) {
          await SubmissionSummary.updateOne(
            { user: user._id, date: dateString },      // ← still keyed by IST day
            {
              $set: {
                totalCount,
                difficulty: { easy, medium, hard }
              }
            },
            { upsert: true }
          );
        }

        results.push({ user: user.username, totalCount, easy, medium, hard });

      } catch (err) {
        console.error(`❌ Error for user ${user.username}:`, err.message);
        results.push({ user: user.username, error: true });
      }
    }

    /* ------------------------------------------------------------------ */
    return res.json({
      status: '✅ 24‑hour summary updated',
      windowStart: new Date(startTime).toISOString(),
      windowEnd:   new Date(endTime).toISOString(),
      dateKey:     dateString,   // record stored under this IST day
      results
    });

  } catch (err) {
    console.error('❌ Global tracking error:', err.message);
    res.status(500).json({ error: '❌ Failed to track users' });
  }
});


////////////////////////////////////shows ranking////////////////////////////////////////////////////////////////////////////////////////////////////////////
//GET /ranking?type=today
//GET /ranking?type=this_week
//GET /ranking?type=this_month
//GET /ranking?type=total


app.get('/ranking', async (req, res) => {
  try {
    const { type = 'today' } = req.query;

    // Current IST date
    const istNow = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
    const today = new Date(istNow);               // full Date object in IST
    today.setHours(0, 0, 0, 0);                   // midnight IST

    // ISO strings for today and yesterday
    const todayStr     = today.toISOString().split('T')[0];

    const yesterday    = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    let dateFilter = {};

    if (type === 'today') {
      dateFilter = { date: { $in: [yesterdayStr, todayStr] } };   // ← key change
    } else if (type === 'this_week') {
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - 6);
      dateFilter = { date: { $gte: startOfWeek.toISOString().split('T')[0] } };
    } else if (type === 'this_month') {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      dateFilter = { date: { $gte: startOfMonth.toISOString().split('T')[0] } };
    } else if (type !== 'total') {
      return res.status(400).json({ error: '❌ Invalid type parameter' });
    }

    const pipeline = [
      ...(Object.keys(dateFilter).length ? [{ $match: dateFilter }] : []),
      {
        $group: {
          _id: '$user',
          totalCount: { $sum: '$totalCount' },
          easy:   { $sum: '$difficulty.easy'   },
          medium: { $sum: '$difficulty.medium' },
          hard:   { $sum: '$difficulty.hard'   }
        }
      },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'userInfo' } },
      { $unwind: '$userInfo' },
      {
        $project: {
          username: '$userInfo.username',
          totalCount: 1,
          easy: 1,
          medium: 1,
          hard: 1
        }
      },
      { $sort: { totalCount: -1 } }
    ];

    const results = await SubmissionSummary.aggregate(pipeline);

    res.json({ status: '✅ Rankings fetched', type, results });
  } catch (err) {
    console.error('❌ Ranking fetch error:', err.message);
    res.status(500).json({ error: '❌ Failed to fetch rankings' });
  }
});


/////////////////////////////////shows submission summary for a user////////////////////////////////////////////////////////////////////////////////////////////////////////////
import { TotalStats } from './models/TotalStats.js';


app.get('/refresh-total', async (req, res) => {
  try {
    const users = await User.find();
    const lc = new LeetCode();
    const results = [];

    for (const user of users) {
      try {
        const data = await lc.user(user.username);

        const ac = data?.matchedUser?.submitStats?.acSubmissionNum;

        if (!Array.isArray(ac)) {
          throw new Error("Invalid response: acSubmissionNum not found");
        }

        const getCount = (difficulty) => {
          const d = ac.find(x => x.difficulty.toLowerCase() === difficulty);
          return d?.count || 0;
        };

        const easy = getCount('easy');
        const medium = getCount('medium');
        const hard = getCount('hard');
        const totalSolved = easy + medium + hard;

        const updated = await TotalStats.findOneAndUpdate(
          { user: user._id },
          {
            $set: {
              username: user.username,
              totalSolved,
              easy,
              medium,
              hard,
              lastUpdated: new Date()
            }
          },
          { upsert: true, new: true }
        );

        results.push({ username: user.username, totalSolved });
      } catch (err) {
        console.error(`❌ Failed to refresh ${user.username}:`, err.message);
        results.push({ username: user.username, error: true });
      }
    }

    res.json({
      message: '✅ Refreshed total stats for all users',
      results
    });

  } catch (err) {
    console.error('❌ Failed to refresh total stats:', err.message);
    res.status(500).json({ error: '❌ Internal Server Error' });
  }
});


///////////////////////////////////shows total stats for a user////////////////////////////////////////////////////////////////////////////////////////////////////////////
app.get('/total-leaderboard', async (req, res) => {
  try {
    const stats = await TotalStats.find().sort({ totalSolved: -1 });
    res.json({ stats });
  } catch (err) {
    console.error('❌ Failed to fetch leaderboard:', err.message);
    res.status(500).json({ error: '❌ Internal Server Error' });
  }
});

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


app.get('/leetcode/:username', async (req, res) => {
  const { username } = req.params;
  const lc = new LeetCode();

  try {
    const data = await lc.user(username);
    const ac = data?.matchedUser?.submitStats?.acSubmissionNum;

    if (!Array.isArray(ac)) {
      return res.status(404).json({ error: '❌ Invalid response from LeetCode API' });
    }

    const getCount = (difficulty) => {
      const d = ac.find(x => x.difficulty.toLowerCase() === difficulty);
      return d?.count || 0;
    };

    const easy = getCount('easy');
    const medium = getCount('medium');
    const hard = getCount('hard');
    const totalSolved = easy + medium + hard;

    res.json({
      username,
      easy,
      medium,
      hard,
      totalSolved
    });
  } catch (err) {
    console.error(`❌ Error fetching LeetCode profile for ${username}:`, err.message);
    res.status(500).json({ error: '❌ Failed to fetch profile' });
  }
});

/////////////////////////////////////////////////////// Contest Ranking Model //////////////////////////////////////////////////////
// routes/contestRoutes.js

import { ContestRanking } from './models/ContestRanking.js';



app.post('/refresh-contests', async (req, res) => {
 

  try {
    const lc = new LeetCode();

    const users = await User.find();
    if (!users.length) {
      return res.status(404).json({ message: 'No users found in the database' });
    }

    const results = [];

    for (const user of users) {
      try {
        const data = await lc.user_contest_info(user.username);

        if (!data?.userContestRanking) {
          results.push({ username: user.username, success: false, message: 'No contest data' });
          continue;
        }

        const updated = await ContestRanking.findOneAndUpdate(
          { user: user._id },
          { ...data.userContestRanking, user: user._id },
          { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        results.push({ username: user.username, success: true, data: updated });
      } catch (err) {
        console.error(`❌ Error for ${user.username}:`, err.message);
        results.push({ username: user.username, success: false, message: err.message });
      }
    }

    return res.status(200).json({ message: 'Refreshed rankings for all users', results });
  } catch (error) {
    console.error('❌ Failed to refresh all users:', error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


///////////////////////////////////////////////////////GET ALL CONTEST RANKINGS////////////////////////////////////////////////////////////////////////////////////////////////////////////
app.get('/contest-rankings', async (req, res) => {
  try {
    const rankings = await ContestRanking.find()
      .populate('user', 'username email')  // Populate username & email from User model
      .sort({ rating: -1 }); // optional: sort by rating descending

    res.status(200).json(rankings);
  } catch (error) {
    console.error('❌ Error fetching contest rankings:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});




app.listen(PORT, () => {
  console.log(`🌍 Server running at http://localhost:${PORT}`);
});












