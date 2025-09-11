import User from '../models/user.model.js';

export const checkUserInfo = async (req, res, next) => {
  try {
    const fullUser = await User.findById(req.user._id);
    if (!fullUser) {
      // Nếu không tìm thấy user trong DB (dù token hợp lệ), đây là trường hợp bất thường.
      // Dừng request và báo lỗi.
      return res.status(404).json({ error: 'Người dùng không tồn tại.' });
    }

    const missingFields = [];
    if (!fullUser.phone) {
      missingFields.push('phone');
    }
    if (!fullUser.address) {
      missingFields.push('address');
    }

    // Gắn danh sách các trường còn thiếu vào đối tượng req
    req.missingFields = missingFields;
    next();
  } catch (error) {
    console.error('Lỗi trong middleware checkUserInfo:', error);
    // Nếu có lỗi khi truy vấn DB, dừng request và báo lỗi hệ thống.
    res.status(500).json({ error: 'Lỗi máy chủ khi kiểm tra thông tin người dùng.' });
  }
};

