
import sanityClient from '../config/sanity.config.js';
import Inventory from '../models/inventory.model.js';
import Cart from '../models/cart.model.js';

// Script đồng bộ inventory và cart từ Sanity sang MongoDB

export async function sanityWebhook() {
  // Lấy tất cả sản phẩm từ Sanity (có title và colors.quantity)
  const products = await sanityClient.fetch('*[_type == "product"]{_id, title, colors}');
  const sanityProductIds = products.map(p => p._id);

  // --- ĐỒNG BỘ INVENTORY ---
  const mongoInventories = await Inventory.find({}, 'productId');
  const mongoProductIds = mongoInventories.map(inv => inv.productId);
  const deletedProductIds = mongoProductIds.filter(id => !sanityProductIds.includes(id));
  if (deletedProductIds.length > 0) {
    await Inventory.deleteMany({ productId: { $in: deletedProductIds } });
    console.log(`Đã xóa tồn kho các sản phẩm không còn trên Sanity:`, deletedProductIds);
  }
  for (const product of products) {
    const colors = (Array.isArray(product.colors) ? product.colors : []).map(c => ({
      colorCode: c.colorCode,
      quantity: c.quantity ?? 0
    }));
    const totalQuantity = colors.reduce((sum, c) => sum + (c.quantity ?? 0), 0);
    await Inventory.findOneAndUpdate(
      { productId: product._id },
      {
        title: product.title,
        totalQuantity,
        colors,
        updatedAt: new Date()
      },
      { upsert: true, new: true }
    );
  }


  // --- ĐỒNG BỘ CART ---
  // Xóa các cart item có productId không còn trên Sanity và tính lại total
  const carts = await Cart.find({});
  for (const cart of carts) {
    const originalLength = cart.items.length;
    // Lọc lại các item còn tồn tại trên Sanity
    cart.items = cart.items.filter(item => sanityProductIds.includes(item.productId));
    if (cart.items.length !== originalLength) {
      // Tính lại total dựa trên các item còn lại
      let total = 0;
      for (const item of cart.items) {
        // Nếu có trường price trong item thì dùng, không thì bỏ qua (hoặc có thể fetch lại giá từ Sanity nếu muốn)
        if (typeof item.price === 'number') {
          total += item.price * (item.quantity || 1);
        }
      }
      cart.total = total;
      await cart.save();
      console.log(`Đã xóa các sản phẩm không còn trên Sanity khỏi giỏ hàng của user ${cart.userId}`);
    }
  }

  console.log('Đồng bộ tồn kho và giỏ hàng từ Sanity sang MongoDB thành công!');
}

