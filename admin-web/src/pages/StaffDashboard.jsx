import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import axiosClient from "../api/axios";
import echo from "../api/echo";
import "../styles/StaffDashboard.css";
import { initializeSocket } from '../context/socket';

// --- SUB-COMPONENT: START SHIFT MODAL ---
const StartShiftModal = ({ onShiftStarted, onClose, userDept }) => {
  const [config, setConfig] = useState({
    department: userDept || 'Registrar', // Default to Staff's assigned dept
    target_year: 'All',
    capacity_limit: 50 
  });

  const handleStart = async () => {
    try {
      const payload = { ...config, capacity_limit: Number(config.capacity_limit) };
      const response = await axiosClient.post('sessions/start', payload);
      onShiftStarted(response.data); // Update parent state
    } catch (error) {
      alert("Failed to start shift. Check if another session is active.");
    }
  };

  return (
    <div style={modalStyles.modalOverlay}>
      <div style={modalStyles.modalCard}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <h2>🚀 Start Your Shift</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>&times;</button>
        </div>
        
        <label>Department</label>
        <input type="text" value={config.department} disabled style={modalStyles.inputDisabled} />

        <label>Serving Year Level</label>
        <select value={config.target_year} onChange={(e) => setConfig({...config, target_year: e.target.value})}>
          <option value="All">All Levels</option>
          <option value="1st Year">1st Year Only</option>
          <option value="2nd Year">2nd Year Only</option>
          <option value="3rd Year">3rd Year Only</option>
          <option value="4th Year">4th Year Only</option>
        </select>

        <label>Student Limit (Quota)</label>
        <input type="number" value={config.capacity_limit} onChange={(e) => setConfig({...config, capacity_limit: parseInt(e.target.value) || 0})} />

        <button onClick={handleStart} style={modalStyles.btn}>OPEN QUEUE</button>
      </div>
    </div>
  );
};

// --- MAIN COMPONENT: STAFF DASHBOARD ---
export default function StaffDashboard() {
  const { user, logout } = useAuth();
  const [queues, setQueues] = useState([]);
  const [session, setSession] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [queueRes, sessionRes] = await Promise.all([
        axiosClient.get("/queues"),
        axiosClient.get("/sessions/current")
      ]);
      setQueues(queueRes.data);
      setSession(sessionRes.data);
      
      // If no session found in DB, show the modal
      if (!sessionRes.data) setShowModal(true);
    } catch (err) {
      console.error("Fetch error", err);
      setShowModal(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    /** @type {any} */
let socket;

    const setupSocket = async () => {
        socket = await initializeSocket();

        // Listen for the event emitted by your Node.js server
        socket.on('QueueUpdated', (data) => {
            console.log("📢 Real-time update from Private Socket!", data);
            fetchData(); 
        });
    };

    setupSocket();

    return () => {
        if (socket) socket.disconnect();
    };
}, []);


  const handleEndShift = async () => {
    if (window.confirm("End shift? This will close the queue for students.")) {
      await axiosClient.post("/sessions/end");
      setSession(null);
      setShowModal(true);
    }
  };

  const handleComplete = async (id) => {

    await axiosClient.put(`/queues/${id}`, { status: "completed" });

    fetchData();

  };



  const handleServe = async (id) => {

    try {

      await axiosClient.put(`/queues/${id}`, { status: "serving" });

      fetchData();

    } catch (err) {

      console.error("Failed to serve student", err);

    }

  };

  if (loading) return <div className="p-10">Checking Session Status...</div>;

  const progressPercent = session?.capacity_limit > 0 
    ? (session.current_count / session.capacity_limit) * 100 : 0;

  return (
    <div className="dashboard">
      {/* 🛠️ MODAL LOGIC */}
      {showModal && (
        <StartShiftModal 
          userDept={user?.department} 
          onShiftStarted={(data) => { setSession(data); setShowModal(false); }} 
          onClose={() => setShowModal(false)} 
        />
      )}

      {/* Header */}
      <div className="dashboard-header">
        <h1 className="dashboard-title">Staff Dashboard 📋</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          {!session && (
            <button onClick={() => setShowModal(true)} className="bg-blue-500 text-white px-4 py-2 rounded">
              ▶️ Open Queue
            </button>
          )}
          <button onClick={logout} className="logout-btn">Logout</button>
        </div>
      </div>

      <p>Welcome, <b>{user?.name}</b>! (Department: {user?.department || 'N/A'})</p>

      {/* Session Info & Stats */}
      {session ? (
        <div className="session-info">
            {/* ... (Your existing session info cards here) ... */}
            <div className="session-header">
                <h2>{session.department} - {session.target_year}</h2>
                <button onClick={handleEndShift} className="end-btn">🛑 End Shift</button>
            </div>
            {/* Stats grid and Progress Bar from your code goes here */}
            <div className="stats-grid">

            <div className="stat-card">

              <span className="stat-label">DAILY QUOTA</span>

              <span className="stat-value">{session.capacity_limit}</span>

            </div>

            <div className="stat-card">

              <span className="stat-label">STUDENTS JOINED</span>

              <span className="stat-value">{session.current_count}</span>

            </div>

            <div className="stat-card">

              <span className="stat-label">SLOTS LEFT</span>

              <span className="stat-value green">

                {session.capacity_limit - session.current_count}

              </span>

            </div>

          </div>



          {/* Progress Bar */}

          <div className="progress-section">

            <div className="progress-header">

              <span>Capacity Usage</span>

              <span>{Math.round(progressPercent)}%</span>

            </div>

            <div className="progress-bar-bg">

              <div

                className="progress-bar-fill"

                style={{ width: `${progressPercent}%` }}

              />

            </div>

          </div>

        </div>
      
      ) : (
        <div className="bg-yellow-100 p-4 rounded-lg mb-5 border border-yellow-300">
          <p className="text-yellow-700">⚠️ <b>Shift Inactive:</b> You are in View-Only mode. Start a shift to call students.</p>
        </div>
      )}

      {/* Queue Table */}
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
      {queues.length > 0 ? (
        queues.map((q) => {
          // 1. Create a boolean for easier reading
          const isCancelled = q.status === "cancelled";

          return (
            <tr 
              key={q.id} 
              // 2. Apply a different style class if cancelled
              className={isCancelled ? "row-cancelled" : ""}
            >
              <td className="font-bold">{q.queue_number}</td>
              <td>{q.student_name}</td>
              <td>{q.purpose}</td>
              <td>
                {/* 3. Logic: If cancelled, show a label. Otherwise, show buttons */}
                {isCancelled ? (
                  <span className="badge-cancelled">🚫 Cancelled by User</span>
                ) : (
                  <>
                    {/* Only show "Call" button if session is ACTIVE and status is pending */}
                    {session && q.status === "pending" && (
                      <button 
                        onClick={() => handleServe(q.id)} 
                        className="bg-green-500 text-white px-3 py-1 rounded mr-2"
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
                  </>
                )}
              </td>
            </tr>
          );
        })
      ) : (
        <tr>
          <td colSpan={4} className="text-center p-4">No students waiting! 😴</td>
        </tr>
      )}
    </tbody>
  </table>
</div>
    </div>
  );
}

const modalStyles = {
  modalOverlay: { position: 'fixed', zIndex: 1000, top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  modalCard: { backgroundColor: 'white', padding: '30px', borderRadius: '15px', width: '400px', display: 'flex', flexDirection: 'column', gap: '15px', color: '#333' },
  btn: { backgroundColor: '#16a34a', color: 'white', padding: '12px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
  inputDisabled: { backgroundColor: '#f3f4f6', color: '#666', padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }
};