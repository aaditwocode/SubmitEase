import { useUserData } from './UserContext';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const { user,loginStatus } = useUserData();
  if (!user || !loginStatus) {
    return <Navigate to="/home" />;
  }
  return children;
};

export default ProtectedRoute;