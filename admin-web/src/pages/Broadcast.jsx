import React, { useState } from 'react';
import { Megaphone, Send, AlertTriangle, Info, ShieldAlert } from 'lucide-react';
import axiosClient from '../api/axios';
import '../styles/broadcast.css';

export default function Broadcast() {
    const [message, setMessage] = useState('');
    const [type, setType] = useState('info'); // info, warning, emergency
    const [loading, setLoading] = useState(false);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!message) return;

        setLoading(true);
        try {
            await axiosClient.post('/staff/broadcast', { message, type });
            setMessage(''); // Clear after sending
            alert("Broadcast pushed to all screens!");
        } catch (error) {
            console.error("Broadcast failed", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="broadcast-container">
            <header className="page-header">
                <h1>Public Broadcast</h1>
                <p>Send real-time announcements to the student monitors.</p>
            </header>

            <div className="broadcast-grid">
                {/* 📝 Composer Form */}
                <form className="broadcast-form" onSubmit={handleSend}>
                    <h3>Create Announcement</h3>
                    
                    <div className="type-selector">
                        <label className={`type-card ${type === 'info' ? 'active' : ''}`}>
                            <input type="radio" name="type" value="info" onChange={(e) => setType(e.target.value)} />
                            <Info size={20} />
                            <span>Info</span>
                        </label>
                        <label className={`type-card ${type === 'warning' ? 'active' : ''}`}>
                            <input type="radio" name="type" value="warning" onChange={(e) => setType(e.target.value)} />
                            <AlertTriangle size={20} />
                            <span>Warning</span>
                        </label>
                        <label className={`type-card ${type === 'emergency' ? 'active' : ''}`}>
                            <input type="radio" name="type" value="emergency" onChange={(e) => setType(e.target.value)} />
                            <ShieldAlert size={20} />
                            <span>Emergency</span>
                        </label>
                    </div>

                    <textarea 
                        placeholder="Type your message here (e.g., Registrar is currently offline for maintenance)..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        maxLength={200}
                    />

                    <button type="submit" disabled={loading} className="send-btn">
                        {loading ? 'Pushing...' : <><Send size={18} /> Push to Monitors</>}
                    </button>
                </form>

                {/* 👀 Real-time Preview */}
                <div className="broadcast-preview">
                    <h3>Live Preview</h3>
                    <div className={`preview-box ${type}`}>
                        <Megaphone className="mega-icon" />
                        <div className="preview-content">
                            <span className="preview-label">{type.toUpperCase()} NOTICE</span>
                            <p>{message || 'Your message will appear here...'}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}