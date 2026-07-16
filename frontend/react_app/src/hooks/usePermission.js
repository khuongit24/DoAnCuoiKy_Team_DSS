import { useAuth } from './useAuth';

export const usePermission = () => {
  const { user } = useAuth();

  const hasRole = (roles) => {
    if (!user) return false;
    
    // Admin has access to everything
    if (user.role === 'admin') return true;

    if (Array.isArray(roles)) {
      return roles.includes(user.role);
    }
    return user.role === roles;
  };

  return { hasRole, role: user?.role };
};
