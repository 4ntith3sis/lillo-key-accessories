import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import { env } from './config/env.js';

import healthRoutes from './routes/healthRoutes.js';
import productRoutes from './routes/productRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import authRoutes from './routes/authRoutes.js';
import homepageRoutes from './routes/homepageRoutes.js';
import aboutRoutes from './routes/aboutRoutes.js';
import cmsRoutes from './routes/cmsRoutes.js';
import productImageRoutes from './routes/productImageRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// Ensure local uploads directory exists (for dev static files if needed)
const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  try {
    fs.mkdirSync(uploadsDir, { recursive: true });
  } catch (_err) {
    // Ignore in read-only serverless environments
  }
}

// Dynamic CORS configuration allowing frontend domain and local development
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or same-origin serverless)
      if (!origin) return callback(null, true);
      if (
        origin === env.frontendUrl ||
        origin.endsWith('.vercel.app') ||
        origin.includes('localhost')
      ) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive in portfolio mode for easy testing
    },
    credentials: true,
  })
);

app.use(cookieParser());
// Raised limit: admin uploads send base64 data-URI images (5MB file ≈ 6.8MB JSON)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/uploads', express.static(uploadsDir));

// API Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/homepage', homepageRoutes);
app.use('/api/about', aboutRoutes);
app.use('/api/cms', cmsRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/product-images', productImageRoutes);
app.use('/api/admin', adminRoutes);

// Root Endpoint Info
app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'LILLO Express REST API Server',
    version: '1.0.0',
    endpoints: [
      '/api/health',
      '/api/health/appwrite',
      '/api/products',
      '/api/categories',
      '/api/inventory',
      '/api/product-images',
      '/api/admin/dashboard',
    ],
  });
});

// 404 & Error Handling Middlewares
app.use(notFound);
app.use(errorHandler);

export default app;
