// RegistrarAdmin.jsx
import React, { useState, useEffect } from 'react';
import '../../styles/RegistrarAdmin.css';
import axiosClient from '../../api/axios';
import LogModal from './LogModal';
import { Repeat, XCircle, ClipboardList } from 'lucide-react';

function getInitials(name = '') {
    return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

export default function AdminDashboard() {
    const [staffList, setStaffList]     = useState([]);
    const [loading, setLoading]         = useState(true);
    const [selectedLogs, setSelectedLogs] = useState(null);
    const [viewingStaff, setViewingStaff] = useState(null);
    const [isUpdating, setIsUpdating]   = useState(false);

    const departments = ['REGISTRAR-BSIT', 'REGISTRAR-CAS', 'SSG', 'REGISTRAR-CRIM,REGISTRAR-EDUC', 'REGISTRAR-BSOA','CASHIER'];

    const fetchStaffData = async () => {
        try {
            const res = await axiosClient.get('/admin/registrar-staff');
            setStaffList(res.data.data);
        } catch (err) {
            console.error('Error fetching staff:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStaffData();
        const interval = setInterval(fetchStaffData, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleRelocate = async (staffId, targetDept) => {
        setIsUpdating(true);
        try {
            await axiosClient.post(`/admin/registrar-staff/${staffId}/relocate`, {
                relocated_to: targetDept,
            });
            fetchStaffData();
        } catch {
            alert('Failed to relocate staff. Please check your connection.');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleViewLogs = async (staff) => {
        try {
            const res = await axiosClient.get(`/admin/registrar-staff/${staff.id}/logs`);
            setSelectedLogs(res.data.data || res.data);
            setViewingStaff(staff);
        } catch {
            alert('Could not load activity logs.');
        }
    };

    const activeCount  = staffList.filter(s => s.status === 'Active').length;
    const totalServed  = staffList.reduce((sum, s) => sum + (s.served || 0), 0);

    if (loading) {
        return (
            <div className="ra-loading">
                <div className="ra-spinner" />
                <p>Syncing staff records...</p>
            </div>
        );
    }

    return (
        <div className="ra-wrap">

            {/* ── HEADER ── */}
            <header className="ra-header">
                <div className="ra-header-accent" />

                <div className="ra-header-left">
                    <div className="ra-header-icon">🏛️</div>
                    <div>
                        <h1 className="ra-header-title">Personnel Management</h1>
                        <p className="ra-header-sub">Trinidad Municipal College · Registrar Staff Monitoring</p>
                    </div>
                </div>

                <div className="ra-live-badge">
                    <span className="ra-live-dot" />
                    <span className="ra-live-text">Live</span>
                </div>
            </header>

            {/* ── STATS BAR ── */}
            <div className="ra-stats">
                <div className="ra-stat-card">
                    <div className="ra-stat-icon navy">👥</div>
                    <div>
                        <div className="ra-stat-label">Total Staff</div>
                        <div className="ra-stat-value">{staffList.length}</div>
                    </div>
                </div>

                <div className="ra-stat-card">
                    <div className="ra-stat-icon gold">⚡</div>
                    <div>
                        <div className="ra-stat-label">Active Now</div>
                        <div className="ra-stat-value gold">{activeCount}</div>
                    </div>
                </div>

                <div className="ra-stat-card">
                    <div className="ra-stat-icon green">✅</div>
                    <div>
                        <div className="ra-stat-label">Served Today</div>
                        <div className="ra-stat-value">{totalServed}</div>
                    </div>
                </div>
            </div>

            {/* ── CONTENT ── */}
            <div>
                <div className="ra-section-header">
                    <span className="ra-section-title">Staff Roster</span>
                    <span className="ra-section-count">{staffList.length} members</span>
                </div>

                <div className="ra-grid">
                    {staffList.map((staff, i) => {
                        const isActive    = staff.status === 'Active';
                        const isRelocated = !!staff.relocated_to;
                            const isBeingAssisted = staffList.some(
  s => s.relocated_to === staff.department
);

                        return (
                            <div
                                key={staff.id}
                                className={`ra-card${isActive ? ' is-active' : ''}${isRelocated ? ' is-relocated' : ''}`}
                                style={{ animationDelay: `${i * 0.06}s` }}
                            >
                                {/* Top color stripe */}
                                <div className="ra-card-stripe" />

                                {/* Card Body */}
                                <div className="ra-card-body">

                                    {/* Top row: avatar + info + status badge */}
                                    <div className="ra-card-top">
                                        <div className={`ra-avatar${isActive ? ' is-active' : ''}`}>
                                            {getInitials(staff.name)}
                                        </div>

                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div className="ra-card-name">{staff.name}</div>
                                            <div className="ra-card-dept">{staff.department}</div>
                                            {isRelocated && (
                                                <div className="ra-reloc-badge">
                                                    <Repeat size={9} />
                                                    Currently in {staff.relocated_to}
                                                </div>
                                            )}
                                        </div>

                                        <div className={`ra-status-badge ${isActive ? 'active' : 'offline'}`}>
                                            <span className="ra-status-dot" />
                                            {isActive ? 'Active' : 'Offline'}
                                        </div>
                                    </div>

                                    {/* Relocation control */}
                                    <div className="ra-reloc-control">
                                        <div className="ra-reloc-label">Assign to Department</div>
                                        <div className="ra-reloc-row">
                                            <select
                                                className="ra-dept-select"
                                                value={staff.relocated_to || ''}
                                                onChange={e => handleRelocate(staff.id, e.target.value || null)}
                                                disabled={isUpdating ||isBeingAssisted }
                                            >
                                                <option value="">— Home Department —</option>
                                                {departments
                                                    .filter(d => d !== staff.department)
                                                    .map(dept => (
                                                        <option key={dept} value={dept}>{dept}</option>
                                                    ))
                                                }
                                            </select>

                                            {isRelocated && (
                                                <button
                                                    className="ra-recall-btn"
                                                    title="Recall to Home Department"
                                                    onClick={() => handleRelocate(staff.id, null)}
                                                    disabled={isUpdating}
                                                >
                                                    <XCircle size={16} color="#DC2626" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Mini stats */}
                                <div className="ra-mini-stats">
                                    <div className="ra-mini-stat">
                                        <span className="ra-mini-label">Served Today</span>
                                        <span className="ra-mini-value">{staff.served ?? 0}</span>
                                    </div>
                                    <div className="ra-mini-stat">
                                        <span className="ra-mini-label">Current Station</span>
                                        <span className="ra-mini-value small">
                                            {isRelocated
                                                ? `Assisting ${staff.relocated_to}`
                                                : 'Home Station'}
                                        </span>
                                    </div>
                                </div>

                                {/* Card footer */}
                                <div className="ra-card-footer">
                                    <button
                                        className="ra-log-btn"
                                        onClick={() => handleViewLogs(staff)}
                                    >
                                        <ClipboardList size={14} />
                                        View Activity Logs
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ── LOG MODAL ── */}
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