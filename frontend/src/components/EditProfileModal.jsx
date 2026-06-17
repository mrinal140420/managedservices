import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const EditProfileModal = ({ isOpen, onClose }) => {
  const { user, token } = useAuth();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState({ type: null, message: '' });

  useEffect(() => {
    if (user) setEmail(user.email || '');
  }, [user]);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (email === user.email) {
      onClose();
      return;
    }
    
    setStatus({ type: 'loading', message: 'Updating...' });
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/users/${user.id}/email`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email })
      });
      
      if (response.ok) {
        setStatus({ type: 'success', message: 'Email updated! Reloading...' });
        setTimeout(() => {
            window.location.reload();
        }, 1500);
      } else {
        const errData = await response.json();
        setStatus({ type: 'error', message: errData.detail || 'Failed to update email.' });
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'Network error.' });
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-text-primary/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-surface rounded-xl shadow-lg p-6 animate-fade-in-up">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Edit Profile</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-canvas border border-border rounded-lg focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
              required
            />
          </div>
          {status.message && (
            <p className={`text-xs font-medium ${status.type === 'success' ? 'text-status-resolved-text' : 'text-status-new-text'}`}>
              {status.message}
            </p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-text-secondary bg-canvas border border-border rounded-lg hover:bg-surface-hover transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={status.type === 'loading'} className="px-4 py-2 text-sm font-medium text-white bg-accent rounded-lg hover:bg-accent-hover transition-colors disabled:opacity-50">
              {status.type === 'loading' ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal;
