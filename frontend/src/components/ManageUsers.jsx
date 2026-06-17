import React, { useState, useEffect } from 'react';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionStatus, setActionStatus] = useState({ userId: null, type: null, message: null });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/data`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error("Failed to fetch users", err);
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleLabel = (level) => {
    switch (level) {
      case 90: return 'Administrator';
      case 70: return 'Manager';
      case 55: return 'Developer';
      case 40: return 'Updater';
      case 25: return 'Reporter';
      case 10: return 'Viewer';
      default: return `Level ${level}`;
    }
  };

  const handleAction = async (userId, action, ...args) => {
    setActionStatus({ userId, type: 'loading', message: 'Processing...' });
    let url = '';
    let method = 'PUT';

    if (action === 'delete') {
      if (!window.confirm("Are you sure you want to PERMANENTLY delete this user? This cannot be undone.")) {
        setActionStatus({ userId: null, type: null, message: null });
        return;
      }
      url = `${import.meta.env.VITE_API_BASE_URL}/users/${userId}`;
      method = 'DELETE';
    } else if (action === 'reset') {
      if (!window.confirm("Are you sure you want to reset this user's password? They will be emailed a new temporary password.")) {
        setActionStatus({ userId: null, type: null, message: null });
        return;
      }
      url = `${import.meta.env.VITE_API_BASE_URL}/users/${userId}/reset`;
    } else if (action === 'toggle_status') {
      const enable = args[0];
      url = `${import.meta.env.VITE_API_BASE_URL}/users/${userId}/status?enabled=${enable}`;
    }

    try {
      const response = await fetch(url, { method });
      if (response.ok) {
        setActionStatus({ userId, type: 'success', message: 'Action successful' });
        fetchUsers();
        setTimeout(() => setActionStatus({ userId: null, type: null, message: null }), 3000);
      } else {
        const errData = await response.json();
        setActionStatus({ userId, type: 'error', message: errData.detail || 'Action failed' });
      }
    } catch (err) {
      setActionStatus({ userId, type: 'error', message: 'Network error' });
    }
  };

  const handleEditEmail = async (userId, currentEmail) => {
    const newEmail = window.prompt("Enter the new email address for this user:", currentEmail);
    if (!newEmail || newEmail === currentEmail) return;
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      setActionStatus({ userId, type: 'error', message: 'Invalid email format' });
      return;
    }

    setActionStatus({ userId, type: 'loading', message: 'Updating email...' });
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/users/${userId}/email`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail })
      });
      if (response.ok) {
        setActionStatus({ userId, type: 'success', message: 'Email updated successfully' });
        fetchUsers();
        setTimeout(() => setActionStatus({ userId: null, type: null, message: null }), 3000);
      } else {
        const errData = await response.json();
        setActionStatus({ userId, type: 'error', message: errData.detail || 'Email update failed' });
      }
    } catch (err) {
      setActionStatus({ userId, type: 'error', message: 'Network error' });
    }
  };

  if (isLoading) return <div className="text-sm text-text-muted">Loading users...</div>;

  return (
    <div className="animate-fade-in-up">
      <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto max-h-[600px]">
          <table className="w-full text-left text-sm border-collapse relative">
            <thead className="bg-canvas border-b border-border sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-4 py-3 font-medium text-text-secondary">User</th>
                <th className="px-4 py-3 font-medium text-text-secondary">Role</th>
                <th className="px-4 py-3 font-medium text-text-secondary">Status</th>
                <th className="px-4 py-3 font-medium text-text-secondary text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-surface-hover transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-text-primary">{u.real_name}</div>
                    <div className="text-xs text-text-muted mt-0.5">@{u.username} • {u.email}</div>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {getRoleLabel(u.access_level)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${u.enabled ? 'bg-status-resolved-bg text-status-resolved-text border-status-resolved-dot/20' : 'bg-status-new-bg text-status-new-text border-status-new-dot/20'}`}>
                      {u.enabled ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {actionStatus.userId === u.id && actionStatus.type === 'loading' ? (
                        <span className="text-xs text-text-muted">Processing...</span>
                      ) : (
                        <>
                          <button
                            onClick={() => handleAction(u.id, 'toggle_status', !u.enabled)}
                            className="px-2.5 py-1.5 text-xs font-medium border border-border bg-canvas rounded hover:bg-surface-hover transition-colors text-text-secondary"
                          >
                            {u.enabled ? 'Disable' : 'Enable'}
                          </button>
                          <button
                            onClick={() => handleAction(u.id, 'reset')}
                            className="px-2.5 py-1.5 text-xs font-medium border border-border bg-canvas rounded hover:bg-surface-hover transition-colors text-text-secondary"
                          >
                            Reset Password
                          </button>
                          <button
                            onClick={() => handleEditEmail(u.id, u.email)}
                            className="px-2.5 py-1.5 text-xs font-medium border border-border bg-canvas rounded hover:bg-surface-hover transition-colors text-text-secondary"
                          >
                            Edit Email
                          </button>
                          <button
                            onClick={() => handleAction(u.id, 'delete')}
                            className="px-2.5 py-1.5 text-xs font-medium border border-status-new-dot/20 bg-status-new-bg rounded hover:bg-status-new-dot/10 transition-colors text-status-new-text"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                    {actionStatus.userId === u.id && actionStatus.type !== 'loading' && (
                      <p className={`text-[10px] mt-1.5 text-right font-medium ${actionStatus.type === 'success' ? 'text-status-resolved-text' : 'text-status-new-text'}`}>
                        {actionStatus.message}
                      </p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManageUsers;
