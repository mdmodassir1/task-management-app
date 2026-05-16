import { useAuth } from '../context/AuthContext';

const useAuthHook = () => {
  const auth = useAuth();
  return auth;
};

export default useAuthHook;