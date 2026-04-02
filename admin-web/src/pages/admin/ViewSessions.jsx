import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axios';
import '../../styles/ViewSessions.css';

const ViewSessions = () => {
    const [sessions, setSessions] = useState([]);
    const [attendees, setAttendees] = useState([]);
    const [viewingSession, setViewingSession] = useState(null);
    const [filters, setFilters] = useState({ department: '', start_date: '', end_date: '' });
    const [loading, setLoading] = useState(false);

    useEffect(() => { loadSessions(); }, [filters]);

    const loadSessions = async () => {
        setLoading(true);
        try {
            const res = await axiosClient.get('/sessions', { params: filters });
            setSessions(res.data.data);
        } catch (err) {
            console.error("Error loading sessions:", err);
        } finally {
            setLoading(false);
        }
    };

    const viewAttendees = async (sessionId) => {
        try {
            const res = await axiosClient.get(`/sessions/${sessionId}`);
            const sessionData = res.data.data;
            
            setAttendees(sessionData.attendees);
            setViewingSession(sessionId);
        } catch (err) {
            console.error("Error fetching attendees:", err);
        }
    };

    const closeModal = () => {
        setViewingSession(null);
        setAttendees([]);
    };

    const clearFilters = () => {
        setFilters({ department: '', start_date: '', end_date: '' });
    };

    const getStatusColor = (status) => {
        switch(status) {
            case 'completed': return '#10B981';
            case 'serving': return '#F4B41A';
            case 'waiting': return '#3B82F6';
            case 'cancelled': return '#EF4444';
            default: return '#6B7280';
        }
    };

    return (
        <div className="sessions-container">
            {/* Header Section */}
            <div className="sessions-header">
                <div className="header-content">
                    <div className="header-icon">📊</div>
                    <div>
                        <h1 className="header-title">Queue History & Sessions</h1>
                        <p className="header-subtitle">Track and manage department queue sessions</p>
                    </div>
                </div>
                <div className="header-stats">
                    <div className="stat-card">
                        <div className="stat-value">{sessions.length}</div>
                        <div className="stat-label">Total Sessions</div>
                    </div>
                </div>
            </div>

            {/* Filter Section */}
            <div className="filter-section">
                <div className="filter-header">
                    <span className="filter-icon">🔍</span>
                    <span className="filter-title">Filters</span>
                </div>
                
                <div className="filter-controls">
                    <div className="input-group">
                        <label>Department</label>
                        <input 
                            type="text"
                            placeholder="Search by department..." 
                            value={filters.department}
                            onChange={e => setFilters({...filters, department: e.target.value})}
                            className="filter-input"
                        />
                    </div>
                    
                    <div className="input-group">
                        <label>Start Date</label>
                        <input 
                            type="date" 
                            value={filters.start_date}
                            onChange={e => setFilters({...filters, start_date: e.target.value})}
                            className="filter-input"
                        />
                    </div>
                    
                    <div className="input-group">
                        <label>End Date</label>
                        <input 
                            type="date" 
                            value={filters.end_date}
                            onChange={e => setFilters({...filters, end_date: e.target.value})}
                            className="filter-input"
                        />
                    </div>

                    <button onClick={clearFilters} className="clear-btn">
                        ✕ Clear
                    </button>
                </div>
            </div>

            {/* Sessions Table */}
            <div className="table-container">
                {loading ? (
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <p>Loading sessions...</p>
                    </div>
                ) : sessions.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">📭</div>
                        <h3>No Sessions Found</h3>
                        <p>Try adjusting your filters or create a new session</p>
                    </div>
                ) : (
                    <table className="sessions-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Department</th>
                                <th>Target Year</th>
                                <th>Students Joined</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sessions.map(s => (
                                <tr key={s.id}>
                                    <td>
                                        <div className="date-cell">
                                            <span className="date-icon">📅</span>
                                            {new Date(s.created_at).toLocaleDateString('en-US', { 
                                                month: 'short', 
                                                day: 'numeric', 
                                                year: 'numeric' 
                                            })}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="dept-badge">
                                            {s.department}
                                        </div>
                                    </td>
                                    <td>
                                        <span className="target-pill">{s.target_year}</span>
                                    </td>
                                    <td>
                                        <div className="count-cell">
                                            <span className="count-number">{s.current_count}</span>
                                            <span className="count-label">students</span>
                                        </div>
                                    </td>
                                    <td>
                                        <button 
                                            onClick={() => viewAttendees(s.id)}
                                            className="view-btn"
                                        >
                                            <span>👥</span> View Students
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Attendees Modal */}
            {viewingSession && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h2 className="modal-title">Session #{viewingSession}</h2>
                                <p className="modal-subtitle">{attendees.length} students attended</p>
                            </div>
                            <button onClick={closeModal} className="close-btn">
                                ✕
                            </button>
                        </div>

                        <div className="modal-body">
                            {attendees.length === 0 ? (
                                <div className="modal-empty">
                                    <span className="modal-empty-icon">👤</span>
                                    <p>No attendees found for this session</p>
                                </div>
                            ) : (
                                <div className="attendees-list">
                                    {attendees.map(a => (
                                        <div key={a.id} className="attendee-card">
                                            <div className="attendee-avatar">
                                                {a.student_name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="attendee-info">
                                                <div className="attendee-name">{a.student_name}</div>
                                                <div className="attendee-id">ID: {a.student_id}</div>
                                                <div className="attendee-purpose">
                                                    <span className="purpose-icon">📝</span>
                                                    {a.purpose}
                                                </div>
                                            </div>
                                            <div 
                                                className="attendee-status"
                                                style={{ 
                                                    backgroundColor: `${getStatusColor(a.status)}15`,
                                                    color: getStatusColor(a.status)
                                                }}
                                            >
                                                {a.status}
                                            </div>
                                        </div>
                                    ))}
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