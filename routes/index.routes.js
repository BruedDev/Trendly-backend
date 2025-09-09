
import express from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import productsRoutes from './product.routes.js';
import cartRoutes from './cart.routes.js';
import sanityWebhookRoutes from './sanity-webhook.routes.js';
import payRoutes from './pay.routes.js';

const router = express.Router();

router.use('/api/auth', authRoutes);
router.use('/api/user', userRoutes);
router.use('/api/products', productsRoutes);
router.use('/api/cart', cartRoutes);
router.use('/api/pay', payRoutes);
router.use('/api/webhook', sanityWebhookRoutes);

export default router;
