import express from 'express';
import { addToCart, getCart } from '../controllers/cart.controller.js';

const router = express.Router();

// Thêm sản phẩm vào giỏ hàng
router.post('/add', addToCart);

// Lấy giỏ hàng
router.get('/getCart', getCart);

export default router;