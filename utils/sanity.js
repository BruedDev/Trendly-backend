import sanityClient from '../config/sanity.config.js';

// Lấy tất cả bài đăng
export async function getAllPosts() {
  const query = '*[_type == "post"] | order(_createdAt desc)';
  return await sanityClient.fetch(query);
}

// Lấy bài đăng theo ID
export async function getPostById(id) {
  const query = '*[_type == "post" && _id == $id][0]';
  return await sanityClient.fetch(query, { id });
}

// Tạo bài đăng mới
export async function createPost(postData) {
  return await sanityClient.create({ ...postData, _type: 'post' });
}
