import jwt from 'jsonwebtoken';
import Order from '../models/order.model.js';
import { getProductById } from '../utils/sanity.js';
import { getInventoryByProductId } from '../utils/inventory.js';

// PayPal service
import { createPaypalOrder, capturePaypalOrder } from '../services/paypal.service.js';

/**
 * Bước 1: Khởi tạo checkout state bằng JWT (giữ thông tin đơn hàng tạm thời)
 */
export const initiateCheckout = async (req, res) => {
  const { products } = req.body;
  const user = req.user;
  const missingFields = req.missingFields || [];

  if (!products || !Array.isArray(products) || products.length === 0) {
    return res.status(400).json({ error: 'Sản phẩm không hợp lệ.' });
  }

  try {
    const productsWithDetails = await Promise.all(products.map(async (p) => {
      const productData = await getProductById(p.productId);
      const imageUrl = p.imageUrl || "/default-image.png";
      const price = typeof productData.price === 'number' ? productData.price : 0;
      const total = price * (p.quantity || 1);
      return {
        productId: p.productId,
        name: productData.title,
        color: p.color,
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

/**
 * Bước 2: Xóa sản phẩm khỏi checkout state, tạo JWT mới
 */
export const removeItem = async (req, res) => {
  const { products, productId, color, size } = req.body;
  const user = req.user;
  const missingFields = req.missingFields || [];

  if (!products || !Array.isArray(products)) {
    return res.status(400).json({ error: 'Danh sách sản phẩm không hợp lệ.' });
  }

  try {
    const filteredProducts = products.filter(
      (p) => !(p.productId === productId && p.color === color && p.size === size)
    );

    const newCheckoutState = jwt.sign(
      {
        userId: user.id,
        products: filteredProducts,
        missingFields
      },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    res.status(200).json({
      products: filteredProducts,
      checkoutState: newCheckoutState
    });

  } catch (error) {
    console.error('Lỗi khi xóa sản phẩm:', error);
    res.status(500).json({ error: 'Lỗi hệ thống khi xóa sản phẩm.' });
  }
};

/**
 * Bước 3: Xác nhận đơn → lưu DB pending → gọi PayPal
 */
export const confirmOrder = async (req, res) => {
  try {
    console.log('Xác nhận đơn - req.body:', req.body);
    console.log('Xác nhận đơn - req.user:', req.user);
    const { products, totalAmount, paymentMethod } = req.body;
    const userId = req.user?._id;

    if (paymentMethod !== 'paypal') {
      console.log('Phương thức thanh toán không phải PayPal:', paymentMethod);
      return res.status(400).json({ error: 'Hiện tại chỉ hỗ trợ PayPal' });
    }

    // Lưu order pending
    const newOrder = await Order.create({
      userId,
      products,
      totalAmount,
      paymentMethod,
      status: 'pending'
    });
    console.log('Order pending đã tạo:', newOrder);

    // Gọi PayPal
    const paymentResponse = await createPaypalOrder(totalAmount);
    console.log('Kết quả gọi PayPal:', paymentResponse);

    // Lưu transactionId = orderId PayPal
    await Order.findByIdAndUpdate(newOrder._id, { transactionId: paymentResponse.id });
    console.log('Đã cập nhật transactionId cho order:', newOrder._id);

    res.status(200).json({
      orderId: newOrder._id,
      payment: paymentResponse
    });

  } catch (error) {
    console.error("confirmOrder error:", error);
    res.status(500).json({ error: "Lỗi khi xác nhận đơn" });
  }
};

/**
 * Bước 4: Success handler cho PayPal redirect
 */
export const handlePaypalSuccess = async (req, res) => {
  try {
    const { token } = req.query; // PayPal orderId từ URL

    if (!token) {
      return res.status(400).json({ error: 'Thiếu token PayPal' });
    }

    const captureData = await capturePaypalOrder(token);

    const updatedOrder = await Order.findOneAndUpdate(
      { transactionId: token },
      {
        status: 'paid',
        paymentData: captureData
      },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });
    }

    res.json({
      success: true,
      message: 'Thanh toán thành công',
      order: updatedOrder,
      paymentData: captureData
    });
  } catch (error) {
    console.error("handlePaypalSuccess error:", error);
    res.status(500).json({ error: "Lỗi khi xác nhận thanh toán PayPal" });
  }
};

/**
 * Bước 5: Callback / Webhook từ PayPal
 */
export const handlePaypalCallback = async (req, res) => {
  try {
    const { token } = req.query; // PayPal orderId
    const captureData = await capturePaypalOrder(token);

    await Order.findOneAndUpdate(
      { transactionId: token },
      { status: 'paid' }
    );

    res.json({ success: true, data: captureData });
  } catch (error) {
    console.error("handlePaypalCallback error:", error);
    res.status(500).json({ error: "Lỗi khi xác nhận thanh toán PayPal" });
  }
};