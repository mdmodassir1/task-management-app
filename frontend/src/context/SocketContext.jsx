import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [realTimeEvents, setRealTimeEvents] = useState([]);

  useEffect(() => {
    if (isAuthenticated && user) {
      const token = localStorage.getItem('token');
      const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
      
      const newSocket = io(socketUrl, {
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
      });
      
      setSocket(newSocket);
      
      newSocket.on('connect', () => {
        console.log('🔌 Socket connected:', newSocket.id);
      });
      
      newSocket.on('disconnect', () => {
        console.log('🔌 Socket disconnected');
      });
      
      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error.message);
      });
      
      newSocket.on('user-joined', (data) => {
        setOnlineUsers(prev => [...prev, data.userId]);
      });
      
      // Activity events
      newSocket.on('activity:new', (activity) => {
        console.log('📋 New activity:', activity);
        setRealTimeEvents(prev => [activity, ...prev].slice(0, 20));
        // Optional: Show toast for important activities
        if (activity.action === 'member_added') {
          toast.info(`${activity.user?.name} added a new member`);
        } else if (activity.action === 'task_created') {
          toast.info(`New task created: ${activity.details.title}`);
        }
      });
      
      // Task events
      newSocket.on('task:created', (data) => {
        console.log('📋 Task created:', data);
      });
      
      newSocket.on('task:deleted', (data) => {
        console.log('📋 Task deleted:', data);
      });
      
      newSocket.on('task:moved', (data) => {
        console.log('📋 Task moved:', data);
      });
      
      newSocket.on('comment:added', (data) => {
        console.log('📋 Comment added:', data);
      });
      
      newSocket.on('comment:deleted', (data) => {
        console.log('📋 Comment deleted:', data);
      });
      
      return () => {
        newSocket.off('connect');
        newSocket.off('disconnect');
        newSocket.off('connect_error');
        newSocket.off('user-joined');
        newSocket.off('activity:new');
        newSocket.off('task:created');
        newSocket.off('task:deleted');
        newSocket.off('task:moved');
        newSocket.off('comment:added');
        newSocket.off('comment:deleted');
        newSocket.disconnect();
      };
    }
  }, [isAuthenticated, user]);

  const joinProject = (projectId) => {
    if (socket && projectId) {
      socket.emit('join-project', projectId);
      console.log('Joined project room:', projectId);
    }
  };

  const leaveProject = (projectId) => {
    if (socket && projectId) {
      socket.emit('leave-project', projectId);
      console.log('Left project room:', projectId);
    }
  };

  const addRealTimeEvent = (event) => {
    setRealTimeEvents(prev => [event, ...prev].slice(0, 50));
  };

  return (
    <SocketContext.Provider value={{
      socket,
      onlineUsers,
      realTimeEvents,
      joinProject,
      leaveProject,
      addRealTimeEvent,
    }}>
      {children}
    </SocketContext.Provider>
  );
};