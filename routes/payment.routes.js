import express from 'express';
import { createPayment, capturePayment } from '../controllers/payment.controller.js';

const router = express.Router();

router.post('/create-payment', createPayment);
router.post('/capture-payment', capturePayment);

export default router;