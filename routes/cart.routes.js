import express from 'express';
import {
  addToCart,
  getCart,
  removeItemFromCart,
  updateQuantity
} from '../controllers/cart.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Thêm sản phẩm vào giỏ hàng
router.post('/add', authenticateToken, addToCart);

// Xoá sản phẩm khỏi giỏ hàng
router.delete('/remove', authenticateToken, removeItemFromCart);

// Lấy giỏ hàng
router.get('/getCart', authenticateToken, getCart);

// Cập nhật số lượng sản phẩm (tăng/giảm)
router.patch('/update-quantity', authenticateToken, updateQuantity);

export default router;