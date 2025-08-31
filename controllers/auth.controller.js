import User from '../models/user.model.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const login = async (req, res) => {
  try {
    console.log('=== PRODUCTION DEBUG ===');
    console.log('Origin:', req.headers.origin);
    console.log('Environment:', process.env.NODE_ENV);
    console.log('User-Agent:', req.headers['user-agent']);

    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email và password là bắt buộc.' });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng.' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng.' });
    }
    const token = jwt.sign(
      { _id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || '1d' }
    );

    // ---- SỬA Ở ĐÂY ----
    res.cookie('token', token, {
      httpOnly: true,
      secure: isProduction || isVercelPreview,
      sameSite: isCrossDomain ? 'none' : 'lax',
      maxAge: 24 * 60 * 60 * 1000,
      path: '/',
    });
    // ---- KẾT THÚC SỬA ----

    return res.json({ success: true, user: { email: user.email, _id: user._id } });
  } catch (err) {
    return res.status(500).json({ error: 'Lỗi server', details: err.message });
  }
};

export const register = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email và password là bắt buộc.' });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: 'Email đã tồn tại.' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashedPassword });
    await user.save();
    return res.status(201).json({ success: true, user: { email: user.email, _id: user._id } });
  } catch (err) {
    return res.status(500).json({ error: 'Lỗi server', details: err.message });
  }
};