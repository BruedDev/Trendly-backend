import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';

const corsMiddleware = () => {
  const allowedOrigins = [
    process.env.FRONTEND_URL,
    'http://localhost:3000',
    'http://localhost:3001',
    'https://trendly-git-feat-register-vanlocs-projects-7d9c099e.vercel.app',
    // THÊM: Cho phép tất cả Vercel preview URLs
    /^https:\/\/trendly-.*\.vercel\.app$/,
  ].filter(Boolean);

  const corsOptions = {
    origin(origin, callback) {
      if (!origin) {
        // Cho phép các request không có origin (ví dụ: mobile app, curl)
        return callback(null, true);
      }
      const isAllowed = allowedOrigins.some((allowed) => {
        if (typeof allowed === 'string') {
          return allowed === origin;
        }
        if (allowed instanceof RegExp) {
          return allowed.test(origin);
        }
        return false;
      });
      if (isAllowed) {
        return callback(null, true);
      }
      console.error('Blocked CORS origin:', origin);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  };

  return cors(corsOptions);
};

const applyMiddlewares = (app) => {
  app.use(corsMiddleware());
  app.use(cookieParser());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
};

export default applyMiddlewares;
