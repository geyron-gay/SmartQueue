import React, { useEffect, useState } from 'react';
import { Clock, CheckCircle, XCircle, Filter, Download,Calendar as CalendarIcon, RotateCcw } from 'lucide-react';
import api from '../api/axios'; // Your axios instance
import '../styles/history.css';
import axiosClient from '../api/axios';

export default function QueueHistory() {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterDate, setFilterDate] = useState('');

    useEffect(() => {
        fetchHistory();
    }, [filterDate]);
const fetchHistory = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/staff/history?date=${filterDate}`);
            setHistory(response.data.data || response.data);
        } catch (error) {
            console.error("History fetch failed", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="history-container">
            <header className="history-header">
                <div>
                    <h1>Queue History</h1>
                    <p>Review completed and cancelled sessions for today.</p>
                </div>

                <div className="filter-actions">
                    <div className="date-input-wrapper">
                        <CalendarIcon size={16} className="calendar-icon" />
                        <input 
                            type="date" 
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                            className="history-date-picker"
                        />
                    </div>
                    {filterDate && (
                        <button className="reset-btn" onClick={() => setFilterDate('')}>
                            <RotateCcw size={16} /> Reset
                        </button>
                    )}
                </div>

                
                <button className="export-btn">
                    <Download size={18} /> Export CSV
                </button>
            </header>

            <div className="history-table-wrapper">
                <table className="history-table">
                    <thead>
                        <tr>
                            <th>Ticket</th>
                            <th>Student Name</th>
                            <th>Purpose</th>
                            <th>Status</th>
                            <th>Finished At</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="5" className="loading-text">Loading History...</td></tr>
                        ) : history.length > 0 ? (
                            history.map((row) => (
                                <tr key={row.id}>
                                    <td className="ticket-cell">#{row.queue_number}</td>
                                    <td>
                                        <div className="student-name-cell">
                                            <strong>{row.student_name}</strong>
                                            <span>{row.student_id}</span>
                                        </div>
                                    </td>
                                    <td>{row.purpose}</td>
                                    <td>
                                        <span className={`status-badge ${row.status}`}>
                                            {row.status === 'completed' ? <CheckCircle size={14} /> : <XCircle size={14} />}
                                            {row.status}
                                        </span>
                                    </td>
                                    <td>{new Date(row.updated_at).toLocaleTimeString()}</td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan="5" className="empty-history">No history found for today.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}