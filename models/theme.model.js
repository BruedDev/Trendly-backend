import mongoose from 'mongoose';

const themeSchema = new mongoose.Schema({
  uuid: { type: String, required: true, unique: true },
  theme: { type: String, required: true },
  updatedAt: { type: Date, default: Date.now }
});

const Theme = mongoose.model('Theme', themeSchema, 'data-theme');
export default Theme;
