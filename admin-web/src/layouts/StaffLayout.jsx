import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import '../styles/sidebar.css';

export default function StaffLayout() {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const { user, logout } = useAuth();

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
                    <span className="header-dept">
                        {user?.department ? `${user.department} Office` : 'Dashboard'}
                    </span>
                    <span className="header-badge">● Live</span>
                </header>

                <div className="page-body">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}