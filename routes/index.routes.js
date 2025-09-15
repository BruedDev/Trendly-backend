

import express from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import productsRoutes from './product.routes.js';
import cartRoutes from './cart.routes.js';
import sanityWebhookRoutes from './sanity-webhook.routes.js';
import paymentRoutes from './payment.routes.js';
import voucherRoutes from './voucher.routes.js';
import orderRoutes from './order.routes.js';

const router = express.Router();

router.use('/api/auth', authRoutes);
router.use('/api/user', userRoutes);
router.use('/api/products', productsRoutes);
router.use('/api/cart', cartRoutes);
router.use('/api/pay', paymentRoutes);
router.use('/api/voucher', voucherRoutes);
router.use('/api/webhook', sanityWebhookRoutes);
router.use('/api/order', orderRoutes);

export default router;
