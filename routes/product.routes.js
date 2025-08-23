import express from 'express';
import {
  getAllProductsController,
  getProductByIdController,
  createProductController
} from '../controllers/product.controller.js';

const router = express.Router();

// Get all products
router.get('/getAllProducts', getAllProductsController);

// Get product by ID
router.get('/getProductById/:id', getProductByIdController);

// Create a new product
router.post('/createProduct', createProductController);

export default router;
