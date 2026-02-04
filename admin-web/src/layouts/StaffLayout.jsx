import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext'; // Assuming you have an AuthContext
import '../styles/sidebar.css'; // Optional: Custom styles for layout

export default function StaffLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user , logout } = useAuth(); // Get your logged-in staff/admin data

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar 
        user={user} 
        logout={logout}
        collapsed={isCollapsed} 
        onToggle={() => setIsCollapsed(!isCollapsed)} 
      />
      
      <main style={{ 
        flex: 1, 
        backgroundColor: '#f8fafc',
        transition: 'margin 0.3s ease'
      }}>
        {/* This header stays at the top of every page */}
        <header style={{ height: '60px', backgroundColor: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', padding: '0 20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>
                {user?.department} Office
            </h2>
        </header>

        <div style={{ padding: '20px' }}>
          <Outlet /> {/* 👈 StaffDashboard or AdminDashboard renders here! */}
        </div>
      </main>
    </div>
  );
}