// src/pages/admin/QueueAnalytics.jsx
import React, { useEffect, useState, useMemo } from 'react';
import {
    LineChart, Line, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Legend
} from 'recharts';
import { Clock, Users, CheckCircle, TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react';
import '../../styles/analytics.css';
import axiosClient from '../../api/axios';

// ── Static scaffolding data (replace with API when ready) ──────────────────

const STATIC_STAFF = [
    { name: 'Maria Santos',   served: 142, avgTime: '4.2m' },
    { name: 'Juan dela Cruz', served: 118, avgTime: '5.1m' },
    { name: 'Ana Reyes',      served: 97,  avgTime: '3.8m' },
    { name: 'Carlo Mendoza',  served: 85,  avgTime: '6.0m' },
    { name: 'Luz Bautista',   served: 74,  avgTime: '4.7m' },
];

// Peak hours heatmap: rows = days, cols = time slots
const DAYS  = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const HOURS = ['8am', '9am', '10am', '11am', '1pm', '2pm', '3pm', '4pm'];
const HEAT_RAW = [
    [1, 3, 5, 4, 2, 2, 1, 0],
    [2, 4, 5, 5, 3, 3, 2, 1],
    [1, 2, 4, 3, 2, 1, 1, 0],
    [2, 3, 5, 4, 3, 2, 2, 1],
    [3, 5, 5, 4, 2, 2, 1, 0],
];

const DATE_RANGES = ['Today', '7 Days', '30 Days', '3 Months'];
const TABS = ['Overview', 'Staff Performance', 'Peak Hours'];

function getInitials(name = '') {
    return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

// Custom tooltip for recharts
function CustomTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
        <div style={{
            background: '#fff', border: '1px solid #e2e8f0',
            borderRadius: 10, padding: '10px 14px',
            boxShadow: '0 4px 18px rgba(26,58,107,0.11)',
            fontFamily: 'DM Sans, sans-serif', fontSize: '0.78rem'
        }}>
            <p style={{ fontWeight: 700, color: '#0f1f3d', marginBottom: 6 }}>{label}</p>
            {payload.map(p => (
                <p key={p.dataKey} style={{ color: p.color, margin: '2px 0' }}>
                    {p.name}: <strong>{p.value}</strong>
                </p>
            ))}
        </div>
    );
}

// ── Main Component ──────────────────────────────────────────────────────────

