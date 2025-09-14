import sanityClient from '../config/sanity.config.js';

// Lấy tất cả sản phẩm
export async function getAllProducts() {
  const query = '*[_type == "product"] | order(_createdAt desc)';
  return await sanityClient.fetch(query);
}

// Lấy sản phẩm theo ID
export async function getProductById(id) {
  // Lấy product và populate categories (image, slug, title)
  const query = `*[_type == "product" && _id == $id][0]{
    ...,
    categories[]-> {
      image,
      slug,
      title
    }
  }`;
  return await sanityClient.fetch(query, { id });
}

// Tạo sản phẩm mới
export async function createProduct(productData) {
  return await sanityClient.create({ ...productData, _type: 'product' });
}
