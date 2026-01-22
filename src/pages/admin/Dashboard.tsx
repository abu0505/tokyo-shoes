import AdminLayout from '@/components/admin/AdminLayout';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

const AdminDashboard = () => {
  const navigate = useNavigate();

  // Redirect to inventory by default
  useEffect(() => {
    navigate('/admin/inventory', { replace: true });
  }, [navigate]);

  return (
    <AdminLayout>
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Redirecting to inventory...</p>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
