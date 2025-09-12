import express from 'express';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { AccountUser, editProfile } from '../controllers/user.controller.js';

const router = express.Router();

router.get('/AccountUser', authenticateToken, AccountUser);
router.put('/editProfile', authenticateToken, editProfile);

export default router;