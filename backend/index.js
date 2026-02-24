import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import mongoose from 'mongoose';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

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
