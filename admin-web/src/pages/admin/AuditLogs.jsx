import React, { useEffect, useState, useMemo } from 'react';
import axiosClient from '../../api/axios';
import '../../styles/auditlogs.css';

function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString([], {
        month: 'short', day: 'numeric', year: 'numeric',
    });
}
function formatTime(dateStr) {
    return new Date(dateStr).toLocaleTimeString([], {
        hour: '2-digit', minute: '2-digit',
    });
}
function formatKey(key) {
    return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

const ACTION_TYPES = ['All', 'updated', 'created', 'deleted', 'completed'];

export default function AuditLogs() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterAction, setFilterAction] = useState('All');
    const [filterDate, setFilterDate] = useState('');
    const [filterSearch, setFilterSearch] = useState('');
    const [expanded, setExpanded] = useState(null);

    useEffect(() => { getAuditLogs(); }, []);

    const getAuditLogs = async () => {
        try {
            const response = await axiosClient.get('/admin/audit-logs');
            setLogs(response.data.data);
        } catch (error) {
            console.error('Error fetching audit logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const filtered = useMemo(() => {
        return logs.filter(log => {
            const matchAction = filterAction === 'All' || log.description?.toLowerCase() === filterAction;
            const matchDate   = !filterDate || log.created_at?.startsWith(filterDate);
            const matchSearch = !filterSearch ||
                log.causer?.name?.toLowerCase().includes(filterSearch.toLowerCase()) ||
                String(log.subject_id).includes(filterSearch);
            return matchAction && matchDate && matchSearch;
        });
    }, [logs, filterAction, filterDate, filterSearch]);

    const counts = useMemo(() => {
        const c = {};
        logs.forEach(l => { const k = l.description?.toLowerCase() || 'other'; c[k] = (c[k] || 0) + 1; });
        return c;
    }, [logs]);

    const clearFilters = () => { setFilterAction('All'); setFilterDate(''); setFilterSearch(''); };
    const hasFilters = filterAction !== 'All' || filterDate || filterSearch;

    if (loading) return <div className="audit-loading">Accessing Security Vault</div>;

    return (
        <div className="audit-wrapper">

            {/* ── Header ── */}
            <header className="audit-header">
                <div className="header-gold-line" />
                <h2 style={{color :'Blue'}}>System Audit Trail</h2>
                <p style={{color :'Blue'}} >Real-time record of all staff actions and ticket changes.</p>
            </header>

            {/* ── Filter Bar ── */}
            <div className="audit-filter-bar">
                <div className="filter-row-top">
                    {/* Search */}
                    <div className="filter-search-wrap">
                        <span className="filter-icon">🔍</span>
                        <input
                            className="filter-input"
                            type="text"
                            placeholder="Search staff or ticket #"
                            value={filterSearch}
                            onChange={e => setFilterSearch(e.target.value)}
                        />
                    </div>

                    {/* Date */}
                    <div className="filter-search-wrap">
                        <span className="filter-icon">📅</span>
                        <input
                            className="filter-input filter-date"
                            type="date"
                            value={filterDate}
                            onChange={e => setFilterDate(e.target.value)}
                        />
                    </div>

                    {hasFilters && (
                        <button className="btn-clear" onClick={clearFilters}>✕ Clear</button>
                    )}
                </div>

                {/* Action pills */}
                <div className="filter-pills">
                    {ACTION_TYPES.map(type => (
                        <button
                            key={type}
                            className={`filter-pill ${filterAction === type ? 'active' : ''} pill-${type}`}
                            onClick={() => setFilterAction(type)}
                        >
                            {type === 'All' ? `All · ${logs.length}` : `${type} · ${counts[type] || 0}`}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Results label ── */}
            <div className="audit-results-bar">
                <span className="results-count">{filtered.length} record{filtered.length !== 1 ? 's' : ''}</span>
                {filterDate && (
                    <span className="results-chip">
                        📅 {new Date(filterDate + 'T00:00:00').toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}
                    </span>
                )}
            </div>

            {/* ── Grid ── */}
            <div className="audit-feed-wrapper">
                {filtered.length === 0 ? (
                    <div className="audit-empty">
                        <div className="audit-empty-icon">🔍</div>
                        <p>No records match your filters.</p>
                        <button className="btn-clear" onClick={clearFilters} style={{ margin: '12px auto 0', display: 'block' }}>Clear Filters</button>
                    </div>
                ) : (
                    <div className="audit-grid">
                        {filtered.map((log, i) => {
                            const isOpen = expanded === log.id;
                            const hasChanges = !!log.properties?.attributes;

                            return (
                                <div
                                    key={log.id}
                                    className={`audit-card ${isOpen ? 'is-open' : ''} ${hasChanges ? 'has-changes' : ''}`}
                                    style={{ animationDelay: `${Math.min(i * 0.03, 0.25)}s` }}
                                >
                                    <div
                                        className="audit-card-top"
                                        onClick={() => hasChanges && setExpanded(isOpen ? null : log.id)}
                                    >
                                        {/* Badge */}
                                        <span className={`audit-badge badge-${log.description?.toLowerCase()}`}>
                                            {log.description?.toUpperCase()}
                                        </span>

                                        {/* Ticket */}
                                        <span className="audit-ticket">#{log.subject_id}</span>

                                        {/* Spacer */}
                                        <div style={{ flex: 1 }} />

                                        {/* Right side */}
                                        <div className="audit-card-meta">
                                            <span className="audit-causer">{log.causer?.name || 'System'}</span>
                                            <span className="audit-ts">
                                                {formatTime(log.created_at)} · {formatDate(log.created_at)}
                                            </span>
                                        </div>

                                        {hasChanges && (
                                            <span className={`expand-chevron ${isOpen ? 'open' : ''}`}>›</span>
                                        )}
                                    </div>

                                    {/* Expandable diff */}
                                    {isOpen && hasChanges && (
                                        <div className="audit-diff">
                                            {Object.keys(log.properties.attributes).map(key => (
                                                <div key={key} className="change-row">
                                                    <span className="change-key">{formatKey(key)}</span>
                                                    <span className="old-val">{String(log.properties.old?.[key] ?? 'null')}</span>
                                                    <span className="arrow">→</span>
                                                    <span className="new-val">{String(log.properties.attributes[key])}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}