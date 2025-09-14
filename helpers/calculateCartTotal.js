import { getProductById } from '../utils/sanity.js';

export async function calculateCartTotal(items) {
  if (!items || items.length === 0) {
    return 0;
  }

  let total = 0;

  for (const item of items) {
    try {
      // Lấy thông tin sản phẩm từ Sanity để đảm bảo giá chính xác
      const product = await getProductById(item.productId);

      if (product && product.price) {
        const itemTotal = product.price * (item.quantity || 1);
        total += itemTotal;
      } else if (item.price) {
        // Fallback nếu không lấy được từ Sanity
        const itemTotal = item.price * (item.quantity || 1);
        total += itemTotal;
      }
    } catch (error) {
      console.error(`Error calculating total for item ${item.productId}:`, error);

      // Fallback sử dụng giá đã lưu trong cart item
      if (item.price) {
        const itemTotal = item.price * (item.quantity || 1);
        total += itemTotal;
      }
    }
  }

  return total;
}