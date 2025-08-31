dotenv.config();

import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import applyMiddlewares from './middlewares/cors.middleware.js';
import connectDB from './config/db.config.js';
import routes from './routes/index.routes.js';
import { connectSanity } from './config/sanity.config.js';

dotenv.config();

const app = express();

// Kết nối database
connectDB();

// Kết nối Sanity
connectSanity();

// Cookie parser
app.use(cookieParser());

// Áp dụng middleware
applyMiddlewares(app);

// Áp dụng routes
app.use(routes);

// Route test
app.get('/', (req, res) => {
  res.send('API Trendly đang hoạt động');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy trên cổng ${PORT}`);
});

export default app;