export default function QueueAnalytics() {
    const [data, setData]           = useState(null);
    const [loading, setLoading]     = useState(true);
    const [activeTab, setActiveTab] = useState('Overview');
    const [dateRange, setDateRange] = useState('7 Days');

    useEffect(() => { fetchAnalytics(); }, []);

    const fetchAnalytics = async () => {
        try {
            const response = await axiosClient.get('/admin/analytics/queue-stats');
            setData(response.data);
        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    // Derived: max served for progress bar
    const maxServed = useMemo(() =>
        Math.max(...STATIC_STAFF.map(s => s.served), 1), []);

    if (loading) return <div className="analytics-loading">Calculating School Metrics</div>;

    const summary  = data?.summary  || { avg_wait: 0, avg_service: 0, total: 0 };
    const chartData = data?.chartData || [];

    return (
        <div className="analytics-wrapper">

            {/* ── Header ── */}
            <header className="analytics-header">
                <div className="header-gold-line" />
                <h1 style={{color: 'blue'}}>Queue Analytics</h1>
                <p style={{color: 'blue'}} >Trinidad Municipal College · Registrar Queue Intelligence</p>
            </header>

            {/* ── Tabs ── */}
            <div className="analytics-tabs">
                {TABS.map(tab => (
                    <button
                        key={tab}
                        className={`analytics-tab ${activeTab === tab ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* ── Date Range ── */}
            <div className="date-range-bar">
                {DATE_RANGES.map((r, i) => (
                    <React.Fragment key={r}>
                        <button
                            className={`date-range-btn ${dateRange === r ? 'active' : ''}`}
                            onClick={() => setDateRange(r)}
                        >
                            {r}
                        </button>
                        {i < DATE_RANGES.length - 1 && <span className="date-range-sep">·</span>}
                    </React.Fragment>
                ))}
            </div>

            {/* ── Body ── */}
            <div className="analytics-body">

                {/* ── OVERVIEW TAB ── */}
                {activeTab === 'Overview' && (
                    <>
                        <div>
                            <p className="section-label">Key Metrics · {dateRange}</p>
                            <div className="kpi-grid">
                                <KpiCard
                                    label="Avg Wait Time"
                                    value={`${summary.avg_wait}m`}
                                    icon={<Clock size={18} />}
                                    color="gold"
                                    trend="down"
                                    trendLabel="12% vs last week"
                                    sub="Target: under 10 min"
                                />
                                <KpiCard
                                    label="Avg Service Time"
                                    value={`${summary.avg_service}m`}
                                    icon={<CheckCircle size={18} />}
                                    color="green"
                                    trend="flat"
                                    trendLabel="Stable"
                                    sub="Per transaction"
                                />
                                <KpiCard
                                    label="Total Students"
                                    value={summary.total}
                                    icon={<Users size={18} />}
                                    color="blue"
                                    trend="up"
                                    trendLabel="8% vs last week"
                                    sub="Served this period"
                                />
                                <KpiCard
                                    label="Queue Dropout"
                                    value="4.2%"
                                    icon={<AlertCircle size={18} />}
                                    color="red"
                                    trend="down"
                                    trendLabel="3% improvement"
                                    sub="Left before serving"
                                />
                            </div>
                        </div>

                        {/* Chart — full width */}
                        <div className="panel-card full">
                            <div className="panel-header">
                                <span className="panel-title">
                                    <span className="panel-title-dot" />
                                    Volume vs. Wait Time Trend
                                </span>
                                <span className="panel-badge">Live</span>
                            </div>
                            <div className="panel-body">
                                <div className="chart-container">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                                            <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                                            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Legend wrapperStyle={{ fontSize: '0.76rem', paddingTop: 12 }} />
                                            <Line
                                                yAxisId="left"
                                                type="monotone"
                                                dataKey="total_students"
                                                stroke="#1a3a6b"
                                                strokeWidth={2.5}
                                                dot={{ r: 3, fill: '#1a3a6b' }}
                                                activeDot={{ r: 5 }}
                                                name="Students"
                                            />
                                            <Line
                                                yAxisId="right"
                                                type="monotone"
                                                dataKey="avg_wait_time"
                                                stroke="#f5c518"
                                                strokeWidth={2.5}
                                                dot={{ r: 3, fill: '#f5c518' }}
                                                activeDot={{ r: 5 }}
                                                name="Wait Time (min)"
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        {/* Two-column row */}
                        <div className="analytics-row">
                            {/* Bar chart */}
                            <div className="panel-card">
                                <div className="panel-header">
                                    <span className="panel-title">
                                        <span className="panel-title-dot" />
                                        Daily Volume
                                    </span>
                                </div>
                                <div className="panel-body">
                                    <div className="chart-container" style={{ height: 200 }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                                                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                                                <Tooltip content={<CustomTooltip />} />
                                                <Bar dataKey="total_students" fill="#1a3a6b" radius={[4, 4, 0, 0]} name="Students" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>

                            {/* Top staff preview */}
                            <div className="panel-card">
                                <div className="panel-header">
                                    <span className="panel-title">
                                        <span className="panel-title-dot" />
                                        Top Staff Today
                                    </span>
                                </div>
                                <div className="panel-body" style={{ padding: '12px 16px' }}>
                                    <table className="staff-table">
                                        <tbody>
                                            {STATIC_STAFF.slice(0, 4).map((s, i) => (
                                                <tr key={s.name}>
                                                    <td><span className={`staff-rank ${i === 0 ? 'top' : ''}`}>{i + 1}</span></td>
                                                    <td>
                                                        <div className="staff-name-cell">
                                                            <div className="staff-mini-avatar">{getInitials(s.name)}</div>
                                                            {s.name.split(' ')[0]}
                                                        </div>
                                                    </td>
                                                    <td><span className="staff-served">{s.served}</span></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* ── STAFF PERFORMANCE TAB ── */}
                {activeTab === 'Staff Performance' && (
                    <div className="panel-card full">
                        <div className="panel-header">
                            <span className="panel-title">
                                <span className="panel-title-dot" />
                                Staff Leaderboard
                            </span>
                            <span className="panel-badge">{dateRange}</span>
                        </div>
                        <div className="panel-body" style={{ padding: 0 }}>
                            <table className="staff-table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Staff Member</th>
                                        <th>Tickets Served</th>
                                        <th>Avg Service Time</th>
                                        <th style={{ width: '35%' }}>Load Share</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {STATIC_STAFF.map((s, i) => (
                                        <tr key={s.name}>
                                            <td><span className={`staff-rank ${i === 0 ? 'top' : ''}`}>{i + 1}</span></td>
                                            <td>
                                                <div className="staff-name-cell">
                                                    <div className="staff-mini-avatar">{getInitials(s.name)}</div>
                                                    {s.name}
                                                </div>
                                            </td>
                                            <td><span className="staff-served">{s.served}</span></td>
                                            <td style={{ color: '#475569', fontSize: '0.82rem' }}>{s.avgTime}</td>
                                            <td>
                                                <div className="progress-wrap">
                                                    <div className="progress-bar">
                                                        <div
                                                            className="progress-fill"
                                                            style={{ width: `${Math.round(s.served / maxServed * 100)}%` }}
                                                        />
                                                    </div>
                                                    <span className="progress-pct">
                                                        {Math.round(s.served / maxServed * 100)}%
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* ── PEAK HOURS TAB ── */}
                {activeTab === 'Peak Hours' && (
                    <div className="panel-card full">
                        <div className="panel-header">
                            <span className="panel-title">
                                <span className="panel-title-dot" />
                                Peak Hours Heatmap
                            </span>
                            <span className="panel-badge">Weekly Pattern</span>
                        </div>
                        <div className="panel-body">
                            <div className="heatmap-grid">
                                {/* Column headers */}
                                <div />
                                {HOURS.map(h => (
                                    <div key={h} className="heatmap-col-label">{h}</div>
                                ))}
                                {/* Rows */}
                                {DAYS.map((day, di) => (
                                    <React.Fragment key={day}>
                                        <div className="heatmap-label">{day}</div>
                                        {HEAT_RAW[di].map((val, hi) => (
                                            <div
                                                key={hi}
                                                className={`heat-cell heat-${val}`}
                                                title={`${day} ${HOURS[hi]}: ${['Quiet','Light','Moderate','Busy','Very Busy','Peak'][val]}`}
                                            />
                                        ))}
                                    </React.Fragment>
                                ))}
                            </div>

                            {/* Legend */}
                            <div style={{ display: 'flex', gap: 10, marginTop: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Volume:</span>
                                {['Quiet', 'Light', 'Moderate', 'Busy', 'Very Busy', 'Peak'].map((label, i) => (
                                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                        <div className={`heat-cell heat-${i}`} style={{ width: 16, height: 16, borderRadius: 4 }} />
                                        <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}

// ── KPI Card Sub-component ──────────────────────────────────────────────────

function KpiCard({ label, value, icon, color, trend, trendLabel, sub }) {
    const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

    return (
        <div className={`kpi-card ${color}`}>
            <div className="kpi-top">
                <div className="kpi-icon">{icon}</div>
                <div className={`kpi-trend ${trend}`}>
                    <TrendIcon size={11} />
                    {trendLabel}
                </div>
            </div>
            <div className="kpi-value">{value}</div>
            <div className="kpi-label">{label}</div>
            {sub && <div className="kpi-sub">{sub}</div>}
        </div>
    );
}