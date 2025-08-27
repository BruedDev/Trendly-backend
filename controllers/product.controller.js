import { getAllProducts, getProductById, createProduct } from '../utils/sanity.js';
import { getInventoryByProductIds, getInventoryByProductId } from '../utils/inventory.js';

// lấy tất cả sản phẩm
export async function getAllProductsController(req, res) {
  try {
    const products = await getAllProducts();
    const productIds = products.map(p => p._id);
    const inventories = await getInventoryByProductIds(productIds);
    // Map inventory theo productId+colorCode
    const inventoryMap = {};
    inventories.forEach(inv => {
      if (!inventoryMap[inv.productId]) inventoryMap[inv.productId] = [];
      inventoryMap[inv.productId].push(inv);
    });
    // Ẩn sản phẩm hết hàng (tất cả inventory = 0)
    const filteredProducts = products.filter(p => {
      const invs = inventoryMap[p._id] || [];
      // Nếu có tồn kho > 0 cho bất kỳ màu nào thì hiển thị
      return invs.some(inv => inv.quantity > 0);
    }).map(p => {
      // merge inventory vào product
      return {
        ...p,
        inventory: inventoryMap[p._id] || []
      };
    });
    res.json(filteredProducts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// lấy sản phẩm theo id
export async function getProductByIdController(req, res) {
  try {
    const product = await getProductById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    const inventory = await getInventoryByProductId(product._id);
    // Nếu tất cả inventory = 0 thì coi như hết hàng
    if (!inventory.some(inv => inv.quantity > 0)) {
      return res.status(404).json({ error: 'Product out of stock' });
    }
    res.json({ ...product, inventory });
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
