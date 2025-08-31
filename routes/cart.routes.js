import express from 'express';
import { addToCart, getCart, deleteItemCart } from '../controllers/cart.controller.js';

const router = express.Router();

// Thêm sản phẩm vào giỏ hàng
router.post('/add', addToCart);

// Lấy giỏ hàng
router.get('/getCart', getCart);

// Xóa sản phẩm khỏi giỏ hàng
router.delete('/deleteItem', deleteItemCart);

export default router;