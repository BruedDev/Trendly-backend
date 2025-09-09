import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema({
  productId: { type: String, required: true },
  title: { type: String },
  slug: { type: String }, // THÊM FIELD SLUG
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