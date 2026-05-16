import { useSocket } from '../context/SocketContext';

const useSocketHook = () => {
  const socketContext = useSocket();
  return socketContext;
};

export default useSocketHook;