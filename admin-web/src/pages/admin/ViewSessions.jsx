import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axios';
import '../../styles/ViewSessions.css';

const STATUS_CLASS = {
    completed: 'completed',
    serving:   'serving',
    waiting:   'waiting',
    cancelled: 'cancelled',
};

const hasActiveFilters = (f) =>
    f.department.trim() !== '' || f.start_date !== '' || f.end_date !== '';

const ViewSessions = () => {
    const [sessions, setSessions]           = useState([]);
    const [attendees, setAttendees]         = useState([]);
    const [viewingSession, setViewingSession] = useState(null);
    const [viewingDept, setViewingDept]     = useState('');
    const [filters, setFilters]             = useState({ department: '', start_date: '', end_date: '' });
    const [loading, setLoading]             = useState(false);

    useEffect(() => { loadSessions(); }, [filters]);

    const loadSessions = async () => {
        setLoading(true);
        try {
            const res = await axiosClient.get('/sessions', { params: filters });
            setSessions(res.data.data);
        } catch (err) {
            console.error('Error loading sessions:', err);
        } finally {
            setLoading(false);
        }
    };

    const viewAttendees = async (session) => {
        try {
            const res = await axiosClient.get(`/sessions/${session.id}`);
            setAttendees(res.data.data.attendees);
            setViewingSession(session.id);
            setViewingDept(session.department);
        } catch (err) {
            console.error('Error fetching attendees:', err);
        }
    };

    const closeModal = () => {
        setViewingSession(null);
        setAttendees([]);
        setViewingDept('');
    };

    const clearFilters = () =>
        setFilters({ department: '', start_date: '', end_date: '' });

    const formatDate = (iso) => {
        const d = new Date(iso);
        return {
            primary:   d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            secondary: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        };
    };

    const active = hasActiveFilters(filters);

    return (
        <div className="vs-container">

            {/* ── HEADER ── */}
            <div className="vs-header">
                <div className="vs-header-accent" />

                <div className="vs-header-left">
                    <div className="vs-header-icon">📊</div>
                    <div>
                        <h1 className="vs-header-title">Queue History & Sessions</h1>
                        <p className="vs-header-sub">Trinidad Municipal College · Track and manage department queue sessions</p>
                    </div>
                </div>

                <div className="vs-header-stat">
                    <span className="vs-header-stat-val">{sessions.length}</span>
                    <span className="vs-header-stat-label">Total Sessions</span>
                </div>
            </div>

            {/* ── FILTERS ── */}
            <div className="vs-filters">
                <div className="vs-filter-header">
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0 }}>
                        <path d="M3 5h14M6 10h8M9 15h2" stroke="#8A9BB0" strokeWidth="1.8"
                            strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="vs-filter-title">Filters</span>
                    {active && (
                        <div className="vs-active-indicator">
                            <span className="vs-active-dot" />
                            Active
                        </div>
                    )}
                </div>

                <div className="vs-filter-controls">
                    <div className="vs-field">
                        <label className="vs-field-label">Department</label>
                        <input
                            className="vs-field-input"
                            type="text"
                            placeholder="Search by department..."
                            value={filters.department}
                            onChange={e => setFilters({ ...filters, department: e.target.value })}
                        />
                    </div>

                    <div className="vs-field">
                        <label className="vs-field-label">Start Date</label>
                        <input
                            className="vs-field-input"
                            type="date"
                            value={filters.start_date}
                            onChange={e => setFilters({ ...filters, start_date: e.target.value })}
                        />
                    </div>

                    <div className="vs-field">
                        <label className="vs-field-label">End Date</label>
                        <input
                            className="vs-field-input"
                            type="date"
                            value={filters.end_date}
                            onChange={e => setFilters({ ...filters, end_date: e.target.value })}
                        />
                    </div>

                    <button className="vs-clear-btn" onClick={clearFilters}>
                        <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
                            <path d="M1 1l12 12M13 1L1 13" stroke="currentColor"
                                strokeWidth="1.8" strokeLinecap="round"/>
                        </svg>
                        Clear Filters
                    </button>
                </div>
            </div>

            {/* ── TABLE ── */}
            <div className="vs-table-wrap">
                {loading ? (
                    <div className="vs-loading">
                        <div className="vs-spinner" />
                        <p>Loading sessions...</p>
                    </div>
                ) : sessions.length === 0 ? (
                    <div className="vs-empty">
                        <div className="vs-empty-icon">📭</div>
                        <h3>No Sessions Found</h3>
                        <p>{active ? 'Try adjusting your filters.' : 'No session records available yet.'}</p>
                    </div>
                ) : (
                    <table className="vs-table">
                        <thead>
                            <tr>
                                <th>Date & Time</th>
                                <th>Department</th>
                                <th>Target Year</th>
                                <th>Students</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sessions.map(s => {
                                const { primary, secondary } = formatDate(s.created_at);
                                return (
                                    <tr key={s.id}>
                                        {/* Date */}
                                        <td>
                                            <div className="vs-date-cell">
                                                <div className="vs-date-icon">📅</div>
                                                <div>
                                                    <div className="vs-date-primary">{primary}</div>
                                                    <div className="vs-date-secondary">{secondary}</div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Department */}
                                        <td>
                                            <span className="vs-dept-badge">{s.department}</span>
                                        </td>

                                        {/* Year */}
                                        <td>
                                            <span className="vs-year-pill">{s.target_year}</span>
                                        </td>

                                        {/* Count */}
                                        <td>
                                            <div className="vs-count-cell">
                                                <span className="vs-count-num">{s.current_count}</span>
                                                <span className="vs-count-label">students</span>
                                            </div>
                                        </td>

                                        {/* Action */}
                                        <td>
                                            <button
                                                className="vs-view-btn"
                                                onClick={() => viewAttendees(s)}
                                            >
                                                <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
                                                    <path d="M2 10s3.5-6 8-6 8 6 8 6-3.5 6-8 6-8-6-8-6z"
                                                        stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/>
                                                    <circle cx="10" cy="10" r="2.5"
                                                        stroke="currentColor" strokeWidth="1.7"/>
                                                </svg>
                                                View Students
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* ── ATTENDEES MODAL ── */}
            {viewingSession && (
                <div className="vs-modal-overlay" onClick={closeModal}>
                    <div className="vs-modal" onClick={e => e.stopPropagation()}>

                        {/* Header */}
                        <div className="vs-modal-header">
                            <div className="vs-modal-header-left">
                                <div className="vs-modal-icon">👥</div>
                                <div>
                                    <div className="vs-modal-title">{viewingDept} · Session #{viewingSession}</div>
                                    <div className="vs-modal-sub">
                                        {attendees.length} {attendees.length === 1 ? 'student' : 'students'} attended
                                    </div>
                                </div>
                            </div>
                            <button className="vs-modal-close" onClick={closeModal}>✕</button>
                        </div>

                        {/* Body */}
                        <div className="vs-modal-body">
                            {attendees.length === 0 ? (
                                <div className="vs-modal-empty">
                                    <span className="vs-modal-empty-icon">👤</span>
                                    <p>No attendees found for this session.</p>
                                </div>
                            ) : (
                                <div className="vs-attendees">
                                    {attendees.map(a => {
                                        const statusClass = STATUS_CLASS[a.status] || 'default';
                                        return (
                                            <div key={a.id} className="vs-attendee-card">
                                                <div className="vs-att-avatar">
                                                    {(a.student_name || '?').charAt(0).toUpperCase()}
                                                </div>

                                                <div className="vs-att-info">
                                                    <div className="vs-att-name">{a.student_name}</div>
                                                    <div className="vs-att-id">ID: {a.student_id}</div>
                                                    <div className="vs-att-purpose">
                                                        <svg width="11" height="11" viewBox="0 0 20 20" fill="none">
                                                            <path d="M4 4h12v12H4z" stroke="#8A9BB0"
                                                                strokeWidth="1.6" strokeLinejoin="round"/>
                                                            <path d="M7 8h6M7 11h4" stroke="#8A9BB0"
                                                                strokeWidth="1.6" strokeLinecap="round"/>
                                                        </svg>
                                                        {a.purpose}
                                                    </div>
                                                </div>

                                                <span className={`vs-att-status ${statusClass}`}>
                                                    {a.status}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ViewSessions;