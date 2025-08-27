import express from 'express';
import { handleSanityInventoryWebhook } from '../controllers/inventory.controller.js';

const router = express.Router();

// Webhook nhận sự kiện từ Sanity
router.post('/sanity-webhook', async (req, res) => {
  try {
    const result = await handleSanityInventoryWebhook(req.body);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
