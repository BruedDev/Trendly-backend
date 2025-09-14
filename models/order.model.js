import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  products: { type: Array, required: true },
  totalAmount: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['paypal', 'momo', 'vnpay', 'zalopay'], required: true },
  status: { type: String, enum: ['pending', 'paid', 'failed', 'canceled'], default: 'pending' },
  transactionId: { type: String },
}, { timestamps: true });

export default mongoose.model('Order', orderSchema);
