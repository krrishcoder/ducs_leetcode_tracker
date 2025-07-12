import mongoose from 'mongoose';

const contestRankingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true // one contest ranking per user
    },
    attendedContestsCount: {
      type: Number,
      required: true,
      min: 0
    },
    rating: {
      type: Number,
      required: true,
      min: 0
    },
    globalRanking: {
      type: Number,
      required: true,
      min: 0
    },
    totalParticipants: {
      type: Number,
      required: true,
      min: 1
    },
    topPercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    badge: {
      name: {
        type: String,
        required: true,
        trim: true,
        enum: ['Knight', 'Guardian', 'Crusader', 'Scout', 'Wizard', 'Ninja', 'Samurai', 'Pupil', 'Apprentice'] // optional: known badge names
      }
    }
  },
  {
    timestamps: true, // adds createdAt and updatedAt
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: (_, ret) => {
        delete ret._id; // optionally hide internal MongoDB ID
      }
    }
  }
);

export const ContestRanking = mongoose.model('ContestRanking', contestRankingSchema);
