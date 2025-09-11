import express from 'express';
import { initiateCheckout } from '../controllers/payment.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { checkUserInfo } from '../middlewares/checkUserInfo.middleware.js';

const router = express.Router();
// kiểm tra user và mã hóa phiên giao dịch
router.post('/initiate-checkout', authenticateToken, checkUserInfo, initiateCheckout
);

export default router;

