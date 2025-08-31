import generateTokenAndSetCookie from '../utils/generateTokenAndSetCookie.js';
import User from '../models/user.model.js';
import asyncHandler from 'express-async-handler';

export const Login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // --- BẮT ĐẦU PHẦN CODE ADMIN TEST ---
  // Nếu email và password là 'admin', xử lý đăng nhập admin ngay lập tức
  if (email === 'admin@gmail.com' && password === 'admin') {
    // Tạo token cho admin, userId có thể là một chuỗi định danh bất kỳ
    generateTokenAndSetCookie('admin_id_test', res);
    console.log('Admin login thành công:', email);
    // Trả về thông tin admin giả để test
    return res.status(200).json({
      _id: 'admin_id_test',
      name: 'Admin User',
      email: 'admin',
      role: 'admin' // Thêm vai trò để FE biết đây là admin
    });
  }
  // --- KẾT THÚC PHẦN CODE ADMIN TEST ---


  // Logic đăng nhập cho người dùng thông thường
  const user = await User.findOne({ email });

  // Kiểm tra user tồn tại và mật khẩu đúng
  if (user && (await user.matchPassword(password))) {
    generateTokenAndSetCookie(user._id, res);
    console.log('User login thành công:', email);
    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role
    });
  } else {
    res.status(401);
    throw new Error('Email hoặc mật khẩu không hợp lệ');
  }
});