import Cart from '../models/cart.model.js';
import { getProductById } from '../utils/sanity.js';

// Hàm tính tổng tiền
async function calculateCartTotal(cartItems) {
  let total = 0;

  for (const item of cartItems) {
    const product = await getProductById(item.productId);
    if (product && product.price) {
      total += product.price * item.quantity;
    }
  }

  return total;
}

export async function addToCart(req, res) {
  const { productId } = req.body;
  const userId = req.user?._id || 'demo-user';

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

export async function getCart(req, res) {
  const userId = req.user?._id || 'demo-user';

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