import dotenv from 'dotenv';
dotenv.config();
// In index.js, right after dotenv.config() on line 2:
console.log('MONGO_URI:', process.env.MONGO_URI);


import express from 'express';
import mongoose from 'mongoose';
import healthRoutes from './routes/healthRoutes.js';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import orgAdminRoutes from './routes/orgAdminRoutes.js';
import staffRoutes from './routes/staffRoutes.js';
import * as billingRoutes from './routes/billingRoutes.js';

const app = express();
const PORT = process.env.PORT || 3000;

import path from 'path';

// Webhooks must be parsed as raw buffers, so this goes BEFORE express.json()
app.use('/api/billing/webhook', express.raw({ type: 'application/json' }), billingRoutes.webhookRouter);

// Middleware
app.use(express.json());
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Routes
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/org-admin', orgAdminRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/billing', billingRoutes.apiRouter);

app.get('/', (req, res) => {
  res.send('Welcome to the Customer Support Platform API');
});

// Start server
const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
};

startServer();
