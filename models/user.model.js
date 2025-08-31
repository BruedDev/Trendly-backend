import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    phoneNumber: {
      type: String,
      trim: true,
    },
    address: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      // Bạn có thể thêm các trường khác như district, country nếu cần
    },
    role: {
      type: String,
      enum: ['user', 'admin'], // Chỉ cho phép 2 giá trị này
      default: 'user', // Mặc định là 'user'
    },
    // Bạn có thể thêm các trường khác như avatar, wishlist, etc.
  },
  {
    timestamps: true, // Tự động thêm createdAt và updatedAt
  }
);

// Middleware: Mã hóa mật khẩu trước khi lưu
userSchema.pre('save', async function (next) {
  // Chỉ mã hóa nếu mật khẩu được sửa đổi (hoặc là user mới)
  if (!this.isModified('password')) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method: So sánh mật khẩu người dùng nhập với mật khẩu đã mã hóa trong DB
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;