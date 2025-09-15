import Order from '../models/order.model.js';

// Xóa toàn bộ đơn hàng - chỉ dùng cho mục đích test
export const deleteAllOrders = async (req, res) => {
  try {
    await Order.deleteMany({});
    res.status(200).json({ message: 'Đã xóa toàn bộ đơn hàng.' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi xóa đơn hàng.', error });
  }
};
