// LogModal.jsx
import React from 'react';
import '../../styles/LogModal.css';

export default function LogModal({ staff, logs, onClose }) {
    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>Activity Logs: {staff.name}</h2>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>
                <div className="modal-body">
                    {logs.length === 0 ? <p>No recent activity found.</p> : (
                        <table className="log-table">
                            <thead>
                                <tr>
                                    <th>Action</th>
                                    <th>Target</th>
                                    <th>Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map(log => (
                                    <tr key={log.id}>
                                        <td><span className="log-desc">{log.description}</span></td>
                                        <td>{log.subject?.queue_number || 'N/A'}</td>
                                        <td>{new Date(log.created_at).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}