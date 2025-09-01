import { getProductById } from '../utils/sanity.js';

// Hàm tính tổng tiền
export async function calculateCartTotal(cartItems) {
  if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
    return 0;
  }

  let total = 0;

  for (const item of cartItems) {
    try {
      const product = await getProductById(item.productId);
      if (product && product.price && typeof product.price === 'number') {
        total += product.price * item.quantity;
      }
    } catch (error) {
      console.error(`Error fetching product ${item.productId}:`, error);
      // Tiếp tục với sản phẩm khác thay vì throw error
    }
  }

  return Math.round(total * 100) / 100; // Làm tròn 2 chữ số thập phân
}

export default calculateCartTotal;