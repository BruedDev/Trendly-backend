import sanityClient from '../config/sanity.config.js';
import Inventory from '../models/inventory.model.js';
import Cart from '../models/cart.model.js';

export async function sanityWebhook() {
  const products = await sanityClient.fetch(`
    *[_type == "product"]{
      _id,
      title,
      price,
      colors,
      images
    }
  `);

  const sanityProductIds = products.map(p => p._id);

  // Tạo map để dễ tìm kiếm thông tin sản phẩm
  const productMap = {};
  products.forEach(product => {
    productMap[product._id] = product;
  });

  // --- ĐỒNG BỘ INVENTORY ---
  const mongoInventories = await Inventory.find({}, 'productId');
  const mongoProductIds = mongoInventories.map(inv => inv.productId);
  const deletedProductIds = mongoProductIds.filter(id => !sanityProductIds.includes(id));

  if (deletedProductIds.length > 0) {
    await Inventory.deleteMany({ productId: { $in: deletedProductIds } });
  }

  let updatedCount = 0;
  for (const product of products) {
    // Lấy đúng cấu trúc sizes cho từng màu
    const colors = (Array.isArray(product.colors) ? product.colors : []).map(c => {
      let sizes = [];
      if (Array.isArray(c.sizes)) {
        sizes = c.sizes.map(s => ({
          size: s.size,
          quantity: s.quantity ?? 0
        }));
      }
      return {
        colorCode: c.colorCode,
        sizes
      };
    });

    // Tính tổng quantity cho toàn bộ sản phẩm
    const totalQuantity = colors.reduce((sum, color) => {
      return sum + color.sizes.reduce((sSum, s) => sSum + (s.quantity ?? 0), 0);
    }, 0);

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
    updatedCount++;
  }

  // --- ĐỒNG BỘ CART ---
  const carts = await Cart.find({});
  let updatedCarts = 0;

  for (const cart of carts) {
    let hasChanges = false;
    const originalLength = cart.items.length;

    // Lọc các item không còn tồn tại trên Sanity hoặc màu không còn
    const validItems = [];

    for (const item of cart.items) {
      const productExists = sanityProductIds.includes(item.productId);
      const sanityProduct = productMap[item.productId];

      // Kiểm tra sản phẩm có tồn tại không
      if (!productExists) {
        hasChanges = true;
        continue; // Bỏ qua item này
      }

      // Kiểm tra màu có còn tồn tại không
      const colorExists = sanityProduct.colors &&
        sanityProduct.colors.some(c => c.colorCode === item.colorCode);

      if (!colorExists) {
        hasChanges = true;
        continue; // Bỏ qua item này
      }

      // Cập nhật thông tin item từ Sanity
      const selectedColor = sanityProduct.colors.find(c => c.colorCode === item.colorCode);

      const updatedItem = {
        ...item.toObject(),
        title: sanityProduct.title,
        price: sanityProduct.price || item.price,
        selectedColor: selectedColor || item.selectedColor,
        updatedAt: new Date()
      };

      // So sánh xem có thay đổi không
      if (item.title !== sanityProduct.title ||
        item.price !== sanityProduct.price ||
        !item.selectedColor ||
        item.selectedColor.colorCode !== selectedColor?.colorCode) {
        hasChanges = true;
      }

      validItems.push(updatedItem);
    }

    // Cập nhật cart
    cart.items = validItems;

    // Tính lại total
    let total = 0;
    for (const item of cart.items) {
      if (typeof item.price === 'number') {
        total += item.price * (item.quantity || 1);
      }
    }

    const oldTotal = cart.total;
    cart.total = total;

    // Kiểm tra xem có thay đổi không
    if (hasChanges || cart.items.length !== originalLength || oldTotal !== total) {
      cart.updatedAt = new Date();
      await cart.save();
      updatedCarts++;

      if (originalLength !== cart.items.length) {
        console.log(`Cart ${cart.userId}: Removed ${originalLength - cart.items.length} invalid items`);
      }
    } else {
      // FORCE UPDATE - cập nhật updatedAt dù không có thay đổi
      cart.updatedAt = new Date();
      await cart.save();
      updatedCarts++;
    }
  }

  console.log(`Sync completed:
    - Updated ${updatedCount} inventory records
    - Updated ${updatedCarts} carts
    - Removed inventory for ${deletedProductIds.length} deleted products`);
}