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
import staffRatingRoutes from './routes/staffRatingRoutes.js';
import staffPerformanceRoutes from './routes/staffPerformanceRoutes.js';
import liveChatRoutes from './routes/liveChatRoutes.js';
import ChatSession from './models/ChatSession.js';

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
app.use('/api/staff-ratings', staffRatingRoutes);
app.use('/api/org-admin/staff-performance', staffPerformanceRoutes);
app.use('/api/live-chat', liveChatRoutes);

// Socket.IO
const io = new Server(server, {
  cors: { origin: 'http://localhost:5173', methods: ['GET', 'POST'] },
});

// Socket events
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('join_staff_org', (payload) => {
    const orgId = payload?.orgId;
    if (!orgId) return;
    socket.join(`org:${orgId}:staff`);
  });

  socket.on('join_room', async (payload) => {
    const roomId = typeof payload === 'string' ? payload : payload?.roomId || payload?.room;
    if (!roomId) return;

    socket.join(roomId);
    socket.data.roomId = roomId;
    socket.data.chatMeta = typeof payload === 'object' && payload ? payload : {};

    try {
      const session = await ChatSession.findOneAndUpdate(
        { roomId },
        {
          $setOnInsert: { roomId },
          $set: {
            orgId: socket.data.chatMeta.orgId || undefined,
            customerId: socket.data.chatMeta.customerId || undefined,
            staffId: socket.data.chatMeta.staffId || undefined,
          },
        },
        { upsert: true, new: true }
      )
        .populate('customerId', 'name email')
        .populate('staffId', 'name email');

      const orgId = socket.data.chatMeta.orgId;
      if (orgId) io.to(`org:${orgId}:staff`).emit('chat_session_updated', session);
    } catch (err) {
      console.error('Failed to initialize chat session:', err);
    }

    console.log(`User ${socket.id} joined room ${roomId}`);
  });

  socket.on('send_message', async (data) => {
    console.log(`[ROOM ${data.room}] ${data.author}: ${data.message}`);
    try {
      const roomId = data.room || socket.data.roomId;
      if (roomId && data.message) {
        const meta = socket.data.chatMeta || {};
        const role = data.role || meta.role || (
          String(data.author || '').toLowerCase().includes('staff') ? 'staff' : 'unknown'
        );
        const session = await ChatSession.findOneAndUpdate(
          { roomId },
          {
            $setOnInsert: { roomId },
            $set: {
              orgId: data.orgId || meta.orgId || undefined,
              customerId: data.customerId || meta.customerId || undefined,
              staffId: data.staffId || meta.staffId || undefined,
              lastMessageAt: new Date(),
            },
            $push: {
              messages: {
                author: data.author,
                role,
                message: data.message,
                sentAt: data.sentAt ? new Date(data.sentAt) : new Date(),
              },
            },
          },
          { upsert: true, new: true }
        )
          .populate('customerId', 'name email')
          .populate('staffId', 'name email');

        const orgId = data.orgId || meta.orgId;
        if (orgId) io.to(`org:${orgId}:staff`).emit('chat_session_updated', session);
      }
    } catch (err) {
      console.error('Failed to persist chat message:', err);
    }
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
