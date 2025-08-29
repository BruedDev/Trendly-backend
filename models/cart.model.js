import mongoose from 'mongoose';

const CartItemSchema = new mongoose.Schema({
  productId: {
    type: String,
    required: true,
  },
  title: String,
  slug: String,
  price: Number,
  originalPrice: Number,
  thumbnail: {
    defaultImage: {
      asset: {
        url: String,
        alt: String
      },
      alt: String
    },
    hoverImage: {
      asset: {
        url: String,
        alt: String
      },
      alt: String
    }
  },
  categories: [
    {
      title: String,
      slug: String,
      image: {
        asset: {
          url: String,
          alt: String
        },
        alt: String
      }
    }
  ],
  colors: [
    {
      colorCode: String,
      image: {
        asset: {
          url: String,
          alt: String
        },
        alt: String
      }
    }
  ],
  isNew: Boolean,
  isBestseller: Boolean,
  inStock: Boolean,
  quantity: {
    type: Number,
    default: 1,
  },
});

const CartSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  items: [CartItemSchema],
  total: {
    type: Number,
    default: 0,
  }
});

export default mongoose.model('Cart', CartSchema);