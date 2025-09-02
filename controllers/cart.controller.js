import Cart from '../models/cart.model.js';
import { getProductById } from '../utils/sanity.js';
import { calculateCartTotal } from '../helpers/calculateCartTotal.js';
import { checkColorStock } from '../helpers/cartHelpers.js';

// Thêm sản phẩm vào giỏ hàng
export async function addToCart(req, res) {
  const { productId, colorCode } = req.body;
  const userId = req.user?._id;

  if (!userId) {
    return res.status(401).json({ error: 'Bạn cần đăng nhập để sử dụng chức năng này.' });
  }

  if (!productId || !colorCode) {
    return res.status(400).json({ error: 'productId và colorCode là bắt buộc' });
  }

  try {
    // Lấy thông tin sản phẩm từ Sanity
    const { size } = req.body;
    const product = await getProductById(productId);
    const selectedColor = product.colors?.find(c => c.colorCode === colorCode);

    // Lấy size mặc định là size đầu tiên nếu không truyền lên
    let defaultSize = size;
    if (!defaultSize) {
      if (selectedColor?.sizes && selectedColor.sizes.length > 0) {
        defaultSize = selectedColor.sizes[0].size;
      } else {
        return res.status(400).json({ error: 'Không tìm thấy size cho màu này' });
      }
    }

    // Kiểm tra tồn kho trước khi thêm vào cart
    const stockCheck = await checkColorStock(productId, colorCode, defaultSize, 1);
    if (!stockCheck.inStock) {
      return res.status(400).json({
        error: 'Sản phẩm màu/size này đã hết hàng hoặc không đủ số lượng',
        availableQuantity: stockCheck.availableQuantity
      });
    }

    // Tạo selectedColor object với đầy đủ thông tin
    const selectedColorObj = {
      colorCode: colorCode,
      image: selectedColor?.image || null
    };

    let cart = await Cart.findOne({ userId });

    if (!cart) {
      // Tạo cart mới
      cart = new Cart({
        userId,
        items: [{
          productId,
          colorCode,
          size: defaultSize,
          quantity: 1,
          selectedColor: selectedColorObj
        }]
      });
      cart.total = await calculateCartTotal(cart.items);
      await cart.save();
    } else {
      // Tìm item với cùng productId, colorCode và size
      const existingIndex = cart.items.findIndex(item =>
        item.productId === productId && item.colorCode === colorCode && item.size === defaultSize
      );

      if (existingIndex !== -1) {
        const newQuantity = cart.items[existingIndex].quantity + 1;

        // Kiểm tra giới hạn 10 sản phẩm
        if (newQuantity > 10) {
          return res.status(400).json({
            error: 'Sản phẩm này đã đạt tối đa 10 sản phẩm trong giỏ hàng'
          });
        }

        // Kiểm tra tồn kho với số lượng mới
        const stockCheck = await checkColorStock(productId, colorCode, defaultSize, newQuantity);
        if (!stockCheck.inStock) {
          return res.status(400).json({
            error: `Chỉ còn ${stockCheck.availableQuantity} sản phẩm màu/size này trong kho`,
            availableQuantity: stockCheck.availableQuantity
          });
        }

        // Cập nhật quantity VÀ selectedColor để đảm bảo có đầy đủ thông tin
        cart = await Cart.findOneAndUpdate(
          { userId, "items.productId": productId, "items.colorCode": colorCode, "items.size": defaultSize },
          {
            $inc: { "items.$.quantity": 1 },
            $set: { "items.$.selectedColor": selectedColorObj }
          },
          { new: true }
        );
      } else {
        // Thêm item mới
        cart = await Cart.findOneAndUpdate(
          { userId },
          {
            $push: {
              items: {
                productId,
                colorCode,
                size: defaultSize,
                quantity: 1,
                selectedColor: selectedColorObj
              }
            }
          },
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
  const { productId, colorCode, quantity, size } = req.body;
  const userId = req.user?._id;

  if (!userId) {
    return res.status(401).json({ error: 'Bạn cần đăng nhập để sử dụng chức năng này.' });
  }

  if (!productId || !colorCode || quantity === undefined) {
    return res.status(400).json({ error: 'productId, colorCode và quantity là bắt buộc' });
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

    // Tìm item trong cart
    const itemIndex = cart.items.findIndex(item =>
      item.productId === productId && item.colorCode === colorCode && item.size === size
    );

    if (itemIndex === -1) {
      return res.status(404).json({ error: 'Sản phẩm không tồn tại trong giỏ hàng' });
    }

    // Lấy size từ item hiện tại nếu không được truyền
    const itemSize = size || cart.items[itemIndex].size;

    // Kiểm tra tồn kho
    const stockCheck = await checkColorStock(productId, colorCode, itemSize, quantity);
    if (!stockCheck.inStock) {
      return res.status(400).json({
        error: `Chỉ còn ${stockCheck.availableQuantity} sản phẩm màu/size này trong kho`,
        availableQuantity: stockCheck.availableQuantity
      });
    }

    // Cập nhật quantity
    const updatedCart = await Cart.findOneAndUpdate(
      { userId, "items.productId": productId, "items.colorCode": colorCode, "items.size": itemSize },
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

        // Lấy size từ item, nếu không có thì lấy size đầu tiên từ color
        let itemSize = item.size;
        if (!itemSize) {
          const selectedColor = product.colors?.find(c => c.colorCode === item.colorCode);
          if (selectedColor?.sizes && selectedColor.sizes.length > 0) {
            itemSize = selectedColor.sizes[0].size;
          }
        }

        // Kiểm tra tồn kho hiện tại
        const stockCheck = await checkColorStock(item.productId, item.colorCode, itemSize, item.quantity);

        return {
          ...item.toObject(),
          product,
          size: itemSize, // Đảm bảo size được trả về
          stockInfo: {
            inStock: stockCheck.inStock,
            availableQuantity: stockCheck.availableQuantity
          }
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
  const { productId, colorCode, size } = req.body;
  const userId = req.user?._id;

  if (!userId) {
    return res.status(401).json({ error: 'Bạn cần đăng nhập để sử dụng chức năng này.' });
  }

  if (!productId || !colorCode) {
    return res.status(400).json({ error: 'productId và colorCode là bắt buộc' });
  }

  try {
    let cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({ error: 'Không tìm thấy giỏ hàng' });
    }

    // Tìm item với productId, colorCode và size (nếu có)
    const itemIndex = cart.items.findIndex(item =>
      item.productId === productId &&
      item.colorCode === colorCode &&
      (!size || item.size === size) // Nếu size được truyền thì phải match, nếu không thì bỏ qua
    );

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