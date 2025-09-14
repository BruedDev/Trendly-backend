import jwt from 'jsonwebtoken';
import { getProductById } from '../utils/sanity.js';
import { getInventoryByProductId } from '../utils/inventory.js';

export const initiateCheckout = async (req, res) => {
  const { products } = req.body;
  const user = req.user;
  const missingFields = req.missingFields || [];

  if (!products || !Array.isArray(products) || products.length === 0) {
    return res.status(400).json({ error: 'Sản phẩm không hợp lệ.' });
  }

  try {
    const productsWithDetails = await Promise.all(products.map(async (p) => {
      // Lấy thông tin sản phẩm
      const productData = await getProductById(p.productId);
      // Chỉ sử dụng imageUrl FE gửi lên, không lấy từ colorObj hay productData nữa
      const imageUrl = p.imageUrl || "/default-image.png";
      const price = typeof productData.price === 'number' ? productData.price : 0;
      // Tổng tiền cho sản phẩm này
      const total = price * (p.quantity || 1);
      return {
        productId: p.productId,
        name: productData.title,
        color: p.color, // lấy color từ FE gửi lên
        size: p.size,
        quantity: p.quantity,
        price,
        total,
        imageUrl,
        msp: productData.msp,
      };
    }));

    const checkoutState = jwt.sign(
      {
        userId: user.id,
        products: productsWithDetails,
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

// ✅ Cập nhật removeItem để tạo JWT mới
export const removeItem = async (req, res) => {
  const { products, productId, color, size } = req.body;
  const user = req.user;
  const missingFields = req.missingFields || [];

  if (!products || !Array.isArray(products)) {
    return res.status(400).json({ error: 'Danh sách sản phẩm không hợp lệ.' });
  }

  try {
    // Lọc bỏ sản phẩm cần xóa
    const filteredProducts = products.filter(
      (p) => !(p.productId === productId && p.color === color && p.size === size)
    );

    // ✅ Tạo JWT mới với danh sách sản phẩm đã cập nhật
    const newCheckoutState = jwt.sign(
      {
        userId: user.id,
        products: filteredProducts,
        missingFields
      },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    // ✅ Trả về cả products và checkoutState mới
    res.status(200).json({
      products: filteredProducts,
      checkoutState: newCheckoutState  // JWT mới
    });

  } catch (error) {
    console.error('Lỗi khi xóa sản phẩm:', error);
    res.status(500).json({ error: 'Lỗi hệ thống khi xóa sản phẩm.' });
  }
};