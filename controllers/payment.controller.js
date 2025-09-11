import jwt from 'jsonwebtoken';

export const initiateCheckout = (req, res) => {
  const { products } = req.body;
  const user = req.user;
  // Lấy danh sách các trường còn thiếu từ middleware
  const missingFields = req.missingFields || [];

  if (!products || !Array.isArray(products) || products.length === 0) {
    return res.status(400).json({ error: 'Sản phẩm không hợp lệ.' });
  }

  try {
    // Tạo một mã token (state) để bảo vệ phiên thanh toán.
    // Token này chứa thông tin người dùng, sản phẩm, và các trường thông tin còn thiếu.
    // Token có hiệu lực trong 15 phút.
    const checkoutState = jwt.sign(
      {
        userId: user.id,
        products,
        missingFields
      },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    res.status(200).json({ checkoutState });
  } catch (error) {
    console.error('Lỗi khi khởi tạo thanh toán:', error);
    res.status(500).json({ error: 'Lỗi hệ thống khi khởi tạo thanh toán.' });
  }
};



