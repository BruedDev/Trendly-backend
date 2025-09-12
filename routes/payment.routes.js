import express from 'express';
import { initiateCheckout, removeItem } from '../controllers/payment.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { checkUserInfo } from '../middlewares/checkUserInfo.middleware.js';

const router = express.Router();
// kiểm tra user và mã hóa phiên giao dịch

// Xóa sản phẩm
router.delete('/remove-item', authenticateToken, removeItem);

router.post('/initiate-checkout', authenticateToken, checkUserInfo, initiateCheckout);

export default router;

