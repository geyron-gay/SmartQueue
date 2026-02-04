import React, { useState, useEffect } from 'react';
import { Search, User, Calendar, Tag, AlertCircle } from 'lucide-react';
import '../styles/lookup.css';
import axiosClient from '../api/axios';

export default function StudentLookup() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    // 🕒 Debounce Logic: Wait for user to stop typing
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (query.length >= 3) {
                handleSearch();
            } else {
                setResults([]);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [query]);

    const handleSearch = async () => {
        setLoading(true);
        try {
             const result = await axiosClient.get(`/staff/lookup?query=${query}`);     
            setResults(result.data);
        } catch (error) {
            console.error("Lookup failed", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="lookup-page">
            <div className="search-container">
                <Search className="search-icon" size={20} />
                <input 
                    type="text" 
                    className="search-input"
                    placeholder="Search by ID or Name (Min. 3 chars)..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
                {loading && <div className="spinner-small" />}
            </div>

            <div className="results-grid">
                {results.length > 0 ? (
                    results.map((record) => (
                        <div key={record.id} className="student-card">
                            <div className="card-header">
                                <div className="student-info">
                                    <h3>{record.student_name}</h3>
                                    <span>{record.student_id}</span>
                                </div>
                                <span className={`status-pill ${record.status}`}>
                                    {record.status.toUpperCase()}
                                </span>
                            </div>
                            
                            <div className="card-body">
                                <p><Tag size={14} /> {record.department}</p>
                                <p><Calendar size={14} /> {new Date(record.created_at).toLocaleDateString()}</p>
                                <p><AlertCircle size={14} /> Purpose: {record.purpose}</p>
                            </div>
                            
                            <div className="card-footer">
                                <strong>Ticket #{record.queue_number}</strong>
                            </div>
                        </div>
                    ))
                ) : (
                    !loading && query.length >= 3 && <p className="no-data">No records found for "{query}"</p>
                )}
            </div>
        </div>
    );
}