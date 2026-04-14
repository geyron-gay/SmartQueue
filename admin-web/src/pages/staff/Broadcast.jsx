import React, { useState, useRef, useEffect } from 'react';
import { Megaphone, Send, AlertTriangle, Info, ShieldAlert, Clock, Monitor } from 'lucide-react';
import axiosClient from '../../api/axios';
import '../../styles/broadcast.css';

// ── Static data ───────────────────────────────────────────────────────────────

const QUICK_TEMPLATES = [
    { label: '🔧 Maintenance',  text: 'Registrar window is temporarily closed for maintenance. Please wait.' },
    { label: '⏸ Short Break',   text: 'Short break in progress. Service will resume in 15 minutes.' },
    { label: '⚡ System Slow',  text: 'Our system is running slow. Thank you for your patience.' },
    { label: '✅ Back Online',   text: 'Service has resumed. Please proceed to your assigned window.' },
    { label: '🚨 Emergency',    text: 'Emergency situation. Please evacuate calmly and follow staff instructions.' },
];

const TARGET_OPTIONS = ['All Screens', 'Lobby Monitor', 'Window 1', 'Window 2', 'Queue Board'];

// Static broadcast history (replace with API when ready)
const STATIC_HISTORY = [
    { id: 1, type: 'info',      message: 'Service has resumed. Please proceed to your assigned window.',     time: '2:45 PM',  target: 'All Screens' },
    { id: 2, type: 'warning',   message: 'Short break in progress. Service will resume in 15 minutes.',      time: '1:30 PM',  target: 'Lobby Monitor' },
    { id: 3, type: 'emergency', message: 'Emergency drill in progress. Please remain calm and stay seated.',  time: '11:02 AM', target: 'All Screens' },
    { id: 4, type: 'info',      message: 'Registrar window is temporarily closed for maintenance.',           time: '9:15 AM',  target: 'Window 1' },
];

const MAX_CHARS = 200;

// ── Type config ───────────────────────────────────────────────────────────────
const TYPES = [
    { value: 'info',      label: 'Info',      icon: Info,         color: 'info'      },
    { value: 'warning',   label: 'Warning',   icon: AlertTriangle, color: 'warning'   },
    { value: 'emergency', label: 'Emergency', icon: ShieldAlert,  color: 'emergency' },
];

