import express from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import postsRoutes from './posts.routes.js';

const router = express.Router();

router.use('/api/auth', authRoutes);
router.use('/api/user', userRoutes);
router.use('/api/posts', postsRoutes);

export default router;
