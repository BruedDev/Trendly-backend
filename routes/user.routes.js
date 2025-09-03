import express from 'express';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { AccountUser } from '../controllers/user.controller.js';

const router = express.Router();

router.get('/AccountUser', authenticateToken, AccountUser);

export default router;