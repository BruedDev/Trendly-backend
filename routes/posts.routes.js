import express from 'express';
import {
  getAllPostsController,
  getPostByIdController,
  createPostController
} from '../controllers/posts.controller.js';

const router = express.Router();

// Get all posts
router.get('/posts', getAllPostsController);

// Get post by ID
router.get('/posts/:id', getPostByIdController);

// Create a new post
router.post('/posts', createPostController);

export default router;
