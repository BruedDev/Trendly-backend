import express from 'express';
// import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

// // Route ví dụ: lấy thông tin user đã đăng nhập
// router.get('/me', authenticateToken, (req, res) => {
//   res.json({ user: req.user });
// });

export default router;