import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import axiosClient from "../../api/axios";
import { initializeSocket } from "../../context/socket";
import "../../styles/StaffDashboard.css";
import {
  Play, Square, CheckCircle, PhoneCall,
  AlertTriangle, Users, Clock, Hash, ChevronUp ,ChevronDown, Zap, Pause
} from "lucide-react";
import toast from 'react-hot-toast';
import AutoCallTimer from "../../components/AutoCallTimer";


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
     stop_time_at: ""
  });
  const [starting, setStarting] = useState(false);

  const validateBeforeSubmit = () => {
  const now = new Date();
  const stop = new Date(buildStopDateTime(config.stop_time_at));

  const diffMinutes = (stop - now) / (1000 * 60);

  if (diffMinutes < 2) {
    toast.error("Minimum session is 2 minutes.");
    return false;
  }

  if (diffMinutes > 480) {
    toast.error("Maximum session is 8 hours.");
    return false;
  }

  return true;
};

  const handleStart = async () => {
    setStarting(true);

      if (!validateBeforeSubmit()) {
    setStarting(false);
    return;
  } 
    try {
      const payload = { ...config, capacity_limit: Number(config.capacity_limit), stop_time_at: buildStopDateTime(config.stop_time_at), };
      const response = await axiosClient.post("sessions/start", payload);
      onShiftStarted(response.data);
    } catch (err) {
    // 🔥 Extract Laravel validation errors
    if (err.response?.status === 422) {
      const errors = err.response.data.errors;

      if (errors?.stop_time_at) {
        toast.error(errors.stop_time_at[0]); // 👈 specific message
      } else {
        toast.error("Invalid input. Please check your form.");
      }

    } else if (err.response?.status === 403) {
      toast.error(err.response.data.message || "Action not allowed.");

    } else {
      toast.error("Failed to start shift. Please try again.");
    }

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

<div className="sd-form-group">
  <label className="sd-form-label">Stop Time (Today)</label>
  <input
    className="sd-form-input"
    type="time"
    value={config.stop_time_at || ""}
    min={getMinTime()}
    onChange={(e) => setConfig({ ...config, stop_time_at: e.target.value })}
  />
  <small style={{ color: "#64748b" }}>
    Minimum session: 30 minutes from now
  </small>
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


const MIN_DURATION_MINUTES = 30;

const getMinTime = () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() + MIN_DURATION_MINUTES);

  return now.toTimeString().slice(0, 5);
};

const getCurrentTime = () => {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
};

const buildStopDateTime = (time) => {
  if (!time) return null;

  const now = new Date();
  const [hours, minutes] = time.split(":");

  const local = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    parseInt(hours),
    parseInt(minutes),
    0
  );

  // 👉 Format: YYYY-MM-DD HH:mm:ss (Laravel friendly)
  const pad = (n) => String(n).padStart(2, "0");

  return `${local.getFullYear()}-${pad(local.getMonth() + 1)}-${pad(local.getDate())} ${pad(local.getHours())}:${pad(local.getMinutes())}:00`;
};

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
  const [fullAutoEnabled, setFullAutoEnabled] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [batchSize, setBatchSize] = useState(1);
  const pendingCount   = queues.filter(q => q.status === "pending").length;
  const servingList = queues.filter(q => q.status === "serving")
  const completedCount = queues.filter(q => q.status === "completed").length;
  const noShow = queues.filter(q => q.status === "noshow").length;
  const [collapsed, setCollapsed] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
const [quota, setQuota] = useState("");
const [stopTime, setStopTime] = useState("");
const [completeSize, setCompleteSize] = useState(1);

