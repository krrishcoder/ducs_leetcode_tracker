import mongoose from 'mongoose';

const totalStatsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  username: {
    type: String,
    required: true
  },
  totalSolved: { type: Number, default: 0 },
  easy: { type: Number, default: 0 },
  medium: { type: Number, default: 0 },
  hard: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now }
});

export const TotalStats = mongoose.model('TotalStats', totalStatsSchema);
