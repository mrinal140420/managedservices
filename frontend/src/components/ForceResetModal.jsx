import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, ShieldAlert } from 'lucide-react';

const ForceResetModal = () => {
  const { forceReset, completePasswordReset } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  if (!forceReset) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    
    // Process reset
    completePasswordReset();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-text-primary/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-surface rounded-[var(--radius-card)] shadow-[var(--shadow-elevated)] p-8 animate-fade-in-up">
        
        <div className="flex items-center gap-3 mb-6 p-4 bg-status-acknowledged-bg rounded-xl border border-status-acknowledged-dot/20">
          <ShieldAlert className="w-6 h-6 text-status-acknowledged-text" />
          <div>
            <h3 className="font-semibold text-status-acknowledged-text">Action Required</h3>
            <p className="text-xs text-status-acknowledged-text/80 mt-0.5">You are using a temporary password. Please set a new secure private password.</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-2.5 rounded-lg bg-status-new-bg text-status-new-text text-xs font-medium text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">New Password</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-[var(--radius-input)] focus:outline-none focus:border-accent focus:ring-[3px] transition-all"
            />
          </div>
          
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Confirm Password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-[var(--radius-input)] focus:outline-none focus:border-accent focus:ring-[3px] transition-all"
            />
          </div>

          <button
            type="submit"
            className="w-full mt-2 py-2.5 text-sm font-medium bg-accent text-white rounded-[var(--radius-button)] hover:bg-accent-hover transition-colors flex justify-center items-center gap-2"
          >
            <Lock className="w-4 h-4" />
            Set Secure Password
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForceResetModal;