useEffect(() => {
  if (!showSettings || !session) return;

  setQuota(session.capacity_limit || "");
  setStopTime(
    session.stop_time_at
      ? session.stop_time_at.slice(11, 16)
      : ""
  );
}, [showSettings, session]);

  useEffect(() => {
    const t = setInterval(() => setNowTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
  if (session) {
    setAutoCallEnabled(session.is_autocall_enabled);
    setFullAutoEnabled(session.is_full_auto);
    setIsPaused(session.is_paused);
    setBatchSize(session.batch_size || 1);
  }
}, [session]);


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


  const handleEndShift = async () => {
    if (window.confirm("End shift? This will close the queue for students.")) {
      await axiosClient.post("/sessions/end");
      setSession(null);
      setShowModal(true);
    }
  };

 const handleServe = async (count = 1) => {

  if (pendingCount === 0) return;

  const currentServingCount = queues.filter(
  q => q.status === "serving" && q.department === activeTab
).length;
  if (currentServingCount + count > batchSize) {
    alert("⚠️ Cannot exceed your set active slot limit.");
    return;
  }

  try {
    await axiosClient.post("/queues/call-batch", { 
      limit: count,
      department: activeTab 
    });
    
    // 4. Refresh data to show the new 'serving' students
    fetchData(); 
  } catch (err) {
    console.error("Batch call failed:", err);
    alert("Failed to call next students. Another staff might have grabbed them.");
  }
};

const handleCompleteBatch = async (count = 1) => {
  if (!window.confirm(`Finish ${count} students and call the next batch?`)) return;

  try {
    const res = await axiosClient.post('/queues/complete-batch', { 
      limit: count,
      department: activeTab });
    toast.success(res.data.message);
    // Refresh your list here
    fetchData(); 
  } catch (err) {
    toast.error("Failed to complete batch");
  }
};

const handleBatchSizeChange = async (newSize) => {
  // 1. Update UI immediately for "snappy" feel
  setBatchSize(newSize);

  // 2. Persist to DB in the background
  try {
    await axiosClient.patch('/update/batch/size', {
      department: activeTab,
      batch_size: newSize
    });
    toast.success(`Batch size updated to ${newSize}`);
  } catch (err) {
    console.error("Failed to save batch size");
  }
};

const handleComplete = async (id) => {
  console.log("✅ Marking complete for queue ID:", id);
  const payload = {
    status: "completed",
    // We remove the backend auto_call because we'll handle it on the frontend for better control
    //auto_call: false 
  };

  try {
    await axiosClient.put(`/queues/${id}`, payload);
    fetchData();
  } catch (err) {
    console.error(err);
  }
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

const handleToggleAutoCall = async () => {
  const newValue = !autoCallEnabled;
  
  setAutoCallEnabled(newValue);
  // SENIOR MOVE: If main Auto is OFF, Full Auto MUST be OFF
  if (!newValue) {
    setFullAutoEnabled(false); 
  }

  try {
    await axiosClient.patch(`/sessions/${session.id}`, {
      is_autocall_enabled: newValue,
      // Sync Full Auto state to DB as well if we're killing the main toggle
      ...( !newValue && { is_full_auto: false } ) 
    });
    toast.success(`Auto-Call turned ${newValue ? "ON" : "OFF"}`);
  } catch (err) {
    setAutoCallEnabled(!newValue);
    if (!newValue) setFullAutoEnabled(fullAutoEnabled); // Rollback if needed
    toast.error("Sync failed.");
  }
};


const handleToggleFullAuto = async () => {
  const newValue = !fullAutoEnabled;
  setFullAutoEnabled(newValue);

  try {
    await axiosClient.patch(`/sessions/${session.id}`, {
      is_full_auto: newValue
    });
    toast.success(`Full Auto turned ${newValue ? "ON" : "OFF"}`);
  } catch (err) {
    setFullAutoEnabled(!newValue);
    toast.error("System error: Could not sync Full Auto setting.");
  }
};

const handleTogglePause = async () => {
  const newValue = !isPaused;
  setIsPaused(newValue);

  try {
    await axiosClient.patch(`/sessions/${session.id}`, {
      is_paused: newValue
    });
    toast.success(`Heartbeat ${newValue ? "Paused" : "Resumed"}`);
  } catch (err) {
    setIsPaused(!newValue);
    toast.error("Could not pause heartbeat.");
  }
};

const updateSession = async (updates) => {
  try {
    const res = await axiosClient.patch(`/update/sessions/${session.id}`, updates);

    setSession(res.data.session);
    toast.success("Session updated!");
    
  } catch (err) {
    console.error(err);
    toast.error("Failed to update session.");

    // ✅ correct way
    console.log(err.response?.data);
  }
};

const formatToDateTime = (time) => {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  return `${today}T${time}`;
};

  if (loading) return <div className="sd-loading">Checking Session Status</div>;

  const progressPercent = session?.capacity_limit > 0
    ? Math.min((session.current_count / session.capacity_limit) * 100, 100) : 0;

  const progressClass = progressPercent >= 90 ? "danger" : progressPercent >= 70 ? "warning" : "";


  const emptySlots = Math.max(0, batchSize - servingList.length);
  const canCallMore = emptySlots > 0 && pendingCount > 0;
  const actualCallCount = Math.min(emptySlots, pendingCount);

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

{!collapsed && (
  <>
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
                <p>Session closed · {formatTime(session.stop_time_at)}</p>
              </div>
              <button className="sd-end-btn" onClick={handleEndShift}>
                <Square size={13} /> End Shift
              </button>
              <button className="sd-settings-btn" onClick={() => setShowSettings(true)}>
  ⚙ Settings
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

{showSettings && (
  <div className="sd-modal-overlay">
    <div className="sd-modal-card">
      
      {/* HEADER */}
      <div className="sd-modal-header">
        <h3>Session Settings</h3>
        <button onClick={() => setShowSettings(false)}>✕</button>
      </div>

      {/* BODY */}
      <div className="sd-modal-body">

        <div className="sd-field">
          <label>Daily Quota</label>
         <input
  type="number"
  value={quota}
  onChange={(e) => setQuota(e.target.value)}
/>


        </div>

        <div className="sd-field">
          <label>Stop Time</label>
          <input
  type="time"
  value={stopTime}
  onChange={(e) => setStopTime(e.target.value)}
/>
        </div>

      </div>

      {/* FOOTER */}
      <div className="sd-modal-footer">
        <button
          className="sd-cancel-btn"
          onClick={() => setShowSettings(false)}
        >
          Cancel
        </button>

        <button
          className="sd-save-btn"
          onClick={() => {
  const updates = {};

  // convert string → number safely
  const quotaNum = Number(quota);

  if (quotaNum !== session.capacity_limit) {
    updates.capacity_limit = quotaNum;
  }

  if (stopTime && stopTime !== session.stop_time_at?.slice(11, 16)) {
    const today = new Date().toISOString().split("T")[0];
    updates.stop_time_at = `${today}T${stopTime}`;
  }

  if (Object.keys(updates).length === 0) {
    toast("No changes made.");
    return;
  }

  updateSession(updates);
  setShowSettings(false);
}}
        >
          Save Changes
        </button>
      </div>

    </div>
  </div>
)}
        </>
)}
                 <div className="serving-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "15px", marginBottom: "20px" }}>
  {servingList.map(student => (
    <div key={student.id} className="serving-card active" style={{ borderLeft: "4px solid #16a34a", background: "#fff", padding: "15px", borderRadius: "12px", boxShadow: "0 2px 4px rgba(0,0,0,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div>
        <p style={{ margin: 0, fontSize: "0.7rem", color: "#16a34a", fontWeight: "800" }}>SERVING NOW</p>
        <p style={{ margin: 0, fontWeight: "700" }}>#{student.queue_number} - {student.student_name}</p>
        <NoShowTimer startedAt={student.started_at} onNoShow={() => handleNoShow(student.id)} />
      </div>
      <button className="sd-action-btn done" onClick={() => handleComplete(student.id)}>
        <CheckCircle size={14} /> Done
      </button>
    </div>
  ))}
</div>



        <div className="sd-table-card">
     <div className="sd-table-header">
  
  {/* LEFT SIDE */}
  <div className="sd-table-left">
    <span className="sd-table-title">
      Viewing: <strong>{activeTab}</strong>
      <span className="sd-table-dot" />
      Queue List
    </span>
  </div>

  {/* RIGHT SIDE */}
  <div className="sd-table-right">

    {/* Collapse Button */}
    <button
      className="sd-btn sd-btn-outline"
      onClick={() => {
        setCollapsed(!collapsed);
        if (!collapsed) {
          setTimeout(() => {
            document.querySelector(".sd-table-card")?.scrollIntoView({ behavior: "smooth" });
          }, 100);
        }
      }}
    >
      {collapsed ? (
        <>
          <ChevronDown size={14} /> Show
        </>
      ) : (
        <>
          <ChevronUp size={14} /> Hide
        </>
      )}
    </button>

    {/* Batch Control */}
    <div className="batch-control">
      <label>Slots</label>
      
<input 
  type="number" 
  value={batchSize} 
  onChange={(e) => handleBatchSizeChange(parseInt(e.target.value) || 1)}
/>
    </div>

    {/* Call Button */}
    <button 
      className={`sd-btn ${canCallMore ? 'sd-btn-primary' : 'sd-btn-disabled'}`}
      onClick={() => handleServe(actualCallCount)}
      disabled={!canCallMore}
    >
      <PhoneCall size={14} />
      {canCallMore ? `Call ${actualCallCount}` : emptySlots === '0' ? "Full" : pendingCount === 0 ? "No Waiting" : "No Slots"}
    </button>

    {servingList.length > 0 && (
       <><input
                  type="number"
                  min="1"
                  max={servingList.length}
                  value={completeSize}
                  onChange={(e) => setCompleteSize(parseInt(e.target.value) || 1)} /><button
                    className="sd-btn sd-btn-success"
                    style={{ backgroundColor: '#48bb78', color: 'white' }}
                    onClick={() => handleCompleteBatch(completeSize)}
                  >
                    <CheckCircle size={14} />
                    Complete Batch
                  </button></>
)}

    {/* Status / Toggles */}
      <div className="sd-table-controls">

  {pendingCount > 0 && (
    <span className="sd-table-count">{pendingCount}</span>
  )}

  {/* Existing Finished Toggle */}
  <button
    className={`sd-toggle-btn ${showFinished ? "active" : ""}`}
    onClick={() => setShowFinished(!showFinished)}
  >
    {showFinished ? "Hide" : "Finished"}
  </button>

  {!session ? (
    <span className="sd-warning-text">
      <AlertTriangle size={12} /> Inactive
    </span>
  ) : (
    <>
      {/* Base Auto-Call Toggle */}
      <label className={`sd-autocall ${autoCallEnabled ? "on" : ""}`}>
        <input
          type="checkbox"
          checked={autoCallEnabled}
          onChange={handleToggleAutoCall}
        />
        <span>{autoCallEnabled ? "Auto" : "Manual"}</span>
      </label>

      {/* NESTED: Full Auto / Heartbeat Toggle */}
      {/* Only shows if Auto-Call is ON */}
      {autoCallEnabled && (
        <div className="sd-full-auto-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label className={`sd-fullauto ${fullAutoEnabled ? "active" : ""}`}>
            <input
              type="checkbox"
              checked={fullAutoEnabled}
              onChange={handleToggleFullAuto}
            />
            <Zap size={14} color={fullAutoEnabled ? "#f6ad55" : "#cbd5e0"} />
            <span>Full Auto</span>
          </label>

          {/* PAUSE BUTTON: Only shows if Full Auto is ON */}
          {fullAutoEnabled && (
            <button 
              className={`sd-pause-btn ${isPaused ? "paused" : ""}`}
              onClick={handleTogglePause}
              title={isPaused ? "Resume Heartbeat" : "Pause Heartbeat"}
            >
              {isPaused ? <Play size={14} fill="currentColor" /> : <Pause size={14} fill="currentColor" />}
            </button>
          )}
        </div>
      )}
    </>
  )}
</div>

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
    onClick={() => handleServe(1)} // Just call 1 if clicking a specific row
    disabled={!isNext || !canCallMore} // Only allow if it's their turn AND you have a slot
    style={{ opacity: (!isNext || !canCallMore) ? 0.4 : 1 ,
      cursor: !isNext || !canCallMore ? 'not-allowed' : 'pointer', 
     }
  
  }
  >
    <PhoneCall size={12} /> Call
  </button>
)}

      {q.status === "serving" && (
        <>

        {q.expires_at && (
      <AutoCallTimer 
  expiresAt={q.expires_at} 
  isPaused={isPaused} 
  onTimerEnd={() => handleComplete(q.id)} // This hits your QueueController instantly
/>
    )}

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