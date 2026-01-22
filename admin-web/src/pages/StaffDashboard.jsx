import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import axiosClient from "../api/axios";
import "../styles/StaffDashboard.css";

export default function StaffDashboard() {
  const { user, logout } = useAuth();
  const [queues, setQueues] = useState([]);

  const fetchQueues = async () => {
    try {
      const res = await axiosClient.get('/queues');
      setQueues(res.data);
    } catch (err) {
      console.error("Failed to fetch queue", err);
    }
  };

  useEffect(() => {
    fetchQueues();
    const interval = setInterval(fetchQueues, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleComplete = async (id) => {
    await axiosClient.put(`/queues/${id}`, { status: 'completed' });
    fetchQueues();
  };

  const handleServe = async (id) => {
    try {
        // Change status to 'serving'
        await axiosClient.put(`/queues/${id}`, { status: 'serving' });
        fetchQueues(); // Refresh the table
    } catch (err) {
        console.error("Failed to serve student", err);
    }
};

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Staff Dashboard 📋</h1>
        <button onClick={logout} className="logout-btn">Logout</button>
      </div>

      <p>Welcome, <b>{user?.name}</b>! Here are the students waiting:</p>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>#</th>
              <th>Student Name</th>
              <th>Purpose</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {queues.length > 0 ? queues.map((q) => (
              <tr key={q.id}>
                <td className="font-bold">{q.queue_number}</td>
                <td>{q.student_name}</td>
                <td>{q.purpose}</td>
                <td>
                  {q.status === 'pending' && (
        <button 
            onClick={() => handleServe(q.id)}
            className="bg-green-500 text-white px-3 py-1 rounded"
        >
            Call Student
        </button>
    )}
                  <button 
                    onClick={() => handleComplete(q.id)}
                    className="mark-btn"
                  >
                    Mark Done
                  </button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="4" style={{ textAlign: "center", padding: "1rem" }}>
                  No students waiting! 😴
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}