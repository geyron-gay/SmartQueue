import React from 'react';
import { NavLink } from 'react-router-dom';
import { MASTER_NAVIGATIONS } from '../config/navigation';
import { LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import '../styles/sidebar.css'; // adjust path as needed

export default function Sidebar({ user, collapsed, onToggle, logout }) {
    return (
        <aside className={`sidebar-container ${collapsed ? 'collapsed' : ''}`}>

            {/* ── Logo ── */}
            <div className="sidebar-logo-section">
                <div className="logo-placeholder">SQ</div>
                {!collapsed && <span className="brand-name">SmartQueue</span>}
            </div>

            {/* ── Navigation ── */}
            <nav className="sidebar-nav">
                {MASTER_NAVIGATIONS.map((section) => {
                    const hasVisibleItems = section.items.some(item =>
                        item.roles.includes(user?.role)
                    );
                    if (!hasVisibleItems) return null;

                    return (
                        <div key={section.group} className="nav-group">
                            {!collapsed && (
                                <p className="group-title">{section.group}</p>
                            )}

                            {section.items.map((item) => {
                                if (!item.roles.includes(user?.role)) return null;

                                return (
                                    <NavLink
                                        to={item.path}
                                        key={item.path}
                                        className={({ isActive }) =>
                                            `nav-item ${isActive ? 'active' : ''}`
                                        }
                                        title={collapsed ? item.label : undefined}
                                    >
                                        <item.icon size={20} strokeWidth={2} style={{ flexShrink: 0 }} />
                                        {!collapsed && (
                                            <>
                                                <span className="nav-label">{item.label}</span>
                                                {item.live && <span className="live-dot" />}
                                            </>
                                        )}
                                    </NavLink>
                                );
                            })}
                        </div>
                    );
                })}
            </nav>

            {/* ── Footer ── */}
            <div className="sidebar-footer">
                <button className="logout-btn" onClick={logout} title={collapsed ? 'Sign Out' : undefined}>
                    <LogOut size={18} style={{ flexShrink: 0 }} />
                    {!collapsed && <span>Sign Out</span>}
                </button>
            </div>

            {/* ── Collapse Toggle ── */}
            <button className="collapse-toggle" onClick={onToggle}>
                {collapsed
                    ? <ChevronRight size={14} />
                    : <ChevronLeft size={14} />
                }
            </button>

        </aside>
    );
}