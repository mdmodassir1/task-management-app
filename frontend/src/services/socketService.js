import { io } from 'socket.io-client';

let socket = null;

export const initializeSocket = (token) => {
  if (socket) {
    return socket;
  }
  
  socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
    auth: { token },
    transports: ['websocket'],
  });
  
  socket.on('connect', () => {
    console.log('🔌 Socket connected:', socket.id);
  });
  
  socket.on('disconnect', () => {
    console.log('🔌 Socket disconnected');
  });
  
  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
  });
  
  return socket;
};

export const getSocket = () => {
  if (!socket) {
    throw new Error('Socket not initialized. Call initializeSocket first.');
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const joinProjectRoom = (projectId) => {
  if (socket && projectId) {
    socket.emit('join-project', projectId);
    console.log('Joined project room:', projectId);
  }
};

export const leaveProjectRoom = (projectId) => {
  if (socket && projectId) {
    socket.emit('leave-project', projectId);
    console.log('Left project room:', projectId);
  }
};

export const emitTaskCreated = (task, projectId) => {
  if (socket) {
    socket.emit('task:created', { task, projectId });
  }
};

export const emitTaskUpdated = (task, projectId) => {
  if (socket) {
    socket.emit('task:updated', { task, projectId });
  }
};

export const emitTaskDeleted = (taskId, projectId) => {
  if (socket) {
    socket.emit('task:deleted', { taskId, projectId });
  }
};

export const emitTaskMoved = (taskId, sourceCol, targetCol, projectId) => {
  if (socket) {
    socket.emit('task:moved', { taskId, sourceCol, targetCol, projectId });
  }
};