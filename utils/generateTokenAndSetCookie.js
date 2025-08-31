import jwt from 'jsonwebtoken';

const generateTokenAndSetCookie = (userId, res) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || '1d',
  });

  // Gửi token về cho client thông qua cookie
  res.cookie('accessToken', token, {
    maxAge: 24 * 60 * 60 * 1000, // Thời gian sống của cookie (tính bằng mili giây)
    httpOnly: true, // Ngăn cookie bị truy cập bởi JavaScript phía client -> Chống tấn công XSS
    secure: process.env.NODE_ENV !== 'development', // Chỉ gửi cookie qua kết nối HTTPS
    sameSite: 'none', // Cho phép cookie được gửi trong các yêu cầu cross-domain (FE, BE khác domain)
  });
};

export default generateTokenAndSetCookie;