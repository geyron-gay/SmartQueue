import React, { useEffect, useState } from 'react';
import axiosClient from '../../api/axios';
import '../../styles/auditlogs.css';


export default function AuditLogs() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getAuditLogs();
    }, []);

    const getAuditLogs = async () => {
        try {
            const response = await axiosClient.get('/admin/audit-logs');    
            setLogs(response.data.data);
            setLoading(false);
        } catch (error) {       
            console.error('Error fetching audit logs:', error); 
            setLoading(false);  
        }
    }

    if (loading) return <div className="audit-loading">Accessing Security Vault...</div>;

    return (
        <div className="audit-wrapper">
            <header className="audit-header">
                <h2>System Audit Trail</h2>
                <p>Real-time record of all staff actions and ticket changes.</p>
            </header>

            <div className="audit-feed">
                {logs.map((log) => (
                    <div key={log.id} className="audit-card">
                        <div className="audit-meta">
                            <span className="audit-time">
                                {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className={`audit-badge badge-${log.description}`}>
                                {log.description.toUpperCase()}
                            </span>
                        </div>

                        <div className="audit-content">
                            <p>
                                <strong>{log.causer?.name || 'System'}</strong> 
                                {" changed "}
                                <strong>Ticket #{log.subject_id}</strong>
                            </p>
                            
                            {/* Senior Move: Show the specific property changes */}
                            {log.properties?.attributes && (
                                <div className="audit-details">
                                    {Object.keys(log.properties.attributes).map(key => (
                                        <div key={key} className="change-row">
                                            <span className="old-val">{log.properties.old?.[key] || 'null'}</span>
                                            <span className="arrow">→</span>
                                            <span className="new-val">{log.properties.attributes[key]}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}