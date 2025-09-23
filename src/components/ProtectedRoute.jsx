import { useUserData } from './UserContext';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const { user} = useUserData();
  if (!user) {
    return <Navigate to="/home" />;
  }
  return children;
};

export default ProtectedRoute;