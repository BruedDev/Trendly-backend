import dotenv from 'dotenv';
import { createClient } from '@sanity/client';
dotenv.config();

const projectId = process.env.SANITY_PROJECT_ID;
const dataset = process.env.SANITY_DATASET;
const apiVersion = process.env.SANITY_API_VERSION;
const token = process.env.SANITY_API_TOKEN;

if (!projectId) throw new Error('Missing SANITY_PROJECT_ID in environment variables');
if (!dataset) throw new Error('Missing SANITY_DATASET in environment variables');
if (!apiVersion) throw new Error('Missing SANITY_API_VERSION in environment variables');

const sanityClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  token,
});

export default sanityClient;

export async function connectSanity() {
  try {
    await sanityClient.fetch('*[_type == "post"][0]{_id}');
    console.log('Kết nối Sanity thành công');
  } catch (err) {
    console.error('Kết nối Sanity thất bại:', err.message);
    throw err;
  }
}
