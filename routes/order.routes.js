
import express from 'express';
import { deleteAllOrders } from '../controllers/order.controller.js';
const router = express.Router();

// Route xóa toàn bộ đơn hàng (chỉ dùng cho test)
router.delete('/delete-all', deleteAllOrders);

export default router;
