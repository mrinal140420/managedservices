import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        login(data.access_token, data.user);
        
        // Redirect based on role
        const level = data.user.access_level;
        if (level >= 90) navigate('/dashboard/admin');
        else if (level >= 70) navigate('/dashboard/manager');
        else if (level >= 55) navigate('/dashboard/developer');
        else navigate('/dashboard/client');
        
      } else {
        const errData = await response.json();
        setError(errData.detail || 'Invalid credentials');
      }
    } catch (err) {
      setError('Connection error — is the backend running?');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md bg-surface rounded-[var(--radius-card)] shadow-[var(--shadow-card)] p-8">
        
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center shadow-sm mb-4">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Mentis Center</h1>
          <p className="text-sm text-text-muted mt-1">Sign in to your account</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-status-new-bg text-status-new-text text-sm font-medium border border-status-new-dot/20">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Username</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2.5 text-sm bg-surface border border-border rounded-[var(--radius-input)] focus:outline-none focus:border-accent focus:ring-[3px] focus:ring-accent-ring transition-all"
              placeholder="e.g., admin"
            />
          </div>
          
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 text-sm bg-surface border border-border rounded-[var(--radius-input)] focus:outline-none focus:border-accent focus:ring-[3px] focus:ring-accent-ring transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 text-sm font-medium bg-accent text-white rounded-[var(--radius-button)] hover:bg-accent-hover transition-colors flex justify-center items-center gap-2"
          >
            {isSubmitting ? 'Authenticating...' : (
              <>
                <Lock className="w-4 h-4" />
                Sign In
              </>
            )}
          </button>
        </form>
        
        {/* Helper info for demo purposes */}
        <div className="mt-6 pt-4 border-t border-border">
          <p className="text-xs text-text-muted text-center">
            Demo Logins:<br/>
            <strong>admin</strong> (90) | <strong>manager</strong> (70)<br/>
            <strong>developer</strong> (55) | <strong>client</strong> (25, temp pw)
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
