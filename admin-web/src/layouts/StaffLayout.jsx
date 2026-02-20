import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext'; // Assuming you have an AuthContext
import '../styles/sidebar.css'; // Optional: Custom styles for layout

export default function StaffLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user , logout } = useAuth();

  return (
    <div className="staff-layout">
      <Sidebar 
        user={user} 
        logout={logout}
        collapsed={isCollapsed} 
        onToggle={() => setIsCollapsed(!isCollapsed)} 
      />
      
      <main>
        <header>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>
                {user?.department} Office
            </h2>
        </header>

        <div>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
