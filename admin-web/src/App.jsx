import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import AdminDashboard from './pages/AdminDashboard';
import StaffDashboard from './pages/StaffDashboard';
import Login from './pages/Login';
import Register from './pages/Register';  
import Unauthorized from './pages/UnAuthorized';
import StartShiftModal from './pages/StartShiftsModal'; 
import StaffLayout from './layouts/StaffLayout';
import StudentLookup from './pages/StudentLookup';
import QueueHistory from './pages/QueueHistory';  
import Broadcast from './pages/Broadcast';  

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/startModal" element={<StartShiftModal />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* 🛡️ STAFF & ADMIN PROTECTED GROUP */}
        {/* We use a single ProtectedRoute wrapper for the whole layout group */}
        <Route element={
          <ProtectedRoute allowedRole={['staff', 'admin']}>
            <StaffLayout />
          </ProtectedRoute>
        }>
          {/* All pages inside here will automatically have the Sidebar! */}
          <Route path="/staff/dashboard" element={<StaffDashboard />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/staff/lookup" element={<StudentLookup />} />
          <Route path="/staff/history" element={<QueueHistory />} /> 
          <Route path="/staff/broadcast" element={<Broadcast />} /> 
          
          
          {/* You can add more pages here easily later */}
          {/* <Route path="/staff/history" element={<HistoryPage />} /> */}
        </Route>

      </Routes>
    </BrowserRouter>
  );
}