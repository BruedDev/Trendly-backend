import Theme from '../models/theme.model.js';

// Lưu hoặc cập nhật theme cho user ẩn danh: chỉ có 2 bản ghi (dark, light)
export const saveTheme = async (req, res) => {
  try {
    const { theme } = req.body;
    if (!theme || (theme !== 'dark' && theme !== 'light')) {
      return res.status(400).json({ message: 'theme là bắt buộc và chỉ nhận dark hoặc light.' });
    }
    // Tìm và cập nhật hoặc tạo mới theo theme
    const result = await Theme.findOneAndUpdate(
      { theme },
      { updatedAt: new Date() },
      { upsert: true, new: true }
    );
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error });
  }
};
