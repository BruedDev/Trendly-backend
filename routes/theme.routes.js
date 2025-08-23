import express from 'express';
import { saveTheme } from '../controllers/theme.controller.js';

const router = express.Router();

// Route để lưu hoặc cập nhật theme theo uuid
router.post('/theme', saveTheme);

export default router;
