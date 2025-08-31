import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import User from '../models/user.model.js';

const requireAuth = asyncHandler(async (req, res, next) => {
  let token;

  // 1. Đọc token từ httpOnly cookie
  token = req.cookies.accessToken;

  if (token) {
    try {
      // 2. Xác thực token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 3. Tìm người dùng trong DB bằng ID từ token, không lấy mật khẩu
      req.user = await User.findById(decoded.userId).select('-password');

      // Nếu không tìm thấy user (ví dụ: user đã bị xóa trong DB)
      if (!req.user) {
        res.status(401);
        throw new Error('Người dùng không tồn tại');
      }

      // 4. Token hợp lệ, cho phép request đi tiếp
      next();
    } catch (error) {
      console.error(error);
      res.status(401);
      throw new Error('Không được phép, token không hợp lệ');
    }
  }

  if (!token) {
    res.status(401);
    throw new Error('Không được phép, vui lòng đăng nhập');
  }
});

export { requireAuth };