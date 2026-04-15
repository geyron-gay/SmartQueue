import React, { useEffect, useState } from 'react';
import axiosClient from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import '../../styles/UserManagement.css';
import { initializeSocket } from "../../context/socket";

const UserManagement = () => {
    const { user } = useAuth();
    const [usersList, setUsersList]     = useState([]);
    const [showModal, setShowModal]     = useState(false);
    const [modalMode, setModalMode]     = useState('add'); // 'add' | 'edit' | 'view'
    const [selectedUser, setSelectedUser] = useState(null);
    const [loading, setLoading]         = useState(true);
    const [searchTerm, setSearchTerm]   = useState('');
    const [roleFilter, setRoleFilter] = useState('all');

    const [formData, setFormData] = useState({
        name: '', username: '', email: '',
        password: '', role: '',
        student_id: '', department: user?.department || ''
    });

    useEffect(() => {
        let isMounted = true; 
    
        const initialize = async () => {
    
          await fetchUsers();
    
         
    
          const socket = initializeSocket();
    
          socket.on("QueueUpdated", () => fetchUsers());
    
      
            fetchUsers(); 
        
    
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
    

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await axiosClient.get('/users-management');
            setUsersList(res.data.data);
        } catch (err) {
            console.error('Failed to fetch users', err);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (userId, newStatus) => {
    try {
        // Confirmation alert
        if (!window.confirm(`Are you sure you want to ${newStatus} this user?`)) return;

        const response = await axiosClient.post(`/priority-status/${userId}`, {
            status: newStatus
        });

        alert(response.data.message);
        
        // Refresh your list locally after success
        // fetchPendingVerifications(); 
        
    } catch (error) {
        console.error("Failed to update status", error);
        alert("Error updating status. Check console.");
    }
};

    const handleDelete = async (id, name) => {
        if (window.confirm(`Delete "${name}"? This action cannot be undone.`)) {
            try {
                await axiosClient.delete(`/users-delete/${id}`);
                setUsersList(prev => prev.filter(u => u.id !== id));
            } catch {
                alert('Delete failed. Please try again.');
            }
        }
    };

    const validateStudentId = (id) => /^23-0\d{5}$/.test(id);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (user.role === 'student' && !validateStudentId(formData.student_id)) {
            alert('Invalid Student ID format. Use 23-0XXXXX');
            return;
        }
        try {
            if (modalMode === 'add') {
                await axiosClient.post('/users-create', formData);
            } else if (modalMode === 'edit') {
           
                await axiosClient.put(`/users-update/${selectedUser.id}`, formData);
            }
            fetchUsers();
            closeModal();
        } catch (err) {
            console.error('Operation failed:', err.response?.data);
            alert('Operation failed. Please check your inputs.');
        }
    };

    const openAddModal = () => {
        setModalMode('add');
        setFormData({ name: '', username: '', email: '', password: '', role: 'student', student_id: '', department: user?.department || '' });
        setShowModal(true);
    };
    const openEditModal = (u) => {
        setModalMode('edit');
        setSelectedUser(u);
        setFormData({ name: u.name, username: u.username, email: u.email, password: '', role: u.role, student_id: u.student_id || '', department: u.department || '' });
        setShowModal(true);
    };
    const openViewModal = (u) => {
        setModalMode('view');
        setSelectedUser(u);
        setShowModal(true);
    };
    const closeModal = () => {
        setShowModal(false);
        setSelectedUser(null);
        setModalMode('add');
    };

    const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleStudentIdChange = (e) => {
        const cleaned   = e.target.value.replace(/[^0-9]/g, '');
        const formatted = cleaned.length > 2 && cleaned.startsWith('23')
            ? `${cleaned.slice(0, 2)}-${cleaned.slice(2, 8)}`
            : cleaned;
        setFormData({ ...formData, student_id: formatted });
    };

   const term = searchTerm.toLowerCase();

const filteredUsers = usersList.filter(u => {
    const matchesSearch =
        (u.name     || '').toLowerCase().includes(term) ||
        (u.username || '').toLowerCase().includes(term) ||
        (u.email    || '').toLowerCase().includes(term);

    const matchesRole =
        roleFilter === 'all' || u.role === roleFilter;

    return matchesSearch && matchesRole;
});

    const roleClass = (role) => {
        if (role === 'admin') return 'um-role-admin';
        if (role === 'staff') return 'um-role-staff';
        return 'um-role-student';
    };

    const MODAL_META = {
        add:  { icon: '➕', title: 'Add New User',  sub: 'Fill in the details below' },
        edit: { icon: '✏️', title: 'Edit User',      sub: `Editing: ${selectedUser?.name || ''}` },
        view: { icon: '👁️', title: 'User Details',   sub: selectedUser?.email || '' },
    };

    return (
        <div className="um-container">

            {/* ── HEADER ── */}
            <div className="um-header">
                <div className="um-header-left">
                    <div className="um-header-icon">👥</div>
                    <div>
                        <h1 className="um-header-title">
                            {user?.role === 'admin' ? 'User Management' : `${user?.department} Users`}
                        </h1>
                        <p className="um-header-sub">Manage system users and permissions</p>
                    </div>
                </div>

                {user?.role === 'admin' && (
                    <>
                        <div className="um-header-rule" />
                        <button onClick={openAddModal} className="um-add-btn">
                            <span>＋</span> Add New User
                        </button>
                    </>
                )}
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

                <select
    value={roleFilter}
    onChange={(e) => setRoleFilter(e.target.value)}
    className="um-filter-dropdown"
>
    <option value="all">All</option>
    <option value="admin">Admin</option>
    <option value="staff">Staff</option>
    <option value="student">Student</option>
</select>
                <div className="um-count-chip">
                    <span className="um-count-num">{filteredUsers.length}</span>
                    <span className="um-count-label">users</span>
                </div>
            </div>

            {/* ── TABLE ── */}
            <div className="um-table-wrap">
                {loading ? (
                    <div className="um-loading">
                        <div className="um-spinner" />
                        <p>Loading users...</p>
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="um-empty">
                        <div className="um-empty-icon">👤</div>
                        <h3>No Users Found</h3>
                        <p>{searchTerm ? 'Try a different search term.' : 'Add your first user to get started.'}</p>
                    </div>
                ) : (
                    <table className="um-table">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Priority Type</th>
                                <th>Role</th>
                                <th>Department</th>
                                <th>Verification</th>
                                <th className="um-actions-col">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map(item => (
                                <tr
                                    key={item.id}
                                    className={item.priority_verification ? 'um-priority-row' : ''}
                                >
                                    {/* User */}
                                    <td>
                                        <div className="um-user-cell">
                                            <div className="um-avatar">
                                                {(item.name || '?').charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="um-user-name">{item.name}</div>
                                                <div className="um-user-email">{item.email}</div>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Priority type */}
                                    <td>
                                        <span className="um-priority-type">
                                            {item.priority_type || '—'}
                                        </span>
                                    </td>

                                    {/* Role */}
                                    <td>
                                        <span className={`um-role-badge ${roleClass(item.role)}`}>
                                            {item.role}
                                        </span>
                                    </td>

                                    {/* Department */}
                                    <td>
                                        <span className="um-dept-label">{item.department || '—'}</span>
                                    </td>

                                    {/* Verification */}
                                    <td>
                                        {item.priority_verification ? (
                                            <span className={`um-verify-badge ${item.priority_verification.status}`}>
                                                {item.priority_verification.status}
                                            </span>
                                        ) : (
                                            <span className="um-verify-none">Not submitted</span>
                                        )}
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
                                                title="Edit User"
                                            >✏️</button>
                                            <button
                                                className="um-action-btn um-delete-btn"
                                                onClick={() => handleDelete(item.id, item.name)}
                                                title="Delete User"
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
                                            {selectedUser?.name?.charAt(0).toUpperCase()}
                                        </div>
                                        {[
                                            { label: 'Full Name',    value: selectedUser?.name },
                                            { label: 'Username',     value: `@${selectedUser?.username}` },
                                            { label: 'Email',        value: selectedUser?.email },
                                            { label: 'Role',         value: selectedUser?.role,
                                              badge: true },
                                            { label: 'Department',   value: selectedUser?.department || '—' },
                                            { label: 'Verify Status',value: selectedUser?.priority_verification?.status || '—' },
                                            { label: 'Verify Type',  value: selectedUser?.priority_verification?.type || '—' },
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

                                    {/* Right: verification image + actions */}
                                    <div className="um-view-right">
                                        <div className="um-view-right-label">Verification ID</div>
                                        {selectedUser?.priority_verification?.url ? (
                                            <img
                                                src={selectedUser.priority_verification.url}
                                                alt="Verification proof"
                                                className="um-verify-img"
                                            />
                                        ) : (
                                            <div className="um-no-img">
                                                <span className="um-no-img-icon">🪪</span>
                                                No ID uploaded
                                            </div>
                                        )}

                                        {selectedUser?.priority_verification && (
                                            <div className="um-verify-actions">
                                                <button className="um-approve-btn" onClick={() => handleStatusUpdate(selectedUser.id, 'approved')}>Approve</button>
                                                <button className="um-reject-btn" onClick={() => handleStatusUpdate(selectedUser.id, 'rejected')}>Reject</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                /* ── ADD / EDIT MODE ── */
                                <form onSubmit={handleSubmit} className="um-form">

                                    <div className="um-form-field">
                                        <label className="um-field-label">Full Name</label>
                                        <input className="um-field-input" type="text" name="name"
                                            value={formData.name} onChange={handleInputChange}
                                            required placeholder="Enter full name" />
                                    </div>

                                    <div className="um-form-row">
                                        <div className="um-form-field">
                                            <label className="um-field-label">Username</label>
                                            <input className="um-field-input" type="text" name="username"
                                                value={formData.username} onChange={handleInputChange}
                                                required placeholder="Enter username" />
                                        </div>
                                        <div className="um-form-field">
    <label className="um-field-label">Student ID</label>
    <input
        className="um-field-input"
        type="text"
        name="student_id"
        value={formData.student_id}
        onChange={handleStudentIdChange}
        maxLength={10}
        placeholder="23-012345"
    />
</div>
                                    </div>

                                    <div className="um-form-field">
                                        <label className="um-field-label">Email Address</label>
                                        <input className="um-field-input" type="email" name="email"
                                            value={formData.email} onChange={handleInputChange}
                                            required placeholder="Enter email address" />
                                    </div>

                                    <div className="um-form-field">
                                        <label className="um-field-label">
                                            Password {modalMode === 'edit' && '(leave blank to keep current)'}
                                        </label>
                                        <input className="um-field-input" type="password" name="password"
                                            value={formData.password} onChange={handleInputChange}
                                            required={modalMode === 'add'} placeholder="Enter password" />
                                    </div>

                                    <div className="um-form-row">
                                        <div className="um-form-field">
                                            <label className="um-field-label">Role</label>
                                            <select className="um-field-select" name="role"
                                                value={formData.role} onChange={handleInputChange}>
                                                <option value="student">Student</option>
                                                <option value="visitor">Visitor</option>
                                                <option value="staff">Staff</option>
                                                {user?.role === 'admin' && <option value="admin">Admin</option>}
                                            </select>
                                        </div>
                                        <div className="um-form-field">
                                            <label className="um-field-label">Department</label>
                                            <input className="um-field-input" type="text" name="department"
                                                value={formData.department} onChange={handleInputChange}
                                                placeholder="Enter department" />
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

export default UserManagement;