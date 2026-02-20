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
import { LayoutDashboard, UserSearch, History, Megaphone } from 'lucide-react'; 

// src/App.js
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* 🏢 SHARED SHELL ZONE */}
        <Route element={<StaffLayout />}>
          
          <Route element={<ProtectedRoute allowedRole={["staff", "admin"]} />}>
          <Route path="/staff/lookup" element={<StudentLookup />} />
          <Route path="/admin/audit-logs" element={<AuditLogs />} />
      </Route>

          {/* 🟢 STAFF ONLY HALLWAY */}
          <Route element={<ProtectedRoute allowedRole="staff" />}>
            <Route path="/staff/dashboard" element={<StaffDashboard />} />
            <Route path="/staff/history" element={<QueueHistory />} />
            <Route path="/staff/broadcast" element={<Broadcast />} />
          </Route>

          {/* 🔴 ADMIN ONLY HALLWAY */}
          <Route element={<ProtectedRoute allowedRole="admin" />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/analytics" element={<QueueAnalytics />} /> 
            <Route path="/admin/analytics/staff-performance" element={<StaffPerformance />} />
            {/* Add more admin specific routes here */}
          </Route>
          
        </Route>

        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}