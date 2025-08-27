import express from 'express';
import { syncInventoryFromSanity } from '../controllers/inventory.controller.js';


const router = express.Router();

// Webhook nhận sự kiện từ Sanity
router.post('/sanity-webhook', async (req, res) => {
  try {
    const result = await syncInventoryFromSanity();
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
