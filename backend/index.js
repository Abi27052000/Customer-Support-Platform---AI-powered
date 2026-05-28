import dotenv from 'dotenv';
dotenv.config();
// In index.js, right after dotenv.config() on line 2:
console.log('MONGO_URI:', process.env.MONGO_URI);

import express from 'express';
import mongoose from 'mongoose';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors'; 
import path from 'path';

import healthRoutes from './routes/healthRoutes.js';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import orgAdminRoutes from './routes/orgAdminRoutes.js';
import staffRoutes from './routes/staffRoutes.js';
import conversationSummaryRoutes from './routes/conversationSummaryRoutes.js';
import * as billingRoutes from './routes/billingRoutes.js';
import requestsRoutes from './routes/requestsRoutes.js';
import ragDocumentRoutes from './routes/ragDocumentRoutes.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Webhooks must be parsed as raw buffers, so this goes BEFORE express.json()
app.use('/api/billing/webhook', express.raw({ type: 'application/json' }), billingRoutes.webhookRouter);

// Middleware
// Enable CORS for the frontend (adjust FRONTEND_URL in .env if needed)
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'] }));
app.use(express.json({ limit: '1mb' }));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// MongoDB connection
const connectDB = async () => {
  if (!process.env.MONGO_URI) return console.log('Mongo URI not set');
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

// Create HTTP server
const server = http.createServer(app);
// Routes
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/org-admin', orgAdminRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/conversation-summaries', conversationSummaryRoutes);
app.use('/api/billing', billingRoutes.apiRouter);
app.use('/api/requests', requestsRoutes);
app.use('/api/org-admin/rag-documents', ragDocumentRoutes);

// Socket.IO
const io = new Server(server, {
  cors: { origin: 'http://localhost:5173', methods: ['GET', 'POST'] },
});

// Socket events
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);
  });

  socket.on('send_message', (data) => {
    console.log(`[ROOM ${data.room}] ${data.author}: ${data.message}`);
    io.in(data.room).emit('receive_message', data);
  });

  socket.on('disconnect', () => console.log(`User disconnected: ${socket.id}`));
});

// Test route
app.get('/', (req, res) => res.send('Server running'));

// Start server
const startServer = async () => {
  await connectDB();
  server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
};

startServer();
