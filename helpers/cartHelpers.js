import Inventory from '../models/inventory.model.js';

// Helper function để tạo unique cart item identifier
export const getCartItemKey = (productId, colorCode) => `${productId}_${colorCode}`;

// Helper function để kiểm tra tồn kho theo màu
export async function checkColorStock(productId, colorCode, size, requestedQuantity = 1) {
  const inventory = await Inventory.findOne({ productId });

  if (!inventory) {
    return { inStock: false, availableQuantity: 0 };
  }

  const colorInventory = inventory.colors.find(c => c.colorCode === colorCode);
  if (!colorInventory) {
    return { inStock: false, availableQuantity: 0 };
  }

  const sizeInventory = colorInventory.sizes?.find(s => s.size === size);
  if (!sizeInventory) {
    return { inStock: false, availableQuantity: 0 };
  }

  return {
    inStock: sizeInventory.quantity >= requestedQuantity,
    availableQuantity: sizeInventory.quantity
  };
}
