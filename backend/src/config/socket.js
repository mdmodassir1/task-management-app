import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

let io;

export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      console.log('Socket auth - Token received:', token ? 'Yes' : 'No');
      
      if (!token) {
        console.log('No token provided');
        return next(new Error('Authentication error: No token'));
      }
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      
      if (!user) {
        console.log('User not found');
        return next(new Error('Authentication error: User not found'));
      }
      
      socket.userId = decoded.id;
      socket.user = user;
      console.log(`Socket authenticated for user: ${user.email}`);
      next();
    } catch (err) {
      console.log('Socket auth error:', err.message);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🟢 User connected: ${socket.userId}`);

    // Join project room
    socket.on('join-project', (projectId) => {
      socket.join(`project:${projectId}`);
      console.log(`User ${socket.userId} joined project: ${projectId}`);
      
      // Notify others in the room
      socket.to(`project:${projectId}`).emit('user-joined', {
        userId: socket.userId,
        userEmail: socket.user?.email,
        timestamp: new Date(),
      });
    });

    // Leave project room
    socket.on('leave-project', (projectId) => {
      socket.leave(`project:${projectId}`);
      console.log(`User ${socket.userId} left project: ${projectId}`);
    });

    // Task created
    socket.on('task:created', (data) => {
      console.log(`Task created: ${data.task._id} in project: ${data.projectId}`);
      socket.to(`project:${data.projectId}`).emit('task:created', data);
    });

    // Task updated
    socket.on('task:updated', (data) => {
      console.log(`Task updated: ${data.task._id} in project: ${data.projectId}`);
      socket.to(`project:${data.projectId}`).emit('task:updated', data);
    });

    // Task deleted
    socket.on('task:deleted', (data) => {
      console.log(`Task deleted: ${data.taskId} in project: ${data.projectId}`);
      socket.to(`project:${data.projectId}`).emit('task:deleted', data);
    });

    // Task moved
    socket.on('task:moved', (data) => {
      console.log(`Task moved: ${data.taskId} from ${data.sourceCol} to ${data.targetCol}`);
      socket.to(`project:${data.projectId}`).emit('task:moved', data);
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`🔴 User disconnected: ${socket.userId}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};