// ── Main Component ────────────────────────────────────────────────────────────
export default function Broadcast() {
    const [message, setMessage]   = useState('');
    const [type, setType]         = useState('info');
    const [target, setTarget]     = useState('All Screens');
    const [loading, setLoading]   = useState(false);
    const [history, setHistory]   = useState([]);
    const [totalSent, setTotalSent] = useState(0);
    const [totalToday, setTotalToday] = useState(0);
    const [emergCount, setEmergCount] = useState(0);
    const [infoCount, setInfoCount] = useState(0);
    const [warningCount, setWarningCount] = useState(0);
    const [lastTime, setLastTime] = useState('—');
    const [toastMsg, setToastMsg] = useState('');
    const [toastVisible, setToastVisible] = useState(false);
    const toastTimer = useRef(null);

    const charsLeft   = MAX_CHARS - message.length;
    const charClass   = charsLeft <= 0 ? 'at-limit' : charsLeft <= 30 ? 'near-limit' : '';

    const showToast = (msg) => {
        setToastMsg(msg);
        setToastVisible(true);
        clearTimeout(toastTimer.current);
        toastTimer.current = setTimeout(() => setToastVisible(false), 3000);
    };

    useEffect(() => {
       fetchHistory();
    }, []);

    const fetchHistory = async () => {
    try {
        const response = await axiosClient.get('/broadcast/history');
        const { history, totalSent, totalToday, emergCount, infoCount, warningCount, lastTime } = response.data;

        setHistory(history);
        setTotalSent(totalSent);
        setTotalToday(totalToday);
        setEmergCount(emergCount);
        setInfoCount(infoCount);
        setWarningCount(warningCount);
        setLastTime(lastTime);
    } catch (error) {
        console.error('Failed to fetch broadcast history', error);
    }
};

    const handleSend = async (e) => {
        e.preventDefault();
        if (!message.trim()) return;

        setLoading(true);
        try {
            await axiosClient.post('/broadcast', { message, type, target });

            // Prepend to local history
            const newEntry = {
                id: Date.now(),
                type,
                message,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                target,
            };
            setHistory(prev => [newEntry, ...prev.slice(0, 9)]);
            setMessage('');
            showToast('✅ Broadcast pushed to all screens!');
        } catch (error) {
            console.error('Broadcast failed', error);
            showToast('❌ Failed to send. Try again.');
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="bc-wrapper">

            {/* ── Header ── */}
            <header className="bc-header">
                <div className="header-gold-line" />
                <h1 style={{color:'blue'}}>Public Broadcast</h1>
                <p style={{color:'blue'}} > Push real-time announcements to all student monitors.</p>
            </header>

            {/* ── Stats Strip ── */}
            <div className="bc-stats-strip">
                <div className="bc-stat">
                    <span className="bc-stat-label">Total Sent Today</span>
                    <span className="bc-stat-value">{totalSent}</span>
                </div>
                <div className="bc-stat">
                    <span className="bc-stat-label">Emergency Alerts</span>
                    <span className="bc-stat-value red">{emergCount}</span>
                </div>
                <div className="bc-stat">
                    <span className="bc-stat-label">Screens Online</span>
                    <span className="bc-stat-value green">4</span>
                </div>
                <div className="bc-stat">
                    <span className="bc-stat-label">Last Broadcast</span>
                    <span className="bc-stat-value gold" style={{ fontSize: '1rem', paddingTop: 2 }}>{lastTime}</span>
                </div>
            </div>

            {/* ── Body ── */}
            <div className="bc-body">

                {/* ── LEFT: Composer ── */}
                <div className="bc-panel">
                    <div className="bc-panel-header">
                        <div className="bc-panel-dot" />
                        <span className="bc-panel-title">Create Announcement</span>
                    </div>
                    <div className="bc-panel-body">
                        <form onSubmit={handleSend}>

                            {/* Type selector */}
                            <div className="type-selector">
                                {TYPES.map(({ value, label, icon: Icon }) => (
                                    <label
                                        key={value}
                                        className={`type-card ${type === value ? `active-${value}` : ''}`}
                                        onClick={() => setType(value)}
                                    >
                                        <input type="radio" name="type" value={value} readOnly checked={type === value} />
                                        <Icon size={20} />
                                        <span>{label}</span>
                                    </label>
                                ))}
                            </div>

                            {/* Quick templates */}
                            <div className="templates-section">
                                <p className="templates-label">⚡ Quick Templates</p>
                                <div className="template-chips">
                                    {QUICK_TEMPLATES.map(tpl => (
                                        <button
                                            key={tpl.label}
                                            type="button"
                                            className="template-chip"
                                            onClick={() => setMessage(tpl.text)}
                                        >
                                            {tpl.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Message textarea */}
                            <div className="bc-textarea-wrap">
                                <textarea
                                    className="bc-textarea"
                                    placeholder="Type your announcement (or pick a template above)..."
                                    value={message}
                                    maxLength={MAX_CHARS}
                                    onChange={e => setMessage(e.target.value)}
                                />
                                <span className={`bc-char-count ${charClass}`}>
                                    {charsLeft}/{MAX_CHARS}
                                </span>
                            </div>

                            {/* Send button */}
                            <button
                                type="submit"
                                disabled={loading || !message.trim()}
                                className={`bc-send-btn type-${type}`}
                            >
                                {loading
                                    ? <><div className="btn-spinner" /> Pushing...</>
                                    : <><Send size={16} /> Push to {target}</>
                                }
                            </button>
                        </form>
                    </div>
                </div>

                {/* ── RIGHT: Preview + History ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                    {/* Live Preview */}
                    <div className="bc-panel">
                        <div className="bc-panel-header">
                            <div className="bc-panel-dot" />
                            <span className="bc-panel-title">Live Preview</span>
                            <Monitor size={14} style={{ marginLeft: 'auto', color: '#61004a' }} />
                        </div>
                        <div className="bc-panel-body">
                            <div className="preview-screen">
                                <div className="preview-scanline" />
                                <div key={message + type} className={`preview-banner ${type}`}>
                                    <div className="preview-icon-wrap">
                                        {type === 'info'      && <Info size={20} />}
                                        {type === 'warning'   && <AlertTriangle size={20} />}
                                        {type === 'emergency' && <ShieldAlert size={20} />}
                                    </div>
                                    <div className="preview-text">
                                        <p className="preview-notice-label">{type} notice · {target}</p>
                                        {message
                                            ? <p className="preview-message">{message}</p>
                                            : <p className="preview-placeholder">Your announcement will appear here...</p>
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recent Broadcasts */}
                    <div className="bc-panel">
                        <div className="bc-panel-header">
                            <div className="bc-panel-dot" />
                            <span className="bc-panel-title">Recent Broadcasts</span>
                            <Clock size={14} style={{ marginLeft: 'auto', color: '#94a3b8' }} />
                        </div>
                        <div className="bc-panel-body" style={{ padding: '12px 16px' }}>
                            <div className="bc-history">
                                {history.slice(0, 5).map((item, i) => (
                                    <div
                                        key={item.id}
                                        className="bc-history-item"
                                        style={{ animationDelay: `${i * 0.04}s` }}
                                    >
                                        <div className={`history-type-dot ${item.type}`} />
                                        <span className="history-msg">{item.message}</span>
                                        <div className="history-meta">
                                            <span className="history-time">{item.time}</span>
                                            <span className={`history-badge ${item.type}`}>{item.type}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* ── Toast ── */}
            <div className={`bc-toast ${toastVisible ? 'visible' : ''}`}>
                {toastMsg}
            </div>
        </div>
    );
}