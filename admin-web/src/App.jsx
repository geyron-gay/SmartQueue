import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import AdminDashboard from './pages/admin/AdminDashboard';
import StaffDashboard from './pages/staff/StaffDashboard';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';  
import Unauthorized from './pages/security/UnAuthorized';
import StaffLayout from './layouts/StaffLayout';
import StudentLookup from './pages/staff/StudentLookup';
import QueueHistory from './pages/staff/QueueHistory';  
import Broadcast from './pages/staff/Broadcast';
import QueueAnalytics from './pages/admin/QueueAnalytics';
import StaffPerformance from './pages/admin/StaffPerformance';
import AuditLogs from './pages/admin/AuditLogs';
import ViewSessions from './pages/admin/ViewSessions';
import { LayoutDashboard, UserSearch, History, Megaphone } from 'lucide-react'; 
import UserManagement from './pages/admin/UserManagement';
import { Toaster } from 'react-hot-toast'; // ✅ ADD THIS
import ManagePurposes from './pages/staff/ManagePurposes'; // ✅ ADD THIS

export default function App() {
  return (
    <BrowserRouter>

    <Toaster
  position="top-right"
  gutter={12}
  containerStyle={{
    top: 20,
    right: 20,
  }}
  toastOptions={{
    duration: 3500,
    style: {
      background: '#111827', // darker, modern
      color: '#f9fafb',
      padding: '14px 18px',
      borderRadius: '12px',
      minWidth: '260px',
      boxShadow: '0 10px 25px rgba(0,0,0,0.25)',
      fontSize: '14px',
      fontWeight: '500',
    },

    success: {
      iconTheme: {
        primary: '#22c55e',
        secondary: '#ecfdf5',
      },
      style: {
        borderLeft: '5px solid #22c55e',
      },
    },

    error: {
      iconTheme: {
        primary: '#ef4444',
        secondary: '#fef2f2',
      },
      style: {
        borderLeft: '5px solid #ef4444',
      },
    },

    loading: {
      style: {
        borderLeft: '5px solid #3b82f6',
      },
    },
  }}
/>

      <Routes>

        <Route path="/login" element={<Login />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

    
        <Route element={<StaffLayout />}>
          
          <Route element={<ProtectedRoute allowedRole={["staff", "admin"]} />}>
          <Route path="/staff/lookup" element={<StudentLookup />} />
          <Route path="/admin/audit-logs" element={<AuditLogs />} />
           <Route path="/staff/broadcast" element={<Broadcast />} />
           <Route path="/staff/manage-purposes" element={<ManagePurposes />} />
      </Route>

   
          <Route element={<ProtectedRoute allowedRole="staff" />}>
            <Route path="/staff/dashboard" element={<StaffDashboard />} />
            <Route path="/staff/history" element={<QueueHistory />} />
            
          </Route>

      
          <Route element={<ProtectedRoute allowedRole="admin" />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/analytics" element={<QueueAnalytics />} /> 
            <Route path="/admin/staff-performance" element={<StaffPerformance />} />
            <Route path="/admin/sessions" element={<ViewSessions />} />
             <Route path="/admin/user-management" element={<UserManagement />} />

          </Route>
          
        </Route>

        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}