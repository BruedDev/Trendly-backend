import express from 'express';
import { register, login } from '../controllers/auth.controller.js';

const router = express.Router();

// Đăng ký user mới
router.post('/register', register);

// Đăng nhập user
router.post('/login', login);

export default router;