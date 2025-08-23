
import express from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import productsRoutes from './product.routes.js';
import themeRoutes from './theme.routes.js';

const router = express.Router();


router.use('/api/auth', authRoutes);
router.use('/api/user', userRoutes);
router.use('/api/products', productsRoutes);
router.use('/api/theme', themeRoutes);

export default router;
