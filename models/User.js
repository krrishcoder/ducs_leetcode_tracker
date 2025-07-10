import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true }, // LeetCode username
  email: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export const User = mongoose.model('User', userSchema);
