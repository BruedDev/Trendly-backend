import Voucher from '../models/voucher.model.js';

// Tạo voucher mới (Admin)
export const createVoucher = async (req, res) => {
  try {
    const voucher = new Voucher(req.body);
    await voucher.save();
    res.status(201).json({
      success: true,
      message: 'Voucher đã được tạo thành công',
      data: voucher
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Lấy tất cả voucher
export const getAllVouchers = async (req, res) => {
  try {
    const { page = 1, limit = 10, isActive } = req.query;
    const query = {};

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const vouchers = await Voucher.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Voucher.countDocuments(query);

    res.json({
      success: true,
      data: vouchers,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Lấy voucher theo ID
export const getVoucherById = async (req, res) => {
  try {
    const voucher = await Voucher.findById(req.params.id);
    if (!voucher) {
      return res.status(404).json({
        success: false,
        error: 'Voucher không tồn tại'
      });
    }
    res.json({
      success: true,
      data: voucher
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Cập nhật voucher
export const updateVoucher = async (req, res) => {
  try {
    const voucher = await Voucher.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!voucher) {
      return res.status(404).json({
        success: false,
        error: 'Voucher không tồn tại'
      });
    }

    res.json({
      success: true,
      message: 'Voucher đã được cập nhật',
      data: voucher
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Xóa voucher
export const deleteVoucher = async (req, res) => {
  try {
    const voucher = await Voucher.findByIdAndDelete(req.params.id);
    if (!voucher) {
      return res.status(404).json({
        success: false,
        error: 'Voucher không tồn tại'
      });
    }
    res.json({
      success: true,
      message: 'Voucher đã được xóa'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Kiểm tra voucher hợp lệ
export const validateVoucher = async (req, res) => {
  try {
    const { code, orderAmount, productIds = [] } = req.body;

    const voucher = await Voucher.findOne({
      code: code.toUpperCase(),
      isActive: true,
      startDate: { $lte: new Date() },
      expiryDate: { $gte: new Date() }
    });

    if (!voucher) {
      return res.status(400).json({
        success: false,
        error: 'Voucher không tồn tại hoặc đã hết hạn'
      });
    }

    if (voucher.usedCount >= voucher.usageLimit) {
      return res.status(400).json({
        success: false,
        error: 'Voucher đã hết lượt sử dụng'
      });
    }

    if (orderAmount < voucher.minOrderAmount) {
      return res.status(400).json({
        success: false,
        error: `Đơn hàng tối thiểu ${voucher.minOrderAmount.toLocaleString('vi-VN')}đ`
      });
    }

    // Kiểm tra sản phẩm áp dụng
    if (voucher.applicableProducts.length > 0) {
      const hasApplicableProduct = productIds.some(id =>
        voucher.applicableProducts.includes(id)
      );
      if (!hasApplicableProduct) {
        return res.status(400).json({
          success: false,
          error: 'Voucher không áp dụng cho sản phẩm này'
        });
      }
    }

    // Tính discount
    let discountAmount = 0;
    if (voucher.discountType === 'percentage') {
      discountAmount = (orderAmount * voucher.discountValue) / 100;
      if (voucher.maxDiscountAmount && discountAmount > voucher.maxDiscountAmount) {
        discountAmount = voucher.maxDiscountAmount;
      }
    } else {
      discountAmount = Math.min(voucher.discountValue, orderAmount);
    }

    res.json({
      success: true,
      data: {
        voucher,
        discountAmount,
        finalAmount: orderAmount - discountAmount
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Sử dụng voucher
export const useVoucher = async (req, res) => {
  try {
    const { code } = req.body;

    const voucher = await Voucher.findOneAndUpdate(
      {
        code: code.toUpperCase(),
        usedCount: { $lt: '$usageLimit' }
      },
      { $inc: { usedCount: 1 } },
      { new: true }
    );

    if (!voucher) {
      return res.status(400).json({
        success: false,
        error: 'Voucher không tồn tại hoặc đã hết lượt sử dụng'
      });
    }

    res.json({
      success: true,
      message: 'Voucher đã được sử dụng',
      data: voucher
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Lấy voucher công khai (cho khách hàng)
export const getPublicVouchers = async (req, res) => {
  try {
    const vouchers = await Voucher.find({
      isActive: true,
      startDate: { $lte: new Date() },
      expiryDate: { $gte: new Date() },
      usedCount: { $lt: '$usageLimit' }
    })
      .select('code name description discountType discountValue minOrderAmount maxDiscountAmount expiryDate')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      data: vouchers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ============ CÁC FUNCTION TỰ ĐỘNG TẠO VOUCHER ============

// Tạo voucher chào mừng người dùng mới
export const createWelcomeVoucher = async (userId) => {
  try {
    const welcomeVoucher = new Voucher({
      code: `WELCOME${userId.slice(-4).toUpperCase()}`,
      name: 'Voucher chào mừng thành viên mới',
      description: 'Giảm 10% cho đơn hàng đầu tiên',
      discountType: 'percentage',
      discountValue: 10,
      minOrderAmount: 100000,
      maxDiscountAmount: 50000,
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 ngày
      usageLimit: 1
    });

    await welcomeVoucher.save();
    return welcomeVoucher;
  } catch (error) {
    console.error('Error creating welcome voucher:', error);
    return null;
  }
};

// Tạo voucher sinh nhật
export const createBirthdayVoucher = async (userId) => {
  try {
    const birthdayVoucher = new Voucher({
      code: `HAPPY${userId.slice(-4).toUpperCase()}${Date.now().toString().slice(-3)}`,
      name: 'Voucher sinh nhật',
      description: 'Giảm 15% nhân dịp sinh nhật',
      discountType: 'percentage',
      discountValue: 15,
      minOrderAmount: 200000,
      maxDiscountAmount: 100000,
      expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 ngày
      usageLimit: 1
    });

    await birthdayVoucher.save();
    return birthdayVoucher;
  } catch (error) {
    console.error('Error creating birthday voucher:', error);
    return null;
  }
};

// Tạo voucher khách hàng thân thiết
export const createLoyaltyVoucher = async (userId, orderCount) => {
  try {
    let discountValue = 20000;
    let name = 'Voucher khách hàng thân thiết';

    if (orderCount >= 10) {
      discountValue = 50000;
      name = 'Voucher VIP - Khách hàng kim cương';
    } else if (orderCount >= 5) {
      discountValue = 30000;
      name = 'Voucher khách hàng vàng';
    }

    const loyaltyVoucher = new Voucher({
      code: `LOYAL${userId.slice(-4).toUpperCase()}${orderCount}${Date.now().toString().slice(-2)}`,
      name: name,
      description: `Cảm ơn bạn đã mua ${orderCount} đơn hàng`,
      discountType: 'fixed',
      discountValue: discountValue,
      minOrderAmount: 300000,
      expiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 ngày
      usageLimit: 1
    });

    await loyaltyVoucher.save();
    return loyaltyVoucher;
  } catch (error) {
    console.error('Error creating loyalty voucher:', error);
    return null;
  }
};

// Tạo voucher đơn hàng đầu tiên
export const createFirstOrderVoucher = async (userId) => {
  try {
    const firstOrderVoucher = new Voucher({
      code: `FIRST${userId.slice(-4).toUpperCase()}${Date.now().toString().slice(-3)}`,
      name: 'Voucher đơn hàng đầu tiên',
      description: 'Giảm 20k cho đơn hàng đầu tiên',
      discountType: 'fixed',
      discountValue: 20000,
      minOrderAmount: 150000,
      expiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 ngày
      usageLimit: 1
    });

    await firstOrderVoucher.save();
    return firstOrderVoucher;
  } catch (error) {
    console.error('Error creating first order voucher:', error);
    return null;
  }
};

// Tự động xóa voucher hết hạn
export const cleanupExpiredVouchers = async () => {
  try {
    const result = await Voucher.deleteMany({
      expiryDate: { $lt: new Date() },
      usedCount: 0
    });

    console.log(`Đã xóa ${result.deletedCount} voucher hết hạn`);
    return result;
  } catch (error) {
    console.error('Error cleaning up expired vouchers:', error);
    return null;
  }
};