import React, { useEffect, useState } from 'react';
import axiosClient from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import '../../styles/UserManagement.css';
import { initializeSocket } from "../../context/socket";

const PurposeManagement = () => {
    const { user } = useAuth();
    const [purposeList, setPurposeList]     = useState([]);
    const [showModal, setShowModal]     = useState(false);
    const [modalMode, setModalMode]     = useState('add'); // 'add' | 'edit' | 'view'
    const [selectedPurpose, setSelectedPurpose] = useState(null);
    const [loading, setLoading]         = useState(true);
    const [searchTerm, setSearchTerm]   = useState('');
    const [purposeFilter, setPurposeFilter] = useState('all');

    const [purposeForm, setPurposeForm] = useState({
        name: '', department: '', default_service_time: '',
        buffer_time:'',
        max_extension_limit:''
    
    });

    useEffect(() => {
        let isMounted = true; 
    
        const initialize = async () => {
    
          await fetchPurposes();
          const socket = initializeSocket();
    
          socket.on("QueueUpdated", () => fetchPurposes());
    
      
            fetchPurposes(); 
        
    
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
    

    const fetchPurposes = async () => {
        setLoading(true);
        try {
            const res = await axiosClient.get('/staff/purposes');
            setPurposeList(res.data.data);
        } catch (err) {
            console.error('Failed to fetch purposes', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id, name) => {
        if (window.confirm(`Delete "${name}"? This action cannot be undone.`)) {
            try {
                await axiosClient.delete(`/purposes-delete/${id}`);
                setPurposeList(prev => prev.filter(p => p.id !== id));
            } catch {
                alert('Delete failed. Please try again.');
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
     
        try {
            if (modalMode === 'add') {
                await axiosClient.post('/purposes-create', purposeForm);
            } else if (modalMode === 'edit') {
           
                await axiosClient.put(`/purposes-update/${selectedPurpose.id}`, purposeForm);
            }
            fetchPurposes();
            closeModal();
        } catch (err) {
            console.error('Operation failed:', err.response?.data);
            alert('Operation failed. Please check your inputs.');
        }
    };

    const openAddModal = () => {
        setModalMode('add');
        setPurposeForm({ name: '', department: '', default_service_time: '', max_extension_limit: '' , buffer_time: ''});
        setShowModal(true);
    };
    const openEditModal = (u) => {
        setModalMode('edit');
        setSelectedPurpose(u);
        setPurposeForm({ name: u.name, department: u.department, default_service_time: u.default_service_time,buffer_time : u.buffer_time, max_extension_limit: u.max_extension_limit });
        setShowModal(true);
    };
    const openViewModal = (u) => {
        setModalMode('view');
        setSelectedPurpose(u);
        setShowModal(true);
    };
    const closeModal = () => {
        setShowModal(false);
        setSelectedPurpose(null);
        setModalMode('add');
    };

    const handleInputChange = (e) => setPurposeForm({ ...purposeForm, [e.target.name]: e.target.value });

   const term = searchTerm.toLowerCase();

const filteredPurposes = purposeList.filter(u => {
    const matchesSearch =
        (u.name     || '').toLowerCase().includes(term) ||
        (u.department || '').toLowerCase().includes(term);


    const matchesRole =
        purposeFilter === 'all' || u.department === purposeFilter;

    return matchesSearch && matchesRole;
});

    const roleClass = (role) => {
        if (role === 'admin') return 'um-role-admin';
        if (role === 'staff') return 'um-role-staff';
        return 'um-role-student';
    };

    const MODAL_META = {
        add:  { icon: '➕', title: 'Add New Purpose',  sub: 'Fill in the details below' },
        edit: { icon: '✏️', title: 'Edit Purpose',      sub: `Editing: ${selectedPurpose?.name || ''}` },
        view: { icon: '👁️', title: 'Purpose Details',   sub: selectedPurpose?.department || '' },
    };

    return (
        <div className="um-container">

            {/* ── HEADER ── */}
            <div className="um-header">
                <div className="um-header-left">
                    <div className="um-header-icon">👥</div>
                    <div>
                        <h1 className="um-header-title">
                            {user?.role === 'admin' ? 'Purpose Management' : `${user?.department} " " Purposes`}
                        </h1>
                        <p className="um-header-sub">Manage system purposes and permissions</p>
                    </div>
                </div>

         
                    <>
                        <div className="um-header-rule" />
                        <button onClick={openAddModal} className="um-add-btn">
                            <span>＋</span> Add New Purpose
                        </button>
                    </>
                
            </div>

            {/* ── CONTROLS ── */}
            <div className="um-controls">
                <div className="um-search-wrap">
                    <span className="um-search-icon">
                        <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
                            <circle cx="9" cy="9" r="6.5" stroke="#8A9BB0" strokeWidth="1.8"/>
                            <path d="M14 14l3.5 3.5" stroke="#8A9BB0" strokeWidth="1.8" strokeLinecap="round"/>
                        </svg>
                    </span>
                    <input
                        type="text"
                        className="um-search-input"
                        placeholder="Search by name, username, or email..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                {user?.role === 'admin' && (
                <select
    value={purposeFilter}
    onChange={(e) => setPurposeFilter(e.target.value)}
    className="um-filter-dropdown"
>
    <option value="all">All</option>
    <option value="REGISTRAR-BSIT">REGISTRAR-BSIT</option>
    <option value="REGISTRAR-BSOA">REGISTRAR-BSOA</option>

</select>
                )}
                
            <div className="um-count-chip">
                    <span className="um-count-num">{filteredPurposes.length}</span>
                    <span className="um-count-label">purposes</span>
                </div>
            </div>

            {/* ── TABLE ── */}
            <div className="um-table-wrap">
                {loading ? (
                    <div className="um-loading">
                        <div className="um-spinner" />
                        <p>Loading purposes...</p>
                    </div>
                ) : filteredPurposes.length === 0 ? (
                    <div className="um-empty">
                        <div className="um-empty-icon">👤</div>
                        <h3>No Purposes Found</h3>
                        <p>{searchTerm ? 'Try a different search term.' : 'Add your first purpose to get started.'}</p>
                    </div>
                ) : (
                    <table className="um-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Department</th>
                                <th>Default Service Time</th>
                                <th>Buffer Time</th>
                                <th>Max Extension Limit</th>
                                <th className="um-actions-col">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPurposes.map(item => (
                                <tr
                                    key={item.id}
                            
                                >
                                    {/* User */}
                                    <td>
                                        <div className="um-user-cell">
                                            <div className="um-avatar">
                                                {(item.name || '?').charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="um-user-name">{item.name}</div>
                                            
                                            </div>
                                        </div>
                                    </td>

                                    {/* Priority type */}
                    

                    
                                    {/* Department */}
                                    <td>
                                        <span className="um-dept-label">{item.department || '—'}</span>
                                    </td>

                                    {/* Default Service Time */}
                                    <td>
                                        <span className="um-service-time">{item.default_service_time || '—'}</span>
                                    </td>

                                    {/* Buffer Time */}
                                    <td>
                                        <span className="um-buffer-time">{item.buffer_time || '—'}</span>
                                    </td>

                                    {/* Max Extension Limit */}
                                    <td>
                                        <span className="um-extension-limit">{item.max_extension_limit || '—'}</span>
                                    </td>

                                
                                    {/* Actions */}
                                    <td className="um-actions-col">
                                        <div className="um-action-group">
                                            <button
                                                className="um-action-btn um-view-btn"
                                                onClick={() => openViewModal(item)}
                                                title="View Details"
                                            >👁️</button>
                                            <button
                                                className="um-action-btn um-edit-btn"
                                                onClick={() => openEditModal(item)}
                                                title="Edit Purpose"
                                            >✏️</button>
                                            <button
                                                className="um-action-btn um-delete-btn"
                                                onClick={() => handleDelete(item.id, item.name)}
                                                title="Delete Purpose"
                                            >🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* ── MODAL ── */}
            {showModal && (
                <div className="um-modal-overlay" onClick={closeModal}>
                    <div
                        className={`um-modal ${modalMode === 'view' ? 'um-modal-wide' : ''}`}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Modal header */}
                        <div className="um-modal-header">
                            <div className="um-modal-header-left">
                                <div className="um-modal-icon">
                                    {MODAL_META[modalMode].icon}
                                </div>
                                <div>
                                    <div className="um-modal-title">{MODAL_META[modalMode].title}</div>
                                    <div className="um-modal-subtitle">{MODAL_META[modalMode].sub}</div>
                                </div>
                            </div>
                            <button className="um-modal-close" onClick={closeModal}>✕</button>
                        </div>

                        <div className="um-modal-body">

                            {/* ── VIEW MODE ── */}
                            {modalMode === 'view' ? (
                                <div className="um-view-grid">

                                    {/* Left: user info */}
                                    <div className="um-view-left">
                                        <div className="um-view-avatar">
                                            {selectedPurpose?.name?.charAt(0).toUpperCase()}
                                        </div>
                                        {[
                                            { label: 'Name',    value: selectedPurpose?.name },
                                            { label: 'Department',   value: selectedPurpose?.department || '—' },
                                            { label: 'Default Service Time',value: selectedPurpose?.default_service_time || '—' },
                                            { label: 'Buffer Time Type',  value: selectedPurpose?.buffer_time || '—' },
                                            { label: 'Max Extension Limit',  value: selectedPurpose?.max_extension_limit || '—' },
                                        ].map(({ label, value, badge }) => (
                                            <div className="um-detail-row" key={label}>
                                                <span className="um-detail-label">{label}</span>
                                                {badge
                                                    ? <span className={`um-role-badge ${roleClass(value)}`}>{value}</span>
                                                    : <span className="um-detail-value">{value}</span>
                                                }
                                            </div>
                                        ))}
                                    </div>

                                </div>
                            ) : (
                                /* ── ADD / EDIT MODE ── */
                                <form onSubmit={handleSubmit} className="um-form">

                                    <div className="um-form-field">
                                        <label className="um-field-label">Full Name</label>
                                        <input className="um-field-input" type="text" name="name"
                                            value={purposeForm.name} onChange={handleInputChange}
                                            required placeholder="Enter Purpose Name" />
                                    </div>


                                    <div className="um-form-row">
                                
                                        <div className="um-form-field">
                                            <label className="um-field-label">Department</label>
                                            <input className="um-field-input" type="text" name="department"
                                                value={purposeForm.department} onChange={handleInputChange}
                                                placeholder="Enter department" />
                                        </div>

                                          <div className="um-form-field">
                                            <label className="um-field-label">Time Service</label>
                                            <input className="um-field-input" type="number" name="default_service_time"
                                                value={purposeForm.default_service_time} onChange={handleInputChange}
                                                placeholder="Enter Time service" />
                                        </div>

                                          <div className="um-form-field">
                                            <label className="um-field-label">Buffer Time</label>
                                            <input className="um-field-input" type="number" 
                                                value={purposeForm.buffer_time} onChange={handleInputChange} name="buffer_time"
                                                placeholder="Enter Buffer Time" />
                                        </div>

                                          <div className="um-form-field">
                                            <label className="um-field-label">Max Entension Limit</label>
                                            <input className="um-field-input" type="number" name="max_extension_limit"
                                                value={purposeForm.max_extension_limit} onChange={handleInputChange}
                                                placeholder="Enter Max Extension Limit" />
                                        </div>
                                    </div>

                                    <div className="um-form-actions">
                                        <button type="button" className="um-cancel-btn" onClick={closeModal}>
                                            Cancel
                                        </button>
                                        <button type="submit" className="um-submit-btn">
                                            {modalMode === 'add' ? '＋ Create User' : '✓ Update User'}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PurposeManagement;