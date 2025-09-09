import sanityClient from '../config/sanity.config.js';
import Inventory from '../models/inventory.model.js';
import Cart from '../models/cart.model.js';

/**
 * Lấy tất cả sản phẩm từ Sanity
 */
async function fetchProductsFromSanity() {
  return await sanityClient.fetch(`
    *[_type == "product"]{
      _id,
      title,
      "slug": slug.current,
      price,
      colors,
      images
    }
  `);
}

/**
 * Tạo product map để dễ tìm kiếm
 */
function createProductMap(products) {
  const productMap = {};
  products.forEach(product => {
    productMap[product._id] = product;
  });
  return productMap;
}

/**
 * Xử lý colors và sizes từ Sanity data
 */
function processProductColors(colors) {
  return (Array.isArray(colors) ? colors : []).map(color => {
    let sizes = [];
    if (Array.isArray(color.sizes)) {
      sizes = color.sizes.map(size => ({
        size: size.size,
        quantity: size.quantity ?? 0
      }));
    }
    return {
      colorCode: color.colorCode,
      sizes
    };
  });
}

/**
 * Tính tổng quantity cho sản phẩm
 */
function calculateTotalQuantity(colors) {
  return colors.reduce((sum, color) => {
    return sum + color.sizes.reduce((sSum, size) => sSum + (size.quantity ?? 0), 0);
  }, 0);
}

/**
 * Đồng bộ Inventory
 */
async function syncInventory(products) {
  console.log('🔄 Starting inventory sync...');

  const sanityProductIds = products.map(p => p._id);

  // Xóa các sản phẩm không còn tồn tại trên Sanity
  const mongoInventories = await Inventory.find({}, 'productId');
  const mongoProductIds = mongoInventories.map(inv => inv.productId);
  const deletedProductIds = mongoProductIds.filter(id => !sanityProductIds.includes(id));

  if (deletedProductIds.length > 0) {
    await Inventory.deleteMany({ productId: { $in: deletedProductIds } });
    console.log(`🗑️  Removed ${deletedProductIds.length} deleted products from inventory`);
  }

  // Cập nhật/tạo mới inventory
  let updatedCount = 0;
  for (const product of products) {
    const colors = processProductColors(product.colors);
    const totalQuantity = calculateTotalQuantity(colors);

    await Inventory.findOneAndUpdate(
      { productId: product._id },
      {
        title: product.title,
        slug: product.slug,
        totalQuantity,
        colors,
        updatedAt: new Date()
      },
      { upsert: true, new: true }
    );
    updatedCount++;
  }

  console.log(`✅ Updated ${updatedCount} inventory records`);
  return { updatedCount, deletedCount: deletedProductIds.length };
}

/**
 * Validate cart item
 */
function validateCartItem(item, sanityProductIds, productMap) {
  const productExists = sanityProductIds.includes(item.productId);
  if (!productExists) return { isValid: false, reason: 'Product not exists' };

  const sanityProduct = productMap[item.productId];
  const colorExists = sanityProduct.colors &&
    sanityProduct.colors.some(c => c.colorCode === item.colorCode);

  if (!colorExists) return { isValid: false, reason: 'Color not exists' };

  return { isValid: true, sanityProduct };
}

/**
 * Update cart item với thông tin từ Sanity
 */
function updateCartItem(item, sanityProduct) {
  const selectedColor = sanityProduct.colors.find(c => c.colorCode === item.colorCode);

  return {
    ...item.toObject(),
    title: sanityProduct.title,
    slug: sanityProduct.slug,
    price: sanityProduct.price || item.price,
    selectedColor: selectedColor || item.selectedColor,
    updatedAt: new Date()
  };
}

/**
 * Kiểm tra cart item có thay đổi không
 */
function hasCartItemChanged(item, sanityProduct, selectedColor) {
  return (
    item.title !== sanityProduct.title ||
    item.slug !== sanityProduct.slug ||
    item.price !== sanityProduct.price ||
    !item.selectedColor ||
    item.selectedColor.colorCode !== selectedColor?.colorCode
  );
}

/**
 * Tính tổng giá trị cart
 */
function calculateCartTotal(items) {
  return items.reduce((total, item) => {
    if (typeof item.price === 'number') {
      return total + (item.price * (item.quantity || 1));
    }
    return total;
  }, 0);
}

/**
 * Đồng bộ Cart
 */
async function syncCarts(products) {
  console.log('🛒 Starting cart sync...');

  const sanityProductIds = products.map(p => p._id);
  const productMap = createProductMap(products);

  const carts = await Cart.find({});
  let updatedCarts = 0;

  for (const cart of carts) {
    let hasChanges = false;
    const originalLength = cart.items.length;
    const validItems = [];

    for (const item of cart.items) {
      const validation = validateCartItem(item, sanityProductIds, productMap);

      if (!validation.isValid) {
        hasChanges = true;
        continue; // Bỏ qua item không hợp lệ
      }

      // Cập nhật thông tin item
      const updatedItem = updateCartItem(item, validation.sanityProduct);
      const selectedColor = validation.sanityProduct.colors.find(c => c.colorCode === item.colorCode);

      // Kiểm tra có thay đổi không
      if (hasCartItemChanged(item, validation.sanityProduct, selectedColor)) {
        hasChanges = true;
      }

      validItems.push(updatedItem);
    }

    // Cập nhật cart
    cart.items = validItems;
    const newTotal = calculateCartTotal(cart.items);
    const oldTotal = cart.total;
    cart.total = newTotal;

    // Lưu cart nếu có thay đổi
    if (hasChanges || cart.items.length !== originalLength || oldTotal !== newTotal) {
      cart.updatedAt = new Date();
      await cart.save();
      updatedCarts++;

      if (originalLength !== cart.items.length) {
        console.log(`🧹 Cart ${cart.userId}: Removed ${originalLength - cart.items.length} invalid items`);
      }
    } else {
      // Force update timestamp
      cart.updatedAt = new Date();
      await cart.save();
      updatedCarts++;
    }
  }

  console.log(`✅ Updated ${updatedCarts} carts`);
  return { updatedCount: updatedCarts };
}

/**
 * Log sample data để debug
 */
async function logSampleData() {
  const sampleInventory = await Inventory.findOne({});
  console.log('📄 Sample inventory after sync:', JSON.stringify(sampleInventory, null, 2));
}

/**
 * Chạy full sync từ Sanity sang MongoDB
 */
async function runFullSync() {
  try {
    console.log('🚀 Starting Sanity to MongoDB sync...');

    const products = await fetchProductsFromSanity();
    console.log(`📦 Fetched ${products.length} products from Sanity`);

    if (products.length > 0) {
      console.log('Sample product:', JSON.stringify(products[0], null, 2));
    }

    const inventoryResult = await syncInventory(products);
    const cartResult = await syncCarts(products);

    const result = {
      inventoryUpdated: inventoryResult.updatedCount,
      inventoryDeleted: inventoryResult.deletedCount,
      cartsUpdated: cartResult.updatedCount,
      totalProducts: products.length
    };

    console.log('🎉 Sync completed:', result);
    return result;

  } catch (error) {
    console.error('❌ Sync failed:', error);
    throw error;
  }
}

export default {
  fetchProductsFromSanity,
  createProductMap,
  processProductColors,
  calculateTotalQuantity,
  syncInventory,
  syncCarts,
  runFullSync,
  logSampleData
};