// controllers/posts.controller.js
import { getAllPosts, getPostById, createPost } from '../utils/sanity.js';

export async function getAllPostsController(req, res) {
  try {
    const posts = await getAllPosts();
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
export async function getPostByIdController(req, res) {
  try {
    const post = await getPostById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}


export async function createPostController(req, res) {
  try {
    const newPost = await createPost(req.body);
    res.status(201).json(newPost);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
