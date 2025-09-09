import express from 'express';
import { createVoucher, getAllVouchers, validateVoucher, useVoucher } from '../controllers/voucher.controller.js';

const router = express.Router();

// Tạo mới một voucher (Admin)
router.post('/create', createVoucher);

// Lấy danh sách tất cả voucher (Admin)
router.get('/all', getAllVouchers);

// Kiểm tra voucher hợp lệ (Khách hàng nhập mã để kiểm tra trước khi thanh toán)
router.post('/validate', validateVoucher);

// Đánh dấu voucher đã sử dụng (Khách hàng sử dụng voucher thành công)
router.post('/use', useVoucher);

export default router;