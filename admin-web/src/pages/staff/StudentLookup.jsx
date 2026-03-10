import React, { useState, useEffect, useMemo } from 'react';
import { Search, Tag, Calendar, AlertCircle, Hash, Clock } from 'lucide-react';
import '../../styles/lookup.css';
import axiosClient from '../../api/axios';

// ── Static recent searches (replace with localStorage/API when ready) ──────
const RECENT_SEARCHES = [
    '2024-001234', 'Maria Santos', '2024-005678', 'Juan dela Cruz',
];

const STATUS_FILTERS = ['All', 'pending', 'serving', 'completed', 'cancelled'];

function getInitials(name = '') {
    return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

// ── Skeleton Card ────────────────────────────────────────────────────────────
function SkeletonCard() {
    return (
        <div className="skeleton-card">
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                <div className="skeleton-line" style={{ width: 42, height: 42, borderRadius: 11, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                    <div className="skeleton-line" style={{ width: '65%', height: 13, marginBottom: 7 }} />
                    <div className="skeleton-line" style={{ width: '40%', height: 11 }} />
                </div>
            </div>
            <div className="skeleton-line" style={{ width: '80%', height: 11, marginBottom: 8 }} />
            <div className="skeleton-line" style={{ width: '60%', height: 11, marginBottom: 8 }} />
            <div className="skeleton-line" style={{ width: '70%', height: 11 }} />
        </div>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function StudentLookup() {
    const [query, setQuery]           = useState('');
    const [results, setResults]       = useState([]);
    const [loading, setLoading]       = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [statusFilter, setStatusFilter] = useState('All');

    // Debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            if (query.trim().length >= 3) {
                handleSearch(query.trim());
            } else {
                setResults([]);
                setHasSearched(false);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [query]);

    const handleSearch = async (q) => {
        setLoading(true);
        setHasSearched(true);
        try {
            const result = await axiosClient.get(`/staff/lookup?query=${q}`);
            setResults(result.data);
        } catch (error) {
            console.error('Lookup failed', error);
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    // Client-side status filter
    const filtered = useMemo(() => {
        if (statusFilter === 'All') return results;
        return results.filter(r => r.status?.toLowerCase() === statusFilter);
    }, [results, statusFilter]);

    const clearSearch = () => {
        setQuery('');
        setResults([]);
        setHasSearched(false);
        setStatusFilter('All');
    };

    const statusCounts = useMemo(() => {
        const c = {};
        results.forEach(r => {
            const k = r.status?.toLowerCase() || 'unknown';
            c[k] = (c[k] || 0) + 1;
        });
        return c;
    }, [results]);

    return (
        <div className="lookup-wrapper">

            {/* ── Header ── */}
            <header className="lookup-header">
                <div className="header-gold-line" />
                <h1 style={{color : "blue"}}>Student Record Lookup</h1>
                <p style={{color : "blue"}}>Trinidad Municipal College · Registrar Queue Records</p>
            </header>

            {/* ── Search Section ── */}
            <div className="lookup-search-section">
                <div className="search-bar-wrap">
                    <Search className="search-icon-left" size={18} />
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Search by Student ID or Name (min. 3 characters)..."
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        autoFocus
                    />
                    {loading && <div className="search-spinner" />}
                    {!loading && query && (
                        <button className="search-clear" onClick={clearSearch} title="Clear search">✕</button>
                    )}
                </div>

                {/* Status filter chips */}
                {hasSearched && results.length > 0 && (
                    <div className="lookup-filters">
                        <span className="filter-label">Filter:</span>
                        {STATUS_FILTERS.map(s => (
                            <button
                                key={s}
                                className={`filter-chip chip-${s} ${statusFilter === s ? 'active' : ''}`}
                                onClick={() => setStatusFilter(s)}
                            >
                                {s === 'All'
                                    ? `All · ${results.length}`
                                    : `${s} · ${statusCounts[s] || 0}`}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Results count bar ── */}
            {hasSearched && !loading && (
                <div className="lookup-results-bar">
                    <span className="results-count">
                        {filtered.length} record{filtered.length !== 1 ? 's' : ''} found
                    </span>
                    {query && (
                        <span className="results-query-chip">🔍 "{query}"</span>
                    )}
                </div>
            )}

            {/* ── Body ── */}
            <div className="lookup-body">

                {/* Idle: show recent searches */}
                {!hasSearched && !loading && (
                    <div className="recent-section">
                        <p className="section-label" style={{
                            fontSize: '0.68rem', fontWeight: 700,
                            textTransform: 'uppercase', letterSpacing: '0.1em',
                            color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10
                        }}>
                            Recent Searches
                            <span style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
                        </p>
                        <div className="recent-chips">
                            {RECENT_SEARCHES.map(term => (
                                <button
                                    key={term}
                                    className="recent-chip"
                                    onClick={() => setQuery(term)}
                                >
                                    <span className="recent-chip-icon">🕒</span>
                                    {term}
                                </button>
                            ))}
                        </div>

                        {/* Idle empty state */}
                        <div className="lookup-empty" style={{ marginTop: 32 }}>
                            <div className="lookup-empty-icon">🎓</div>
                            <h3>Search Student Records</h3>
                            <p>Enter a Student ID (e.g. 2024-001234) or full name to begin.</p>
                        </div>
                    </div>
                )}

                {/* Loading skeleton */}
                {loading && (
                    <div className="skeleton-grid">
                        {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
                    </div>
                )}

                {/* Results */}
                {!loading && hasSearched && filtered.length > 0 && (
                    <div className="results-grid">
                        {filtered.map((record, i) => (
                            <StudentCard
                                key={record.id}
                                record={record}
                                index={i}
                            />
                        ))}
                    </div>
                )}

                {/* No results */}
                {!loading && hasSearched && filtered.length === 0 && results.length === 0 && (
                    <div className="lookup-empty">
                        <div className="lookup-empty-icon">🔍</div>
                        <h3>No Records Found</h3>
                        <p>No student records match "<strong>{query}</strong>".<br />Try a different ID or name.</p>
                    </div>
                )}

                {/* No results after filter */}
                {!loading && hasSearched && filtered.length === 0 && results.length > 0 && (
                    <div className="lookup-empty">
                        <div className="lookup-empty-icon">⚙️</div>
                        <h3>No "{statusFilter}" Records</h3>
                        <p>Try a different status filter.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Student Card Sub-component ────────────────────────────────────────────────
function StudentCard({ record, index }) {
    const status = record.status?.toLowerCase() || 'pending';

    return (
        <div
            className="student-card"
            style={{ animationDelay: `${Math.min(index * 0.04, 0.24)}s` }}
        >
            {/* Header */}
            <div className="card-header">
                <div className="student-avatar">{getInitials(record.student_name)}</div>
                <div className="student-info">
                    <p className="student-name">{record.student_name}</p>
                    <span className="student-id">{record.student_id}</span>
                </div>
                <span className={`status-pill ${status}`}>{status}</span>
            </div>

            {/* Body */}
            <div className="card-body">
                <div className="card-body-row">
                    <Tag size={13} />
                    <span>{record.department || '—'}</span>
                </div>
                <div className="card-body-row">
                    <AlertCircle size={13} />
                    <span>Purpose: <strong>{record.purpose || '—'}</strong></span>
                </div>
                <div className="card-body-row">
                    <Calendar size={13} />
                    <span>{new Date(record.created_at).toLocaleDateString('en-PH', {
                        month: 'short', day: 'numeric', year: 'numeric'
                    })}</span>
                </div>
            </div>

            {/* Footer */}
            <div className="card-footer">
                <div className="ticket-number">
                    <Hash size={13} />
                    Ticket {record.queue_number}
                </div>
                <span className="ticket-badge">
                    {status === 'serving' ? '⚡ Now Serving' :
                     status === 'completed' ? '✓ Done' :
                     status === 'cancelled' ? '✕ Cancelled' : '⏳ Waiting'}
                </span>
            </div>
        </div>
    );
}