import React, { useState } from 'react';
import axiosClient from "../api/axios";
import { useNavigate, Link } from 'react-router-dom';

// 1. Define what the Props look like
interface StartShiftProps {
    onShiftStarted: (sessionData: any) => void;
}

export default function StartShiftModal({ onShiftStarted }: StartShiftProps) {
    const [config, setConfig] = useState({
        department: 'Registrar',
        target_year: 'All',
        capacity_limit: 50 // This is a number
    });
        const navigate = useNavigate();

   const handleStart = async () => {
        try {
            const payload = {
                ...config,
                capacity_limit: Number(config.capacity_limit) 
            };
            
            const response = await axiosClient.post('sessions/start', payload);
            
            // 1. Log the data to make sure we got the session back
            console.log("Session Created:", response.data);

            // 2. Call the parent function FIRST
            if (onShiftStarted) {
                onShiftStarted(response.data); 
            }

            // 3. Move to the dashboard
            // Use replace: true so they can't "Go Back" to the setup modal
            navigate('/staff/dashboard', { replace: true }); 

        } catch (error) {
            console.error("Shift Start Error:", error);
            // Only alert if the request actually failed
            alert("Failed to start shift. Check console for details.");
        }
    };

    return (
        <div>
            <div >
                <h2>🚀 Start Your Shift</h2>
                
                <label>Department</label>
                <select 
                    value={config.department}
                    onChange={(e) => setConfig({...config, department: e.target.value})}
                >
                    <option value="Registrar">Registrar</option>
                    <option value="Cashier">Cashier</option>
                    <option value="IT Dept">IT Dept</option>
                </select>

                <label>Serving Year Level</label>
                <select 
                    value={config.target_year}
                    onChange={(e) => setConfig({...config, target_year: e.target.value})}
                >
                    <option value="All">All Levels</option>
                    <option value="1st Year">1st Year Only</option>
                    <option value="2nd Year">2nd Year Only</option>
                    <option value="3rd Year">3rd Year Only</option>
                    <option value="4th Year">4th Year Only</option>
                </select>

                <label>Student Limit (Quota)</label>
                <input 
                    type="number" 
                    value={config.capacity_limit}
                    // 2. Fix the "String to Number" error here
                    onChange={(e) => setConfig({...config, capacity_limit: parseInt(e.target.value) || 0})}
                />

                <button onClick={handleStart} style={styles.btn}>OPEN QUEUE</button>
            </div>
        </div>
    );
}
// ... styles stay the same ...

const styles = {
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center' },
    modalCard: { backgroundColor: 'white', padding: '30px', borderRadius: '15px', width: '400px', display: 'flex', flexDirection: 'column', gap: '15px' },
    btn: { backgroundColor: '#007AFF', color: 'white', padding: '12px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }
};