import { Outlet } from 'react-router-dom';
import AppSidebar from '@/components/AppSidebar';

export default function DashboardLayout() {
  return (
    <div className="flex min-h-screen w-full">
      <AppSidebar />
      <main className="flex-1 ml-64">
        <Outlet />
      </main>
    </div>
  );
}
