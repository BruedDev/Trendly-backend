
import Theme from '../models/theme.model.js';

// Lưu hoặc cập nhật theme theo uuid
export const saveTheme = async (req, res) => {
  try {
    const { uuid, theme } = req.body;
    if (!uuid || !theme) {
      return res.status(400).json({ message: 'uuid và theme là bắt buộc.' });
    }
    // Tìm và cập nhật hoặc tạo mới
    const result = await Theme.findOneAndUpdate(
      { uuid },
      { theme, updatedAt: new Date() },
      { upsert: true, new: true }
    );
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error });
  }
};
