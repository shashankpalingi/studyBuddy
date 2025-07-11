import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  adminOnly?: boolean;
}

const ProtectedRoute = ({ children, adminOnly = false }: ProtectedRouteProps) => {
  const { currentUser, loading, userProfile } = useAuth();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  
  // In development mode, allow access without authentication
  const isDevelopment = import.meta.env.DEV;
  const bypassAuth = isDevelopment && true; // Change to false when you want to test authentication
  
  useEffect(() => {
    if (userProfile) {
      setIsAdmin(userProfile.isAdmin || false);
    }
  }, [userProfile]);
  
  if (loading) {
    return null;
  }

  // For admin routes, check if user is an admin
  if (adminOnly && !isAdmin && !bypassAuth) {
    return <Navigate to="/not-found" state={{ from: location }} replace />;
  }

  // If not authenticated and not bypassing auth, redirect to login page
  if (!currentUser && !bypassAuth) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // User is authenticated, or we're bypassing auth in development
  return <>{children}</>;
};

export default ProtectedRoute; 