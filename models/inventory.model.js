import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema({
  productId: { type: String, required: true }, // _id hoặc slug của product từ Sanity
  title: { type: String }, // tên sản phẩm
  totalQuantity: { type: Number, required: true, default: 0 },
  colors: [
    {
      colorCode: { type: String, required: true },
      sizes: [
        {
          size: { type: String, required: true },
          quantity: { type: Number, required: true, default: 0 }
        }
      ]
    }
  ],
  updatedAt: { type: Date, default: Date.now }
});

const Inventory = mongoose.model('Inventory', inventorySchema, 'inventory');
export default Inventory;
