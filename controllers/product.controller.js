import { getAllProducts, getProductById, createProduct } from '../utils/sanity.js';

// lấy tất cả sản phẩm
export async function getAllProductsController(req, res) {
  try {
    const products = await getAllProducts();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// lấy sản phẩm theo id
export async function getProductByIdController(req, res) {
  try {
    const product = await getProductById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// tạo sản phẩm mới từ sanity
export async function createProductController(req, res) {
  try {
    const newProduct = await createProduct(req.body);
    res.status(201).json(newProduct);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
