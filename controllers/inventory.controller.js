import sanityClient from '../config/sanity.config.js';
import Inventory from '../models/inventory.model.js';

// Xử lý đồng bộ hoặc xóa inventory khi có sự kiện từ Sanity webhook
export async function handleSanityInventoryWebhook({ _id, _type, _deleted }) {
  if (_type !== 'product' || !_id) {
    throw new Error('Not a product event or missing _id');
  }
  if (_deleted) {
    // Nếu là xóa sản phẩm, xóa inventory tương ứng
    await Inventory.deleteOne({ productId: _id });
    return { success: true, action: 'delete', message: 'Product deleted from MongoDB' };
  } else {
    // Nếu là tạo/cập nhật sản phẩm, đồng bộ inventory
    const product = await sanityClient.fetch('*[_type == "product" && _id == $id][0]{_id, title, colors}', { id: _id });
    if (!product) throw new Error('Product not found in Sanity');
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
    return { success: true, action: 'sync', message: 'Product synced to MongoDB' };
  }
}
