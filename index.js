import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './models/User.js';


import { LeetCode } from 'leetcode-query';
import { SubmissionSummary } from './models/SubmissionSummary.js';



dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());



// 🔗 MongoDB Connection 
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));




app.post('/users', async (req, res) => {
  const { username, name } = req.body;

  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

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



// 🧾 List all users
app.get('/users', async (req, res) => {
  const users = await User.find();
  res.json(users);
});


app.get('/track', async (req, res) => {
  try {
    const users = await User.find();
    const lc = new LeetCode();

    // Get start and end of today in IST
    const now = new Date();
    const istNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const startOfDay = new Date(istNow.getFullYear(), istNow.getMonth(), istNow.getDate()).getTime();
    const endOfDay = startOfDay + 24 * 60 * 60 * 1000;
    const dateString = new Date(startOfDay).toISOString().split('T')[0];

            const results = [];

            for (const user of users) {
            try {
                const data = await lc.user(user.username);
                const submissions = data.recentSubmissionList || [];

            const todayAcceptedRaw = submissions.filter(s => {
        const ts = s.timestamp * 1000;
        return (
            s.statusDisplay === 'Accepted' &&
            ts >= startOfDay &&
            ts < endOfDay
        );
        });

        // Remove duplicates based on titleSlug
        const seen = new Set();
        const todayAccepted = todayAcceptedRaw.filter(s => {
        if (!s.titleSlug || seen.has(s.titleSlug)) return false;
        seen.add(s.titleSlug);
        return true;
        });


        let easy = 0, medium = 0, hard = 0;

        for (const sub of todayAccepted) {
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
          if (level === 'easy') easy++;
          else if (level === 'medium') medium++;
          else if (level === 'hard') hard++;
        }

        const totalCount = easy + medium + hard;

        // Only update if something was solved
        if (totalCount > 0) {
          await SubmissionSummary.updateOne(
            { user: user._id, date: dateString },
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

    return res.json({
      status: '✅ Daily summary updated',
      date: dateString,
      results
    });

  } catch (err) {
    console.error('❌ Global tracking error:', err.message);
    res.status(500).json({ error: '❌ Failed to track users' });
  }
});



app.listen(PORT, () => {
  console.log(`🌍 Server running at http://localhost:${PORT}`);
});














// app.get('/submissions/:username', async (req, res) => {
//   const { username } = req.params;
//   const lc = new LeetCode();

//   try {
//     const data = await lc.user(username);
//     const submissions = data?.recentSubmissionList;

//     if (!submissions || submissions.length === 0) {
//       return res.status(404).json({ error: '❌ No submissions found or user not found' });
//     }

//     // Fetch problem metadata in parallel
//     const enrichedSubmissions = await Promise.all(
//       submissions.map(async (s, index) => {
//         let difficulty = 'unknown';
//         try {
//           const question = await lc.problem(s.titleSlug);
//           difficulty = question?.difficulty || 'unknown';
//         } catch (err) {
//           console.warn(`⚠️ Failed to fetch difficulty for ${s.titleSlug}`);
//         }

//         return {
//           no: index + 1,
//           title: s.title,
//           status: s.statusDisplay,
//           difficulty,
//           time: new Date(s.timestamp * 1000).toLocaleString('en-IN', {
//             timeZone: 'Asia/Kolkata',
//           }),
//         };
//       })
//     );

//     res.json({ user: username, submissions: enrichedSubmissions });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: '❌ Internal server error' });
//   }
// });