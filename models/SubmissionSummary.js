import mongoose from 'mongoose';

const submissionSummarySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  totalCount: { type: Number, default: 0 },
  difficulty: {
    easy: { type: Number, default: 0 },
    medium: { type: Number, default: 0 },
    hard: { type: Number, default: 0 }
  }
});

// Prevent multiple entries per user per day
submissionSummarySchema.index({ user: 1, date: 1 }, { unique: true });

export const SubmissionSummary = mongoose.model('SubmissionSummary', submissionSummarySchema);
