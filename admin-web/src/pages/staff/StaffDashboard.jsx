import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import axiosClient from "../../api/axios";
import { initializeSocket } from "../../context/socket";
import "../../styles/StaffDashboard.css";
import {
  Play, Square, CheckCircle, PhoneCall,
  AlertTriangle, Users, Clock, Hash, ChevronDown
} from "lucide-react";


function getInitials(name = "") {
  return name.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase();
}

function formatTime(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}


function StartShiftModal({ onShiftStarted, onClose, userDept }) {
  const [config, setConfig] = useState({
    department: userDept || "Registrar",
    target_year: "All",
    capacity_limit: 50,
  });
  const [starting, setStarting] = useState(false);

  const handleStart = async () => {
    setStarting(true);
    try {
      const payload = { ...config, capacity_limit: Number(config.capacity_limit) };
      const response = await axiosClient.post("sessions/start", payload);
      onShiftStarted(response.data);
    } catch {
      alert("Failed to start shift. Check if another session is already active.");
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="sd-modal-overlay">
      <div className="sd-modal-card">


        <div className="sd-modal-header">
          <h2>Start Your Shift</h2>
          <p>Configure your queue session before opening.</p>
          <button className="sd-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="sd-modal-body">
          <div className="sd-form-group">
            <label className="sd-form-label">Department</label>
            <input
              className="sd-form-input"
              type="text"
              value={config.department}
              disabled
            />
          </div>

          <div className="sd-form-group">
            <label className="sd-form-label">Serving Year Level</label>
            <select
              className="sd-form-select"
              value={config.target_year}
              onChange={e => setConfig({ ...config, target_year: e.target.value })}
            >
              <option value="All">All Year Levels</option>
              <option value="1st Year">1st Year Only</option>
              <option value="2nd Year">2nd Year Only</option>
              <option value="3rd Year">3rd Year Only</option>
              <option value="4th Year">4th Year Only</option>
            </select>
          </div>

          <div className="sd-form-group">
            <label className="sd-form-label">Student Quota (Capacity Limit)</label>
            <input
              className="sd-form-input"
              type="number"
              min={1}
              max={500}
              value={config.capacity_limit}
              onChange={e => setConfig({ ...config, capacity_limit: parseInt(e.target.value) || 0 })}
            />
          </div>
        </div>

        <div className="sd-modal-footer">
          <button className="sd-modal-cancel-btn" onClick={onClose}>Cancel</button>
          <button className="sd-modal-open-btn" onClick={handleStart} disabled={starting}>
            {starting
              ? <><span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} /> Opening...</>
              : <><Play size={15} /> Open Queue</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

const NoShowTimer = ({ startedAt, onNoShow }) => {
  const [remaining, setRemaining] = useState(30);

  useEffect(() => {
    if (!startedAt) {
      console.log("⏳ [TIMER] No startedAt provided yet.");
      return;
    }

const calculateTime = () => {
  const startTime = new Date(startedAt.replace(' ', 'T')).getTime();
  const now = new Date().getTime();
  
  let secondsPassed = Math.floor((now - startTime) / 1000);


  if (secondsPassed > 3600 || secondsPassed < -3600) {

      secondsPassed = 0; 
  }

  const timeLeft = 20 - secondsPassed;

  setRemaining(timeLeft);
};
    calculateTime();

    const interval = setInterval(calculateTime, 1000);

    return () => clearInterval(interval);
  }, [startedAt]);

  if (remaining <= 0) {
    return (
      <button 
        className="sd-action-btn noshow" 
        onClick={onNoShow} 
        style={{ backgroundColor: '#e74c3c', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
      >
        <Users size={12} /> No Show
      </button>
    );
  }

  return (
    <span className="sd-timer-text" style={{ fontSize: '11px', color: '#e67e22', fontWeight: 'bold' }}>
      ⏳ {remaining > 0 ? remaining : 0}s left
    </span>
  );
};


export default function StaffDashboard() {
  const { user, logout , getUser } = useAuth();
  const [queues, setQueues]       = useState([]);
  const [session, setSession]     = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading]     = useState(true);
  const [nowTime, setNowTime]     = useState(new Date());
  const [showFinished, setShowFinished] = useState(false);
  const [activeTab, setActiveTab] = useState(user?.department);
  const [autoCallEnabled, setAutoCallEnabled] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setNowTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

const fetchData = async (isInitialLoad = false) => {
    if (isInitialLoad) setLoading(true);
    
    try {
      const [queueRes, sessionRes] = await Promise.all([
        axiosClient.get("/queues").catch(() => ({ data: [] })),
        axiosClient.get("/sessions/current").catch(() => ({ data: null }))
      ]);

      const currentQueue = Array.isArray(queueRes.data) ? queueRes.data : (queueRes.data?.data || []);
      const currentSession = sessionRes.data?.session ?? null;

      setQueues(currentQueue);
      setSession(currentSession);

      if (!currentSession) {
        setShowModal(true);
      } else {
        setShowModal(false);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      if (isInitialLoad) setLoading(false); 
    }
  };

useEffect(() => {
    let isMounted = true; 

    const initialize = async () => {

      await fetchData(true);

      if (!isMounted) return;

      const socket = initializeSocket();

      socket.on("QueueUpdated", () => fetchData(false));

      socket.on("StaffRelocated", async (data) => {
        await getUser(); 
        if (data.relocated_to) {
          setActiveTab(data.relocated_to);
        }
        fetchData(false); 
      });

      return socket;
    };

    const socketPromise = initialize();

    return () => {
      isMounted = false;
      socketPromise.then(socket => {
        if (socket) socket.disconnect();
      });
    };
  }, []);

const nextInLine = queues.find(
  q => q.status === "pending" && q.department === activeTab
  
);
console.log("NEXT IN LINE:", nextInLine);

  const handleEndShift = async () => {
    if (window.confirm("End shift? This will close the queue for students.")) {
      await axiosClient.post("/sessions/end");
      setSession(null);
      setShowModal(true);
    }
  };

  const handleServe = async (id) => {

     const nextId = nextInLine?.id;

  if (id !== nextId) {
    alert("⚠️ You can only call the next student in line!");
    return;
  }

    try { await axiosClient.put(`/queues/${id}`, { status: "serving" }); fetchData(); }
    catch (err) { console.error("Failed to serve", err); }
  };

  const handleComplete = async (id) => {

    const payload = {
  status: "completed",
  auto_call: autoCallEnabled
};
 try{
await axiosClient.put(`/queues/${id}`, payload);
    }
    catch (err) { console.error("Failed to complete", err); }
  };

  const handleDemote = async (id) => {
    if (window.confirm("Demote this student to the end of the regular line?")) {
      try { await axiosClient.put(`/queues/${id}/demote`); fetchData(); }
      catch (err) { console.error("Failed to demote", err); }
    }
  };

  const handleNoShow = async (id) => {
  if (window.confirm("Mark this student as No-Show?")) {
    try {
      await axiosClient.put(`/queues/${id}`, { status: "noshow" });
      fetchData();
    } catch (err) {
      console.error("Failed to mark no-show", err);
    }
  }
};


  if (loading) return <div className="sd-loading">Checking Session Status</div>;

  const progressPercent = session?.capacity_limit > 0
    ? Math.min((session.current_count / session.capacity_limit) * 100, 100) : 0;

  const progressClass = progressPercent >= 90 ? "danger" : progressPercent >= 70 ? "warning" : "";

  const pendingCount   = queues.filter(q => q.status === "pending").length;
  const servingNow     = queues.find(q => q.status === "serving");
  const completedCount = queues.filter(q => q.status === "completed").length;
  const noShow = queues.filter(q => q.status === "noshow").length;

  const displayQueues = queues.filter(q => {
    const matchesTab = q.department === activeTab;
    
const filteredQueues = showFinished 
        ? true 
        : (q.status === "pending" || q.status === "serving");

    return matchesTab && filteredQueues;

});

  return (
    <div className="sd-wrapper">

      {showModal && (
        <StartShiftModal
          userDept={user?.department}
          onShiftStarted={(data) => { setSession(data); setShowModal(false); }}
          onClose={() => setShowModal(false)}
        />
      )}

      <div className="sd-topbar">
        <div className="sd-topbar-left">
          <div>
            <p className="sd-topbar-title">Staff Dashboard</p>
            <p className="sd-topbar-sub">
              {user?.name} · {user?.department || "Registrar"}
            </p>
          </div>
          {session && (
            <div className="sd-live-badge">
              <span className="sd-live-dot" />
              Live
            </div>
          )}
        </div>

        <div className="sd-topbar-right">
          <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.55)", fontVariantNumeric: "tabular-nums" }}>
            {nowTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </span>
          {!session && (
            <button className="sd-btn sd-btn-primary" onClick={() => setShowModal(true)}>
              <Play size={13} /> Open Queue
            </button>
          )}
          <button className="sd-btn sd-btn-outline" onClick={logout}>
            Sign Out
          </button>
        </div>
      </div>

      <div className="sd-body">

        {user?.relocated_to && (
        <div className="sd-tabs-container" style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
      
        <button 
  className={`sd-tab ${activeTab === user.department ? 'active' : 'inactive'}`}
  onClick={() => setActiveTab(user.department)}
>
  🏠 {user.department}
</button>

<button 
  className={`sd-tab ${activeTab === user.relocated_to ? 'active' : 'relocate-assigned'}`}
  onClick={() => setActiveTab(user.relocated_to)}
>
  🚀 {user.relocated_to} (Assigned)
</button>
        </div>
      )}

        {!session && (
          <div className="sd-inactive-banner">
            <div className="sd-inactive-icon">⚠️</div>
            <div className="sd-inactive-text">
              <h4>Shift Inactive — View Only Mode</h4>
              <p>You cannot call or complete students until you open a queue session.</p>
            </div>
            <button className="sd-inactive-btn" onClick={() => setShowModal(true)}>
              <Play size={14} /> Start Shift
            </button>
          </div>
        )}

        {session && (
          <div className="sd-session-card">
            <div className="sd-session-top">
              <div className="sd-session-info">
                <h3>{session.department} — {session.target_year}</h3>
                <p>Session opened · {formatTime(session.created_at)}</p>
              </div>
              <button className="sd-end-btn" onClick={handleEndShift}>
                <Square size={13} /> End Shift
              </button>
            </div>

            <div className="sd-stats-grid">
              <div className="sd-stat">
                <span className="sd-stat-label">Daily Quota</span>
                <span className="sd-stat-value">{session.capacity_limit}</span>
              </div>
              <div className="sd-stat">
                <span className="sd-stat-label">Students Joined</span>
                <span className="sd-stat-value gold">{session.current_count}</span>
              </div>
              <div className="sd-stat">
                <span className="sd-stat-label">Slots Remaining</span>
                <span className="sd-stat-value green">
                  {session.capacity_limit - session.current_count}
                </span>
              </div>
              <div className="sd-stat">
                <span className="sd-stat-label">Completed Today</span>
                <span className="sd-stat-value">{completedCount}</span>
              </div>

               <div className="sd-stat">
                <span className="sd-stat-label">NO SHOW Today</span>
                <span className="sd-stat-value">{noShow}</span>
              </div>
            </div>

  
            <div className="sd-progress-section">
              <div className="sd-progress-header">
                <span>Capacity Usage</span>
                <span style={{ fontWeight: 700, color: progressPercent >= 90 ? "var(--red)" : progressPercent >= 70 ? "var(--amber)" : "var(--tmc-blue)" }}>
                  {Math.round(progressPercent)}%
                </span>
              </div>
              <div className="sd-progress-bg">
                <div
                  className={`sd-progress-fill ${progressClass}`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        )}
        {servingNow && (
          <div style={{
            background: "linear-gradient(135deg, rgba(22,163,74,0.08), rgba(22,163,74,0.04))",
            border: "1px solid rgba(22,163,74,0.25)",
            borderLeft: "4px solid var(--green)",
            borderRadius: 12, padding: "14px 20px",
            display: "flex", alignItems: "center", gap: 14
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: "var(--green-soft)", color: "var(--green)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, fontSize: "1.1rem"
            }}>
              📢
            </div>
            <div>
              <p style={{ margin: 0, fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--green)" }}>
                Now Serving
              </p>
              <p style={{ margin: 0, fontSize: "0.9rem", fontWeight: 700, color: "var(--text-dark)" }}>
                Ticket #{servingNow.queue_number} · {servingNow.student_name}
              </p>
            </div>
            <button
              onClick={() => handleComplete(servingNow.id)}
              style={{
                marginLeft: "auto", fontFamily: "DM Sans, sans-serif",
                fontSize: "0.78rem", fontWeight: 700, padding: "8px 16px",
                background: "var(--green)", color: "var(--white)",
                border: "none", borderRadius: 8, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 6
              }}
            >
              <CheckCircle size={14} /> Mark Done
            </button>

            {user?.relocated_to && (
              <button 
                className={`tab-btn relocate-tab ${activeTab === user?.relocated_to ? 'active' : ''}`}
                onClick={() => setActiveTab(user?.relocated_to)}
                style={{ backgroundColor: '#fef3c7', border: '1px solid #f59e0b', marginLeft: '10px' }}
              >
                View {user?.relocated_to} Queue 🚀
              </button> 
            )}
          </div>
        )}

        <div className="sd-table-card">
          <div className="sd-table-header">
            <span className="sd-table-title">
              Viewing: <strong>{activeTab}</strong>
              <span className="sd-table-dot" />
              Queue List
            </span>

            
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {pendingCount > 0 && (
                <span className="sd-table-count">{pendingCount} waiting</span>
              )}

                  <button
      className={`sd-toggle-btn ${showFinished ? "active" : ""}`}
      onClick={() => setShowFinished(!showFinished)}
    >
      {showFinished ? "Hide Finished" : "Show Finished"}

    </button>

        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
  <input
    type="checkbox"
    checked={autoCallEnabled}
    onChange={() => setAutoCallEnabled(!autoCallEnabled)}
  />
  Auto Call Mode
</label>

{autoCallEnabled && servingNow && (
  <span style={{ fontSize: "0.75rem", color: "#f59e0b" }}>
    ⏳ Preparing next...
  </span>
)}

            </div>
          </div>

          

          <table className="sd-table">
            <thead>
              <tr >
                <th>#</th>
                <th>Student</th>
                <th>Purpose</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayQueues.length > 0 ? (
                
                displayQueues.map((q, i) => {
                   const isNext = q.id === nextInLine?.id;
                  const isCancelled = q.status === "cancelled";
                  const isServing   = q.status === "serving";

                  return (
                    <tr
  key={q.id}
  className={`
    ${isCancelled ? "row-cancelled" : ""}
    ${!isCancelled && isServing ? "row-serving" : ""}
    ${!isCancelled && !isServing && isNext ? "next-row" : ""}
  `}
  style={{ animationDelay: `${i * 0.03}s` }}
>
                      <td>
                        <span className="sd-queue-num">{q.queue_number}</span>
                      </td>

                      <td>
                        <div className="sd-student-cell">
                          <div className="sd-student-avatar">{getInitials(q.student_name)}</div>
                          <span style={{ fontWeight: 600 }}>
                            {q.student_name}
                            {q.priority === "Priority" && (
                              <span className="sd-priority-badge">PWD/Priority</span>
                            )}
                          </span>
                        </div>
                      </td>

  
                      <td style={{ color: "var(--text-mid)", fontSize: "0.82rem" }}>
                        {q.purpose || "—"}
                      </td>
                      <td>
                        <span className={`sd-status-badge ${q.status}`}>
                          {q.status}
                        </span>
                      </td>

                      <td style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
                        {q.created_at}
                      </td>

                   <td>
  {q.status === "cancelled" ? (
    <span className="badge-cancelled">🚫 Cancelled</span>

  ) : q.status === "completed" ? (
    <span className="badge-done">✅ Done</span>

  ) : q.status === "noshow" ? (
    <span className="badge-noshow">⏰ No Show</span>

  ) : (
    <div className="sd-action-wrap">

{q.status === "pending" && (
  <button
    className="sd-action-btn serve"
    onClick={() => handleServe(q.id)}
    disabled={ !isNext}
    style={{
      opacity: !isNext ? 0.4 : 1,
      cursor: !isNext ? "not-allowed" : "pointer"
    }}
  >
    <PhoneCall size={12} /> Call
  </button>
)}

      {q.status === "serving" && (
        <>
          <NoShowTimer
            startedAt={q.started_at}
            onNoShow={() => handleNoShow(q.id)}
          />

          {q.priority === "Priority" && (
            <button
              className="sd-action-btn demote"
              onClick={() => handleDemote(q.id)}
            >
              <ChevronDown size={12} /> Demote
            </button>
          )}

          <button
            className="sd-action-btn done"
            onClick={() => handleComplete(q.id)}
          >
            <CheckCircle size={12} /> Done
          </button>
        </>
      )}

    </div>
  )}
</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6}>
                    <div className="sd-empty">
                      <div className="sd-empty-icon">😴</div>
                      <h3>No students in the queue</h3>
                      <p style={{ fontSize: "0.78rem", marginTop: 4 }}>Waiting for students to join...</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}