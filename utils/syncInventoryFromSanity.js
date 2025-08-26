import sanityClient from '../config/sanity.config.js';
import Inventory from '../models/inventory.model.js';

// Script đồng bộ inventory từ Sanity sang MongoDB

export async function syncInventoryFromSanity() {
  // Lấy tất cả sản phẩm từ Sanity (có title và colors.quantity)
  const products = await sanityClient.fetch('*[_type == "product"]{_id, title, colors}');
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
  console.log('Đồng bộ tồn kho từ Sanity sang MongoDB thành công!');
}

