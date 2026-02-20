// src/pages/admin/StaffPerformance.jsx
import React, { useEffect, useState } from 'react';
import { UserCheck, Zap, Clock } from 'lucide-react';
import axiosClient from '../../api/axios';
import '../../styles/staffperformance.css';

export default function StaffPerformance() {
    const [staffData, setStaffData] = useState([]);

    useEffect(() => {
        getAnalytics();
    }, []);

    const getAnalytics = async () => {
       try{
        const response =  await axiosClient.get('admin/analytics/staff-performance') 
            const result = response.data;
            console.log('Staff Performance Data:', result);
            setStaffData(result);   
            } catch (error) {
                console.error('Error fetching staff performance:', error);
            }       
    }

  return (
    <div className="sp-container">
        <div className="sp-header">
            <h2 className="sp-title">Staff Performance Leaderboard</h2>
            <span className="sp-subtitle">Last 7 Days</span>
        </div>

        <table className="sp-table">
            <thead>
                <tr>
                    <th>Staff Member</th>
                    <th>Department</th>
                    <th className="text-center">Served</th>
                    <th>Avg. Service Time</th>
                    <th>Efficiency</th>
                </tr>
            </thead>
            <tbody>
                {staffData.map((staff, index) => (
                    <tr key={index}>
                        <td className="sp-staff-cell">
                            <div className="sp-avatar">
                                {staff.staff_name.charAt(0)}
                            </div>
                            <span className="sp-name">
                                {staff.staff_name}
                            </span>
                        </td>

                        <td className="sp-department">
                            {staff.department}
                        </td>

                        <td className="sp-served text-center">
                            <span className="sp-badge">
                                {staff.total_served}
                            </span>
                        </td>

                        <td>
                            <div className="sp-time">
                                <Clock size={14} />
                                <span>{staff.avg_service_time} mins</span>
                            </div>
                        </td>

                        <td>
                            <div className="sp-progress">
                                <div 
                                    className={`sp-progress-bar ${
                                        staff.avg_service_time < 10 
                                            ? 'fast' 
                                            : 'slow'
                                    }`}
                                    style={{
                                        width: `${Math.min((staff.total_served / 100) * 100, 100)}%`
                                    }}
                                />
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

}