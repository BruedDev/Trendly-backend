import express from 'express';
import { addToCart, getCart, removeItemFromCart } from '../controllers/cart.controller.js';

const router = express.Router();

// Thêm sản phẩm vào giỏ hàng
router.post('/add', addToCart);

// Xoá sản phẩm khỏi giỏ hàng
router.delete('/remove', removeItemFromCart);

// Lấy giỏ hàng
router.get('/getCart', getCart);

export default router;