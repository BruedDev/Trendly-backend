import express from 'express';
import {
  initiateCheckout,
  removeItem,
  confirmOrder,
  handlePaypalCallback,
  handlePaypalSuccess,
} from '../controllers/payment.controller.js';

import { authenticateToken } from '../middlewares/auth.middleware.js';
import { checkUserInfo } from '../middlewares/checkUserInfo.middleware.js';
import { verifyPaypalWebhook } from '../middlewares/verifySignature.middleware.js';

const router = express.Router();

// ✅ Bước chuẩn bị checkout
router.post('/initiate-checkout', authenticateToken, checkUserInfo, initiateCheckout);

// ✅ Xóa sản phẩm trong checkout
router.delete('/remove-item', authenticateToken, removeItem);

// ✅ Xác nhận đơn → tạo order pending → gọi cổng thanh toán
router.post('/confirm', authenticateToken, checkUserInfo, confirmOrder);

// ✅ Callback PayPal (webhook)
router.post('/paypal/webhook', verifyPaypalWebhook, handlePaypalCallback);

// ✅ Success handler cho PayPal redirect
router.get('/paypal/success', handlePaypalSuccess);

export default router;