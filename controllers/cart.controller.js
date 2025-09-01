import Cart from '../models/cart.model.js';
import { getProductById } from '../utils/sanity.js';
import { calculateCartTotal } from '../helpers/calculateCartTotal.js';

// Thêm sản phẩm vào giỏ hàng
export async function addToCart(req, res) {
  const { productId } = req.body;
  const userId = req.user?._id;

  if (!userId) {
    return res.status(401).json({ error: 'Bạn cần đăng nhập để sử dụng chức năng này.' });
  }

  if (!productId) {
    return res.status(400).json({ error: 'productId is required' });
  }

  try {
    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = new Cart({ userId, items: [{ productId, quantity: 1 }] });
      cart.total = await calculateCartTotal(cart.items);
      await cart.save();
    } else {
      const existingIndex = cart.items.findIndex(item => item.productId === productId);

      if (existingIndex !== -1) {
        if (cart.items[existingIndex].quantity >= 10) {
          return res.status(400).json({
            error: 'Sản phẩm này đã đạt tối đa 10 sản phẩm trong giỏ hàng'
          });
        }

        cart = await Cart.findOneAndUpdate(
          { userId, "items.productId": productId },
          { $inc: { "items.$.quantity": 1 } },
          { new: true }
        );
      } else {
        cart = await Cart.findOneAndUpdate(
          { userId },
          { $push: { items: { productId, quantity: 1 } } },
          { new: true }
        );
      }

      // Tính lại total
      cart.total = await calculateCartTotal(cart.items);
      await cart.save();
    }

    return res.json({ success: true, cart });
  } catch (err) {
    return res.status(500).json({ error: 'Lỗi server', details: err.message });
  }
}

// Cập nhật số lượng sản phẩm (tăng/giảm)
export async function updateQuantity(req, res) {
  const { productId, quantity } = req.body;
  const userId = req.user?._id;

  if (!userId) {
    return res.status(401).json({ error: 'Bạn cần đăng nhập để sử dụng chức năng này.' });
  }

  if (!productId || quantity === undefined) {
    return res.status(400).json({ error: 'productId và quantity are required' });
  }

  // Giới hạn quantity từ 1 đến 10
  if (quantity < 1 || quantity > 10) {
    return res.status(400).json({ error: 'Số lượng phải từ 1 đến 10' });
  }

  try {
    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({ error: 'Không tìm thấy giỏ hàng' });
    }

    const itemIndex = cart.items.findIndex(item => item.productId === productId);

    if (itemIndex === -1) {
      return res.status(404).json({ error: 'Sản phẩm không tồn tại trong giỏ hàng' });
    }

    // Cập nhật quantity
    const updatedCart = await Cart.findOneAndUpdate(
      { userId, "items.productId": productId },
      { $set: { "items.$.quantity": quantity } },
      { new: true }
    );

    // Tính lại total
    updatedCart.total = await calculateCartTotal(updatedCart.items);
    await updatedCart.save();

    return res.json({ success: true, cart: updatedCart });
  } catch (err) {
    return res.status(500).json({ error: 'Lỗi server', details: err.message });
  }
}

// Lấy giỏ hàng
export async function getCart(req, res) {
  const userId = req.user?._id;

  if (!userId) {
    return res.status(401).json({ error: 'Bạn cần đăng nhập để sử dụng chức năng này.' });
  }

  try {
    const cart = await Cart.findOne({ userId });

    if (!cart || !cart.items.length) {
      return res.json({ cart: [], total: 0 });
    }

    const detailedItems = await Promise.all(
      cart.items.map(async (item) => {
        const product = await getProductById(item.productId);
        return {
          ...item.toObject(),
          product,
        };
      })
    );

    // Đảm bảo total được tính đúng
    cart.total = await calculateCartTotal(cart.items);
    await cart.save();

    return res.json({
      cart: detailedItems,
      total: cart.total
    });
  } catch (err) {
    return res.status(500).json({ error: 'Lỗi server', details: err.message });
  }
}

// Xóa sản phẩm khỏi giỏ hàng
export async function removeItemFromCart(req, res) {
  const { productId } = req.body;
  const userId = req.user?._id;

  if (!userId) {
    return res.status(401).json({ error: 'Bạn cần đăng nhập để sử dụng chức năng này.' });
  }

  if (!productId) {
    return res.status(400).json({ error: 'productId is required' });
  }

  try {
    let cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({ error: 'Không tìm thấy giỏ hàng' });
    }

    const itemIndex = cart.items.findIndex(item => item.productId === productId);

    if (itemIndex === -1) {
      return res.status(404).json({ error: 'Sản phẩm không tồn tại trong giỏ hàng' });
    }

    cart.items.splice(itemIndex, 1);
    cart.total = await calculateCartTotal(cart.items);
    await cart.save();

    return res.json({ success: true, cart });
  } catch (err) {
    return res.status(500).json({ error: 'Lỗi server', details: err.message });
  }
}