import { BrowserRouter, Routes, Route , Navigate} from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import AdminDashboard from './pages/AdminDashboard';
import StaffDashboard from './pages/StaffDashboard';
import Login from './pages/Login';
import Register from './pages/Register';  
import Unauthorized from './pages/UnAuthorized';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Admin Routes */}
        <Route path="/admin/dashboard" element={
          <ProtectedRoute allowedRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        } />

        {/* Protected Staff Routes */}
        <Route path="/staff/dashboard" element={
          <ProtectedRoute allowedRole="staff">
            <StaffDashboard />
          </ProtectedRoute>
        } />
      <Route path = "/unauthorized" element={<Unauthorized />}  />

      </Routes>
    </BrowserRouter>
  );
}