import React from 'react';
import { NavLink } from 'react-router-dom';
import { STAFF_NAVIGATION } from '../config/navigation';
import { LogOut, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Sidebar({ user, collapsed, onToggle,logout }) {
    return (
        <aside className={`sidebar-container ${collapsed ? 'collapsed' : ''}`}>
            {/* 🏫 School Branding */}
            <div className="sidebar-logo-section">
                <div className="logo-placeholder">SQ</div>
                {!collapsed && <span className="brand-name">SmartQueue</span>}
            </div>

            {/* 🧭 Dynamic Navigation */}
            {/* 🧭 Dynamic Navigation */}
<nav className="sidebar-nav">
    {STAFF_NAVIGATION.map((section) => {
        // 🛡️ Check if the user has permission for ANY item in this section
        const hasVisibleItems = section.items.some(item => 
            item.roles.includes(user?.role)
        );

        // If no items are allowed for this user, skip the whole section
        if (!hasVisibleItems) return null;

        return (
            <div key={section.group} className="nav-group">
                {!collapsed && <p className="group-title">{section.group}</p>}
                
                {section.items.map((item) => {
                    if (!item.roles.includes(user?.role)) return null;

                    return (
                        <NavLink 
                            to={item.path} 
                            key={item.path}
                            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        >
                            <item.icon size={22} strokeWidth={2} />
                            {!collapsed && <span className="nav-label">{item.label}</span>}
                        </NavLink>
                    );
                })}
            </div>
        );
    })}
</nav>

            {/* 👤 Footer / User Profile */}
            <div className="sidebar-footer">
                <button className="logout-btn" onClick={logout}>
                    <LogOut size={20} />
                    {!collapsed && <span>Sign Out</span>}
                </button>
            </div>

            {/* 🎚️ Toggle Button */}
            <button className="collapse-toggle" onClick={onToggle}>
                {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
        </aside>
    );
}