import { useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { accountApi } from '@/lib/api';
import { Loader2 } from 'lucide-react';

export default function AdminProtectedRoute() {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (user) {
      accountApi.getUsage().then(result => {
        if (result.success && result.data) {
          setIsAdmin(result.data.is_admin);
        } else {
          setIsAdmin(false);
        }
      });
    }
  }, [user]);

  if (authLoading || isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}
