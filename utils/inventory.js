import Inventory from '../models/inventory.model.js';

// Lấy tồn kho theo productId (và colorCode nếu có)
export async function getInventoryByProductId(productId) {
  return await Inventory.find({ productId });
}

// Lấy tồn kho cho nhiều productId
export async function getInventoryByProductIds(productIds) {
  return await Inventory.find({ productId: { $in: productIds } });
}

// Cập nhật tồn kho
export async function updateInventory(productId, colorCode, quantity) {
  return await Inventory.findOneAndUpdate(
    { productId, colorCode },
    { quantity, updatedAt: new Date() },
    { upsert: true, new: true }
  );
}

// Giảm tồn kho khi bán hàng
export async function decreaseInventory(productId, colorCode, amount = 1) {
  return await Inventory.findOneAndUpdate(
    { productId, colorCode },
    { $inc: { quantity: -amount }, updatedAt: new Date() },
    { new: true }
  );
}
