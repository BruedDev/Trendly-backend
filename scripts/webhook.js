import sanityClient from '../config/sanity.config.js';
import Inventory from '../models/inventory.model.js';
import Cart from '../models/cart.model.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Script đồng bộ inventory và cart từ Sanity sang MongoDB
export async function sanityWebhookLocal() {
  console.log('📦 Đang lấy dữ liệu từ Sanity...');

  // Lấy tất cả sản phẩm từ Sanity với đầy đủ thông tin
  const products = await sanityClient.fetch(`
    *[_type == "product"]{
      _id,
      title,
      price,
      colors,
      images
    }
  `);
  console.log(`📊 Tìm thấy ${products.length} sản phẩm từ Sanity`);
  console.log('🆔 Sanity Product IDs:', products.map(p => p._id));

  const sanityProductIds = products.map(p => p._id);

  // Tạo map để dễ tìm kiếm thông tin sản phẩm
  const productMap = {};
  products.forEach(product => {
    productMap[product._id] = product;
  });

  // --- ĐỒNG BỘ INVENTORY ---
  console.log('🔄 Đồng bộ Inventory...');
  const mongoInventories = await Inventory.find({}, 'productId');
  const mongoProductIds = mongoInventories.map(inv => inv.productId);
  const deletedProductIds = mongoProductIds.filter(id => !sanityProductIds.includes(id));

  if (deletedProductIds.length > 0) {
    await Inventory.deleteMany({ productId: { $in: deletedProductIds } });
    console.log(`🗑️  Đã xóa tồn kho các sản phẩm không còn trên Sanity:`, deletedProductIds);
  }

  let updatedCount = 0;
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
    updatedCount++;
  }
  console.log(`✅ Đã cập nhật ${updatedCount} sản phẩm vào Inventory`);

  // --- ĐỒNG BỘ CART ---
  console.log('🛒 Đồng bộ Cart...');
  const carts = await Cart.find({});
  console.log(`📋 Tìm thấy ${carts.length} giỏ hàng trong MongoDB`);

  let updatedCarts = 0;

  for (const cart of carts) {
    console.log(`\n🔍 Xử lý cart của user: ${cart.userId}`);
    console.log(`📦 Cart có ${cart.items.length} items`);

    let hasChanges = false;
    const originalLength = cart.items.length;

    // Lọc các item không còn tồn tại trên Sanity
    const validItems = [];

    for (const item of cart.items) {
      const exists = sanityProductIds.includes(item.productId);
      console.log(`   Item: ${item.productId} - ${exists ? '✅ Còn tồn tại' : '❌ Không tồn tại'} trên Sanity`);

      if (exists) {
        // Cập nhật thông tin item từ Sanity
        const sanityProduct = productMap[item.productId];
        const updatedItem = {
          ...item.toObject(),
          title: sanityProduct.title,
          // Cập nhật price nếu có
          price: sanityProduct.price || item.price,
          updatedAt: new Date()
        };

        // So sánh xem có thay đổi không
        if (item.title !== sanityProduct.title ||
          item.price !== sanityProduct.price) {
          hasChanges = true;
          console.log(`   🔄 Cập nhật thông tin: ${item.title} → ${sanityProduct.title}`);
        }

        validItems.push(updatedItem);
      } else {
        hasChanges = true;
      }
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

      console.log(`🛒 ĐÃ CẬP NHẬT cart user ${cart.userId}:`);
      console.log(`   📊 Items: ${originalLength} → ${cart.items.length}`);
      console.log(`   💰 Total: ${oldTotal} → ${total}`);

      if (originalLength !== cart.items.length) {
        console.log(`   🗑️  Đã xóa ${originalLength - cart.items.length} items không tồn tại`);
      }
    } else {
      // FORCE UPDATE - cập nhật updatedAt dù không có thay đổi
      cart.updatedAt = new Date();
      await cart.save();
      updatedCarts++;
      console.log(`🔄 FORCE UPDATE cart của user ${cart.userId} (cập nhật updatedAt)`);
    }
  }

  console.log(`\n✅ Đã xử lý ${updatedCarts}/${carts.length} giỏ hàng`);
  console.log('🎉 Đồng bộ tồn kho và giỏ hàng từ Sanity sang MongoDB thành công!');
}

// Function để test local
async function runTestSync() {
  try {
    // Kết nối MongoDB
    console.log('🔌 Đang kết nối MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/your-database');
    console.log('✅ Đã kết nối MongoDB thành công');

    // Chạy sync webhook
    console.log('🚀 Bắt đầu đồng bộ Sanity với MongoDB...');
    await sanityWebhookLocal();
    console.log('🎊 Hoàn thành tất cả!');

  } catch (error) {
    console.error('❌ Lỗi khi đồng bộ:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    // Đóng kết nối
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('🔐 Đã đóng kết nối MongoDB');
    }
    process.exit(0);
  }
}

// Chạy function
runTestSync();