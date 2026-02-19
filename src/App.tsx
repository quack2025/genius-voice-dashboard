import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminProtectedRoute from "@/components/AdminProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import NewProject from "./pages/NewProject";
import ProjectDetail from "./pages/ProjectDetail";
import Recordings from "./pages/Recordings";
import Export from "./pages/Export";
import Settings from "./pages/Settings";
import Landing from "./pages/Landing";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminUserDetail from "./pages/AdminUserDetail";
import AdminOrgs from "./pages/AdminOrgs";
import AdminOrgDetail from "./pages/AdminOrgDetail";
import OrgSettings from "./pages/OrgSettings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/projects/new" element={<NewProject />} />
                <Route path="/projects/:id" element={<ProjectDetail />} />
                <Route path="/recordings" element={<Recordings />} />
                <Route path="/export" element={<Export />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/org" element={<OrgSettings />} />
              </Route>
            </Route>

            {/* Admin routes */}
            <Route element={<AdminProtectedRoute />}>
              <Route element={<DashboardLayout />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/users" element={<AdminUsers />} />
                <Route path="/admin/users/:id" element={<AdminUserDetail />} />
                <Route path="/admin/orgs" element={<AdminOrgs />} />
                <Route path="/admin/orgs/:id" element={<AdminOrgDetail />} />
              </Route>
            </Route>

            {/* Redirects */}
            <Route path="/" element={<Landing />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
