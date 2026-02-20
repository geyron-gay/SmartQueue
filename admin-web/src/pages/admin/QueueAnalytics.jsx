// src/pages/admin/QueueAnalytics.jsx
import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Clock, Users, CheckCircle } from 'lucide-react';
import '../../styles/analytics.css';
import axiosClient from '../../api/axios';

export default function QueueAnalytics() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics()
    }, []);

    const fetchAnalytics = async () => {
        try {
            const response = await axiosClient.get('/admin/analytics/queue-stats');   
            const result = response.data;
            console.log('Analytics Data:', result);
            setData(result);
        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setLoading(false);
        }

    };

    if (loading) return <div>Calculating School Metrics...</div>;

    return (
  <div className="analytics-container">
    <h1 className="analytics-title">Queue Analytics</h1>
 


    {/* 📊 KPI CARDS SECTION */}
    <div className="kpi-grid">
      <StatCard
        title="Avg Wait Time"
        value={`${data.summary.avg_wait}m`}
        icon={<Clock />}
        color="blue"
      />
      <StatCard
        title="Avg Service Time"
        value={`${data.summary.avg_service}m`}
        icon={<CheckCircle />}
        color="green"
      />
      <StatCard
        title="Total Students"
        value={data.summary.total}
        icon={<Users />}
        color="purple"
      />
    </div>

    {/* 📈 TREND CHART */}
    <div className="chart-card">
      <h2 className="chart-title">Volume vs. Wait Time Trend</h2>

      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data.chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="total_students"
              stroke="#8884d8"
              name="Students"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="avg_wait_time"
              stroke="#82ca9d"
              name="Wait Time (sec)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  </div>
);

}

// Sub-component for clean code
function StatCard({ title, value, icon, color }) {
    return (
        <div className={`p-4 rounded-lg border-l-4 border-${color}-500 bg-white shadow-sm flex items-center`}>
            <div className={`p-3 rounded-full bg-${color}-50 text-${color}-600 mr-4`}>{icon}</div>
            <div>
                <p className="text-sm text-slate-500 font-medium">{title}</p>
                <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
            </div>
        </div>
    );
}