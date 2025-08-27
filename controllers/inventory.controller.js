import sanityClient from '../config/sanity.config.js';
import Inventory from '../models/inventory.model.js';

// Script đồng bộ inventory từ Sanity sang MongoDB

export async function syncInventoryFromSanity() {
  // Lấy tất cả sản phẩm từ Sanity (có title và colors.quantity)
  const products = await sanityClient.fetch('*[_type == "product"]{_id, title, colors}');
  const sanityProductIds = products.map(p => p._id);

  // Lấy tất cả productId hiện có trong MongoDB
  const mongoInventories = await Inventory.find({}, 'productId');
  const mongoProductIds = mongoInventories.map(inv => inv.productId);

  // Tìm các productId đã bị xóa trên Sanity nhưng còn trong MongoDB
  const deletedProductIds = mongoProductIds.filter(id => !sanityProductIds.includes(id));

  // Xóa các productId này khỏi MongoDB
  if (deletedProductIds.length > 0) {
    await Inventory.deleteMany({ productId: { $in: deletedProductIds } });
    console.log(`Đã xóa tồn kho các sản phẩm không còn trên Sanity:`, deletedProductIds);
  }

  // Giữ nguyên logic hiện tại để cập nhật/thêm sản phẩm
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

