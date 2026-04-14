// src/pages/admin/StaffPerformance.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { Clock, Search, TrendingUp, Users, Zap, Award } from 'lucide-react';
import axiosClient from '../../api/axios';
import '../../styles/staffperformance.css';

// ── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name = '') {
    return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

/** Returns efficiency tier based on avg service time (mins) */
function getEfficiency(avgTime) {
    if (avgTime <= 5)  return { label: 'Excellent', tier: 'excellent' };
    if (avgTime <= 8)  return { label: 'Good',      tier: 'good'      };
    if (avgTime <= 12) return { label: 'Average',   tier: 'average'   };
    return               { label: 'Slow',       tier: 'slow'      };
}

const DATE_RANGES = ['Today', '7 Days', '30 Days', 'All Time'];

const RANK_STYLE = {
    0: { cls: 'gold',   icon: '🥇' },
    1: { cls: 'silver', icon: '🥈' },
    2: { cls: 'bronze', icon: '🥉' },
};

const PODIUM_ORDER = [1, 0, 2]; // silver left, gold center, bronze right

// ── Main Component ────────────────────────────────────────────────────────────

export default function StaffPerformance() {
    const [staffData, setStaffData]   = useState([]);
    const [loading, setLoading]       = useState(true);
    const [dateRange, setDateRange]   = useState('7 Days');
    const [search, setSearch]         = useState('');

    useEffect(() => { getAnalytics(); }, []);

    const getAnalytics = async () => {
        try {
            const response = await axiosClient.get('admin/analytics/staff-performance');
            setStaffData(response.data);
        } catch (error) {
            console.error('Error fetching staff performance:', error);
        } finally {
            setLoading(false);
        }
    };

    // ── Derived ──
    const sorted = useMemo(() =>
        [...staffData].sort((a, b) => b.total_served - a.total_served),
    [staffData]);

    const filtered = useMemo(() =>
        sorted.filter(s =>
            !search || s.staff_name?.toLowerCase().includes(search.toLowerCase()) ||
            s.department?.toLowerCase().includes(search.toLowerCase())
        ),
    [sorted, search]);

    const maxServed = useMemo(() =>
        Math.max(...sorted.map(s => s.total_served), 1),
    [sorted]);

    // KPI aggregates
    const totalServed   = sorted.reduce((s, x) => s + (x.total_served || 0), 0);
    const avgServiceAll = sorted.length
        ? (sorted.reduce((s, x) => s + (x.avg_service_time || 0), 0) / sorted.length).toFixed(1)
        : '—';
    const topPerformer  = sorted[0]?.staff_name?.split(' ')[0] || '—';
    const excellentCount = sorted.filter(s => getEfficiency(s.avg_service_time).tier === 'excellent').length;

    if (loading) return <div className="sp-loading">Loading Staff Performance</div>;

    const top3 = sorted.slice(0, 3);

    return (
        <div className="sp-wrapper">

            {/* ── Header ── */}
            <header className="sp-header">
                <div className="header-gold-line" />
                <h1 style={{color : "blue"}}>Staff Performance Leaderboard</h1>
                <p style={{color : "blue"}} >Trinidad Municipal College · Registrar Operations</p>
            </header>

            {/* ── KPI Strip ── */}
            <div className="sp-kpi-strip">
                <div className="sp-kpi-item">
                    <span className="sp-kpi-label">Total Served</span>
                    <span className="sp-kpi-value">{totalServed}</span>
                </div>
                <div className="sp-kpi-item">
                    <span className="sp-kpi-label">Avg Service Time</span>
                    <span className="sp-kpi-value gold">{avgServiceAll}m</span>
                </div>
                <div className="sp-kpi-item">
                    <span className="sp-kpi-label">Top Performer</span>
                    <span className="sp-kpi-value" style={{ fontSize: '1rem', paddingTop: 3 }}>🏆 {topPerformer}</span>
                </div>
                <div className="sp-kpi-item">
                    <span className="sp-kpi-label">Excellent Staff</span>
                    <span className="sp-kpi-value green">{excellentCount}</span>
                </div>
            </div>

            {/* ── Controls ── */}
            <div className="sp-controls">
                {/* {DATE_RANGES.map((r, i) => (
                    <React.Fragment key={r}>
                        <button
                            className={`sp-range-btn ${dateRange === r ? 'active' : ''}`}
                            onClick={() => setDateRange(r)}
                        >
                            {r}
                        </button>
                        {i < DATE_RANGES.length - 1 && (
                            <span className="sp-controls-sep">·</span>
                        )}
                    </React.Fragment>
                ))} */}

                <div className="sp-search-wrap">
                    <Search size={14} className="sp-search-icon" />
                    <input
                        className="sp-search"
                        type="text"
                        placeholder="Filter staff..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* ── Body ── */}
            <div className="sp-body">

                {/* ── Podium (top 3) ── */}
                {top3.length >= 3 && !search && (
                    <>
                        <p className="section-label">Top Performers · {dateRange}</p>
                        <div className="sp-podium">
                            {PODIUM_ORDER.map(pos => {
                                const staff = top3[pos];
                                if (!staff) return null;
                                const rank = pos + 1;
                                return (
                                    <div
                                        key={staff.staff_name}
                                        className={`podium-card rank-${rank}`}
                                        style={{ animationDelay: `${pos * 0.07}s` }}
                                    >
                                        {rank === 1 && <span className="podium-crown">👑</span>}
                                        <div className="podium-avatar">{getInitials(staff.staff_name)}</div>
                                        <p className="podium-name">{staff.staff_name}</p>
                                        <p className="podium-dept">{staff.department}</p>
                                        <span className="podium-served">{staff.total_served}</span>
                                        <span className="podium-served-label">Tickets Served</span>
                                        <div className="podium-rank-badge">{rank}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}

                {/* ── Full Table ── */}
                <p className="section-label" style={{ marginTop: top3.length >= 3 && !search ? 28 : 0 }}>
                    Full Rankings · {filtered.length} staff
                </p>

                {filtered.length === 0 ? (
                    <div className="sp-empty">
                        <div className="sp-empty-icon">🔍</div>
                        <p>No staff match "{search}"</p>
                    </div>
                ) : (
                    <div className="sp-table-card">
                        <table className="sp-table">
                            <thead>
                                <tr>
                                    <th style={{ width: 40 }}>#</th>
                                    <th>Staff Member</th>
                                    <th>Department</th>
                                    <th className="center">Served</th>
                                    <th>Avg Time</th>
                                    <th>Rating</th>
                                    <th>Load</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((staff, index) => {
                                    const globalRank = sorted.indexOf(staff);
                                    const rankStyle  = RANK_STYLE[globalRank] || {};
                                    const eff        = getEfficiency(staff.avg_service_time);
                                    const loadPct    = Math.round((staff.total_served / maxServed) * 100);

                                    return (
                                        <tr key={staff.staff_name + index} style={{ animationDelay: `${index * 0.03}s` }}>
                                            {/* Rank */}
                                            <td>
                                                <span className={`sp-rank ${rankStyle.cls || ''}`}>
                                                    {rankStyle.icon || globalRank + 1}
                                                </span>
                                            </td>

                                            {/* Name */}
                                            <td>
                                                <div className="sp-staff-cell">
                                                    <div className={`sp-avatar ${globalRank === 0 ? 'top' : ''}`}>
                                                        {getInitials(staff.staff_name)}
                                                    </div>
                                                    <span className="sp-name">{staff.staff_name}</span>
                                                </div>
                                            </td>

                                            {/* Dept */}
                                            <td>
                                                <span className="sp-dept-badge">{staff.department}</span>
                                            </td>

                                            {/* Served */}
                                            <td className="center" style={{ textAlign: 'center' }}>
                                                <span className="sp-served-badge">{staff.total_served}</span>
                                            </td>

                                            {/* Avg time */}
                                            <td>
                                                <div className="sp-time-cell">
                                                    <Clock size={13} />
                                                    <span>{staff.avg_service_time}m</span>
                                                </div>
                                            </td>

                                            {/* Efficiency tag */}
                                            <td>
                                                <span className={`sp-eff-tag ${eff.tier}`}>{eff.label}</span>
                                            </td>

                                            {/* Load progress */}
                                            <td>
                                                <div className="sp-progress-wrap">
                                                    <div className="sp-progress-bar-bg">
                                                        <div
                                                            className={`sp-progress-fill ${eff.tier}`}
                                                            style={{ width: `${loadPct}%` }}
                                                        />
                                                    </div>
                                                    <span className="sp-progress-pct">{loadPct}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}