import React, { useEffect, useState, useMemo } from 'react';
import {
    Clock, CheckCircle, XCircle,
    Download, Calendar as CalendarIcon,
    RotateCcw, Search, ArrowUpDown
} from 'lucide-react';
import '../../styles/history.css';
import axiosClient from '../../api/axios';
import { initializeSocket } from '../../context/socket';

// ── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name = '') {
    return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

function formatTime(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}

/** Duration in minutes between created_at and updated_at */
function getDuration(row) {
    if (!row.created_at || !row.updated_at) return null;
    const mins = Math.round((new Date(row.updated_at) - new Date(row.created_at)) / 60000);
    return mins > 0 ? mins : null;
}

function getDurationClass(mins) {
    if (!mins) return '';
    if (mins <= 5)  return 'fast';
    if (mins <= 12) return 'normal';
    return 'slow';
}

/** Export visible rows to CSV */
function exportCSV(rows) {
    const headers = ['Ticket', 'Student Name', 'Student ID', 'Purpose', 'Status', 'Finished At', 'Duration (min)'];
    const lines = rows.map(r => [
        r.queue_number,
        r.student_name,
        r.student_id || '',
        r.purpose || '',
        r.status,
        formatTime(r.updated_at),
        getDuration(r) ?? ''
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));

    const csv = [headers.join(','), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `queue-history-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

const STATUS_FILTERS = ['All', 'completed', 'cancelled', 'pending', 'serving', 'noshow'];

// ── Main Component ────────────────────────────────────────────────────────────

export default function QueueHistory() {
    const [history, setHistory]       = useState([]);
    const [loading, setLoading]       = useState(true);
    const [filterDate, setFilterDate] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [search, setSearch]         = useState('');
    const [sortField, setSortField]   = useState('updated_at');
    const [sortDir, setSortDir]       = useState('desc');

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const response = await axiosClient.get(`/staff/history?date=${filterDate}`);
            setHistory(response.data.data || response.data);
        } catch (error) {
            console.error('History fetch failed', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
        let socket;
        const setupSocket = async () => {
            socket = initializeSocket();
            socket.on('QueueUpdated', () => fetchHistory());
        };
        setupSocket();
        return () => { if (socket) socket.disconnect(); };
    }, [filterDate]);

    // ── Sort handler ──
    const handleSort = (field) => {
        if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortField(field); setSortDir('asc'); }
    };

    // ── Derived: filtered + sorted ──
    const filtered = useMemo(() => {
        let rows = [...history];

        // Status filter
        if (statusFilter !== 'All') rows = rows.filter(r => r.status === statusFilter);

        // Search
        if (search) {
            const q = search.toLowerCase();
            rows = rows.filter(r =>
                r.student_name?.toLowerCase().includes(q) ||
                String(r.queue_number).includes(q) ||
                r.student_id?.toLowerCase().includes(q) ||
                r.purpose?.toLowerCase().includes(q)
            );
        }

        // Sort
        rows.sort((a, b) => {
            let aVal = a[sortField] ?? '';
            let bVal = b[sortField] ?? '';
            if (sortField === 'queue_number') { aVal = Number(aVal); bVal = Number(bVal); }
            if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });

        return rows;
    }, [history, statusFilter, search, sortField, sortDir]);

    // ── Aggregate stats ──
    const completedCount = history.filter(r => r.status === 'completed').length;
    const cancelledCount = history.filter(r => r.status === 'cancelled').length;
    const servingCount = history.filter(r => r.status === 'serving').length;
    const pendingCount = history.filter(r => r.status === 'pending').length;
    const noShowCount = history.filter(r => r.status === 'noshow').length;

    const completionRate = history.length > 0
        ? Math.round((completedCount / history.length) * 100) : 0;
    const durations     = history
        .map(getDuration)
        .filter(Boolean);
    const avgDuration   = durations.length
        ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;

    const hasFilters = statusFilter !== 'All' || filterDate || search;

    const SortIcon = ({ field }) => (
        <span className="th-sort-icon" style={{ opacity: sortField === field ? 1 : 0.3 }}>
            {sortField === field ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
        </span>
    );

    return (
        <div className="history-wrapper">

            {/* ── Header ── */}
            <header className="history-header">
                <div className="header-gold-line" />
                <h1 style={{color :'blue'}}>Queue History</h1>
                <p style={{color :'blue'}} className="history-header-sub">
                    {filterDate
                        ? `Records for ${formatDate(filterDate + 'T00:00:00')}`
                        : 'All completed and cancelled transactions'}
                </p>
            </header>

            {/* ── Stats Strip ── */}
            <div className="history-stats-strip">
                <div className="history-stat">
                    <span className="history-stat-label">Total Records</span>
                    <span className="history-stat-value">{history.length}</span>
                </div>
                <div className="history-stat">
                    <span className="history-stat-label">Completed</span>
                    <span className="history-stat-value green">{completedCount}</span>
                </div>
                <div className="history-stat">
                    <span className="history-stat-label">Cancelled</span>
                    <span className="history-stat-value red">{cancelledCount}</span>
                </div>
                <div className="history-stat">
                    <span className="history-stat-label">Serving</span>
                    <span className="history-stat-value red">{servingCount}</span>
                </div>
                <div className="history-stat">
                    <span className="history-stat-label">Pending</span>
                    <span className="history-stat-value red">{pendingCount}</span>
                </div>
                <div className="history-stat">
                    <span className="history-stat-label">No Show</span>
                    <span className="history-stat-value red">{noShowCount}</span>
                </div>
                <div className="history-stat">
                    <span className="history-stat-label">Completion Rate</span>
                    <span className="history-stat-value gold">{completionRate}%</span>
                </div>
                <div className="history-stat">
                    <span className="history-stat-label">Avg Service Time</span>
                    <span className="history-stat-value orange">{avgDuration > 0 ? `${avgDuration}m` : '—'}</span>
                </div>
            </div>

            {/* ── Controls ── */}
            <div className="history-controls">

                {/* Date picker */}
                <div className="date-input-wrap">
                    <CalendarIcon size={14} className="date-icon" />
                    <input
                        className="history-date-input"
                        type="date"
                        value={filterDate}
                        onChange={e => setFilterDate(e.target.value)}
                    />
                </div>

                {/* Status pills */}
                <div className="history-filter-pills">
                    {STATUS_FILTERS.map(s => (
                        <button
                            key={s}
                            className={`history-pill pill-${s} ${statusFilter === s ? 'active' : ''}`}
                            onClick={() => setStatusFilter(s)}
                        >
                            {s === 'All'
                                ? `All · ${history.length}`
                                : `${s} · ${history.filter(r => r.status === s).length}`}
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div className="history-search-wrap">
                    <Search size={14} className="history-search-icon" />
                    <input
                        className="history-search"
                        type="text"
                        placeholder="Search name, ticket, purpose..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>

                {/* Right side */}
                <div className="controls-right">
                    {hasFilters && (
                        <button
                            className="btn-reset"
                            onClick={() => { setFilterDate(''); setStatusFilter('All'); setSearch(''); }}
                        >
                            <RotateCcw size={13} /> Reset
                        </button>
                    )}
                    <button className="btn-export" onClick={() => exportCSV(filtered)}>
                        <Download size={14} /> Export CSV
                    </button>
                </div>
            </div>

            {/* ── Results bar ── */}
            <div className="history-results-bar">
                <span className="results-count">{filtered.length} record{filtered.length !== 1 ? 's' : ''}</span>
                {filterDate && (
                    <span className="results-chip">
                        📅 {formatDate(filterDate + 'T00:00:00')}
                    </span>
                )}
                {search && (
                    <span className="results-chip">🔍 "{search}"</span>
                )}
            </div>

            {/* ── Table ── */}
            <div className="history-body">
                <div className="history-table-card">
                    <table className="history-table">
                        <thead>
                            <tr>
                                <th onClick={() => handleSort('queue_number')}>
                                    Ticket <SortIcon field="queue_number" />
                                </th>
                                <th onClick={() => handleSort('student_name')}>
                                    Student <SortIcon field="student_name" />
                                </th>
                                <th>Purpose</th>
                                <th onClick={() => handleSort('status')}>
                                    Status <SortIcon field="status" />
                                </th>
                                <th>Duration</th>
                                <th onClick={() => handleSort('updated_at')}>
                                    Finished At <SortIcon field="updated_at" />
                                </th>
                            </tr>
                        </thead>
                        <tbody>

                            {/* Skeleton loader */}
                            {loading && [...Array(6)].map((_, i) => (
                                <tr key={i} className="skeleton-row">
                                    <td><div className="skeleton-line" style={{ width: 40 }} /></td>
                                    <td><div className="skeleton-line" style={{ width: '70%' }} /></td>
                                    <td><div className="skeleton-line" style={{ width: '60%' }} /></td>
                                    <td><div className="skeleton-line" style={{ width: 70 }} /></td>
                                    <td><div className="skeleton-line" style={{ width: 40 }} /></td>
                                    <td><div className="skeleton-line" style={{ width: 60 }} /></td>
                                </tr>
                            ))}

                            {/* Rows */}
                            {!loading && filtered.length > 0 && filtered.map((row, i) => {
                                const mins     = getDuration(row);
                                const durClass = getDurationClass(mins);
                                const isDone   = row.status === 'completed';

                                return (
                                    <tr key={row.id} style={{ animationDelay: `${Math.min(i * 0.03, 0.25)}s` }}>

                                        {/* Ticket */}
                                        <td>
                                            <span className="ticket-num">#{row.queue_number}</span>
                                        </td>

                                        {/* Student */}
                                        <td>
                                            <div className="student-cell">
                                                <div className={`student-avatar ${isDone ? 'done' : 'cancel'}`}>
                                                    {getInitials(row.student_name)}
                                                </div>
                                                <div className="student-name-wrap">
                                                    <strong>{row.student_name}</strong>
                                                    {row.student_id && <span>{row.student_id}</span>}
                                                </div>
                                            </div>
                                        </td>

                                        {/* Purpose */}
                                        <td>
                                            <span className="purpose-cell">{row.purpose || '—'}</span>
                                        </td>

                                        {/* Status */}
                                        <td>
                                            <span className={`status-badge ${row.status}`}>
                                                {isDone
                                                    ? <CheckCircle size={12} />
                                                    : <XCircle size={12} />
                                                }
                                                {row.status}
                                            </span>
                                        </td>

                                        {/* Duration */}
                                        <td>
                                            {mins ? (
                                                <span className={`duration-badge ${durClass}`}>
                                                    <Clock size={12} />
                                                    {mins}m
                                                </span>
                                            ) : (
                                                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>—</span>
                                            )}
                                        </td>

                                        {/* Time */}
                                        <td>
                                            <span className="time-cell">{formatTime(row.updated_at)}</span>
                                        </td>

                                    </tr>
                                );
                            })}

                            {/* Empty */}
                            {!loading && filtered.length === 0 && (
                                <tr>
                                    <td colSpan={6}>
                                        <div className="history-empty">
                                            <div className="history-empty-icon">
                                                {search || statusFilter !== 'All' ? '🔍' : '📋'}
                                            </div>
                                            <h3>
                                                {search || statusFilter !== 'All'
                                                    ? 'No matching records'
                                                    : 'No history yet'}
                                            </h3>
                                            <p>
                                                {search || statusFilter !== 'All'
                                                    ? 'Try adjusting your filters.'
                                                    : filterDate
                                                        ? `No records found for ${formatDate(filterDate + 'T00:00:00')}.`
                                                        : 'Completed and cancelled tickets will appear here.'}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            )}

                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}