import dotenv from 'dotenv';
dotenv.config();
import connectDB from '../config/db.config.js';
import { syncInventoryFromSanity } from '../utils/syncInventoryFromSanity.js';

(async () => {
  await connectDB();
  await syncInventoryFromSanity();
  process.exit(0);
})();
