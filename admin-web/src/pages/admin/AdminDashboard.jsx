// RegistrarAdmin.jsx
import React, { useState, useEffect } from 'react';
import '../../styles/RegistrarAdmin.css';
import axiosClient from '../../api/axios';
import LogModal from './LogModal';

// Helper: get initials from a name
function getInitials(name = '') {
    return name
        .split(' ')
        .slice(0, 2)
        .map(n => n[0])
        .join('')
        .toUpperCase();
}

export default function AdminDashboard() {
    const [staffList, setStaffList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedLogs, setSelectedLogs] = useState(null);
    const [viewingStaff, setViewingStaff] = useState(null);

    const fetchStaffData = async () => {
        try {
            const response = await axiosClient.get('/admin/registrar-staff');
            setStaffList(response.data.data);
        } catch (error) {
            console.error('Error fetching staff:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStaffData();
        const interval = setInterval(fetchStaffData, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleViewLogs = async (staff) => {
        try {
            const res = await axiosClient.get(`/admin/registrar-staff/${staff.id}/logs`);
            setSelectedLogs(res.data.data || res.data);
            setViewingStaff(staff);
        } catch (error) {
            console.error('Error fetching logs:', error);
            alert('Could not load logs. Check API route.');
        }
    };

    // ── Derived stats
    const activeCount = staffList.filter(s => s.status === 'Active').length;
    const totalServed = staffList.reduce((sum, s) => sum + (s.served || 0), 0);

    if (loading) return <div className="loading">Syncing Staff Records</div>;

    return (
        <div className="registrar-admin-wrap">

            {/* ── Header ── */}
            <header className="admin-header">
                <div className="header-gold-line" />
                <h1 style={{ color: '#1106b0' }}>Registrar Personnel Management</h1>
                <p style={{ color: '#ac8704' }}>Trinidad Municipal College · Staff Monitoring</p>
            </header>

            {/* ── Stats Bar ── */}
            <div className="admin-stats-bar">
                <div className="stat-pill">
                    <span className="stat-pill-label">Total Staff</span>
                    <span className="stat-pill-value">{staffList.length}</span>
                </div>
                <div className="stat-pill">
                    <span className="stat-pill-label">Active Now</span>
                    <span className="stat-pill-value gold">{activeCount}</span>
                </div>
                <div className="stat-pill">
                    <span className="stat-pill-label">Total Served Today</span>
                    <span className="stat-pill-value">{totalServed}</span>
                </div>
            </div>

            {/* ── Grid ── */}
            <div className="admin-content">
                <p className="section-label">Staff Roster</p>

                {staffList.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">🗂️</div>
                        <p>No staff records found.</p>
                    </div>
                ) : (
                    <div className="staff-grid">
                        {staffList.map((staff, i) => {
                            const isActive = staff.status === 'Active';
                            return (
                                <div
                                    key={staff.id}
                                    className={`staff-card ${isActive ? 'is-active' : ''}`}
                                    style={{ animationDelay: `${i * 0.05}s` }}
                                >
                                    {/* Top Row */}
                                    <div className="card-top">
                                        <div className={`staff-avatar ${isActive ? 'is-active' : ''}`}>
                                            {getInitials(staff.name)}
                                        </div>

                                        <div style={{ minWidth: 0, flex: 1 }}>
                                            <h3 className="staff-name">{staff.name}</h3>
                                            <span className="email-tag">{staff.email}</span>
                                        </div>

                                        <div className={`status-badge ${isActive ? 'active' : 'offline'}`}>
                                            <span className="status-dot" />
                                            {isActive ? 'Active' : 'Offline'}
                                        </div>
                                    </div>

                                    {/* Stats */}
                                    <div className="staff-stats">
                                        <div className="mini-stat">
                                            <span className="label">Total Served</span>
                                            <span className="val">{staff.served ?? '—'}</span>
                                        </div>
                                        <div className="mini-stat">
                                            <span className="label">Last Action</span>
                                            <span className="val small-text">
                                                {staff.last_action ?? 'No activity'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="card-actions">
                                        <button
                                            className="btn-outline"
                                            onClick={() => handleViewLogs(staff)}
                                        >
                                            📋 Activity Logs
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ── Log Modal ── */}
            {selectedLogs && (
                <LogModal
                    staff={viewingStaff}
                    logs={selectedLogs}
                    onClose={() => {
                        setSelectedLogs(null);
                        setViewingStaff(null);
                    }}
                />
            )}
        </div>
    );
}