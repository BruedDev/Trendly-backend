import express from 'express';
import sanityClient from '../config/sanity.config.js';
import Inventory from '../models/inventory.model.js';

const router = express.Router();

// Webhook nhận sự kiện từ Sanity
router.post('/sanity-webhook', async (req, res) => {
  try {
    const { _id, _type } = req.body;
    if (_type !== 'product' || !_id) {
      return res.status(400).json({ error: 'Not a product event or missing _id' });
    }
    // Lấy lại dữ liệu sản phẩm từ Sanity
    const product = await sanityClient.fetch('*[_type == "product" && _id == $id][0]{_id, title, colors}', { id: _id });
    if (!product) return res.status(404).json({ error: 'Product not found in Sanity' });
    const colors = (Array.isArray(product.colors) ? product.colors : []).map(c => ({
      colorCode: c.colorCode,
      quantity: c.quantity ?? 0
    }));
    const totalQuantity = colors.reduce((sum, c) => sum + (c.quantity ?? 0), 0);
    await Inventory.findOneAndUpdate(
      { productId: product._id },
      {
        title: product.title,
        totalQuantity,
        colors,
        updatedAt: new Date()
      },
      { upsert: true, new: true }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
