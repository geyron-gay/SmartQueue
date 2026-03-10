import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axios';

const ViewSessions = () => {
    const [sessions, setSessions] = useState([]);
    const [attendees, setAttendees] = useState([]);
    const [viewingSession, setViewingSession] = useState(null);
    const [filters, setFilters] = useState({ department: '', start_date: '', end_date: '' });

    useEffect(() => { loadSessions(); }, [filters]);

    const loadSessions = async () => {
        const res = await axiosClient.get('/sessions', { params: filters });
        setSessions(res.data.data);
    };

  const viewAttendees = async (sessionId) => {
    try {
        const res = await axiosClient.get(`/sessions/${sessionId}`);
        
        // Laravel Resources wrap the object in a "data" key
        // So the path is res.data.data.attendees
        const sessionData = res.data.data;
        
        console.log("Full Session Object:", sessionData); // Debug this!
        
        setAttendees(sessionData.attendees);
        setViewingSession(sessionId);
    } catch (err) {
        console.error("Error fetching attendees:", err);
    }
};
    return (
        <div style={{ padding: '20px' }}>
            <h2>Queue History & Sessions</h2>
            
            {/* Filter Section */}
            <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
                <input placeholder="Dept Name" onChange={e => setFilters({...filters, department: e.target.value})} />
                <input type="date" onChange={e => setFilters({...filters, start_date: e.target.value})} />
                <input type="date" onChange={e => setFilters({...filters, end_date: e.target.value})} />
            </div>

            {/* Sessions Table */}
            <table border="1" width="100%" style={{ borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ backgroundColor: '#f4f4f4' }}>
                        <th>Date</th>
                        <th>Department</th>
                        <th>Target</th>
                        <th>Joined</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {sessions.map(s => (
                        <tr key={s.id}>
                            <td>{new Date(s.created_at).toLocaleDateString()}</td>
                            <td>{s.department}</td>
                            <td>{s.target_year}</td>
                            <td>{s.current_count}</td>
                            <td><button onClick={() => viewAttendees(s.id)}>View Students</button></td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Attendees Modal/Section */}
            {viewingSession && (
                <div style={{ marginTop: '30px', padding: '15px', border: '1px solid #ccc' }}>
                    <h3>Attendees for Session #{viewingSession}</h3>
                    <button onClick={() => setViewingSession(null)}>Close</button>
                    <ul>
                        {attendees.map(a => (
                            <li key={a.id}>
                                🟢 {a.student_name} ({a.student_id}) - Purpose: {a.purpose} - Status: {a.status}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default ViewSessions;