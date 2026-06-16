import React, { useState } from 'react';

const ACCESS_LEVELS = [
  { id: 10, label: 'Viewer', description: 'Read-only access' },
  { id: 25, label: 'Reporter', description: 'Can submit tickets' },
  { id: 40, label: 'Updater', description: 'Can update existing tickets' },
  { id: 55, label: 'Developer', description: 'Full ticket lifecycle access' },
  { id: 70, label: 'Manager', description: 'Project-level admin privileges' },
  { id: 90, label: 'Administrator', description: 'Full system access' },
];

const CreateUser = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    real_name: '',
    access_level: 25,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const handleChange = (field) => (e) => {
    setFormData((prev) => ({
      ...prev,
      [field]: field === 'access_level' ? parseInt(e.target.value) : e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setResult(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        setResult({ type: 'success', message: data.message || 'User provisioned successfully. Welcome email dispatched.' });
        setFormData({ username: '', email: '', real_name: '', access_level: 25 });
      } else {
        const errData = await response.text();
        setResult({ type: 'error', message: `Provisioning failed: ${errData}` });
      }
    } catch (err) {
      setResult({ type: 'error', message: `Connection error — is the backend running? ${err.message}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in-up">
      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 mb-6 rounded-xl bg-accent-subtle border border-accent/10">
        <svg className="w-5 h-5 text-accent shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth="1.75" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
        </svg>
        <div>
          <p className="text-sm font-medium text-accent">Secure Provisioning</p>
          <p className="text-xs text-text-secondary mt-0.5">
            A cryptographically secure temporary password will be auto-generated and dispatched via your branded email. The user will be simultaneously provisioned in MantisBT.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 2-column grid for name fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Full Name */}
          <div>
            <label htmlFor="user-real-name" className="block text-xs font-medium text-text-secondary mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" fill="none" viewBox="0 0 24 24" strokeWidth="1.75" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
              <input
                id="user-real-name"
                required
                type="text"
                placeholder="John Doe"
                value={formData.real_name}
                onChange={handleChange('real_name')}
                className="
                  w-full pl-10 pr-3 py-2.5 text-sm text-text-primary
                  bg-surface border border-border rounded-[var(--radius-input)]
                  placeholder:text-text-muted/60
                  focus:outline-none focus:border-accent focus:ring-[3px] focus:ring-accent-ring
                  transition-all duration-200
                "
              />
            </div>
          </div>

          {/* Username */}
          <div>
            <label htmlFor="user-username" className="block text-xs font-medium text-text-secondary mb-1.5">
              Username
            </label>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" fill="none" viewBox="0 0 24 24" strokeWidth="1.75" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Zm0 0c0 1.657 1.007 3 2.25 3S21 13.657 21 12a9 9 0 1 0-2.636 6.364M16.5 12V8.25" />
              </svg>
              <input
                id="user-username"
                required
                type="text"
                placeholder="jdoe"
                value={formData.username}
                onChange={handleChange('username')}
                className="
                  w-full pl-10 pr-3 py-2.5 text-sm text-text-primary
                  bg-surface border border-border rounded-[var(--radius-input)]
                  placeholder:text-text-muted/60
                  focus:outline-none focus:border-accent focus:ring-[3px] focus:ring-accent-ring
                  transition-all duration-200
                "
              />
            </div>
          </div>
        </div>

        {/* Email */}
        <div>
          <label htmlFor="user-email" className="block text-xs font-medium text-text-secondary mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" fill="none" viewBox="0 0 24 24" strokeWidth="1.75" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
            </svg>
            <input
              id="user-email"
              required
              type="email"
              placeholder="jdoe@company.com"
              value={formData.email}
              onChange={handleChange('email')}
              className="
                w-full pl-10 pr-3 py-2.5 text-sm text-text-primary
                bg-surface border border-border rounded-[var(--radius-input)]
                placeholder:text-text-muted/60
                focus:outline-none focus:border-accent focus:ring-[3px] focus:ring-accent-ring
                transition-all duration-200
              "
            />
          </div>
          <p className="text-[11px] text-text-muted mt-1.5 ml-0.5">
            Temporary credentials will be sent to this address.
          </p>
        </div>

        {/* Access Level */}
        <div>
          <label htmlFor="user-access-level" className="block text-xs font-medium text-text-secondary mb-1.5">
            Access Level
          </label>
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" fill="none" viewBox="0 0 24 24" strokeWidth="1.75" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
            </svg>
            <select
              id="user-access-level"
              value={formData.access_level}
              onChange={handleChange('access_level')}
              className="
                w-full pl-10 pr-10 py-2.5 text-sm text-text-primary appearance-none
                bg-surface border border-border rounded-[var(--radius-input)]
                focus:outline-none focus:border-accent focus:ring-[3px] focus:ring-accent-ring
                transition-all duration-200 cursor-pointer
              "
            >
              {ACCESS_LEVELS.map((level) => (
                <option key={level.id} value={level.id}>
                  {level.label} (Level {level.id}) — {level.description}
                </option>
              ))}
            </select>
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </div>
        </div>

        {/* Access Level Visual Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {ACCESS_LEVELS.map((level) => (
            <button
              key={level.id}
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, access_level: level.id }))}
              className={`
                px-3 py-2.5 rounded-lg text-center transition-all duration-200 border
                ${formData.access_level === level.id
                  ? 'bg-accent text-white border-accent shadow-sm scale-[1.02]'
                  : 'bg-canvas border-border-subtle text-text-secondary hover:border-border hover:bg-surface-hover'
                }
              `}
            >
              <span className={`block text-[11px] font-semibold tabular-nums ${formData.access_level === level.id ? 'text-white/70' : 'text-text-muted'}`}>
                LVL {level.id}
              </span>
              <span className="block text-xs font-medium mt-0.5">{level.label}</span>
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="h-px bg-border-subtle" />

        {/* Submit */}
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs text-text-muted hidden sm:block">
            <svg className="w-3.5 h-3.5 inline -mt-0.5 mr-1" fill="none" viewBox="0 0 24 24" strokeWidth="1.75" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
            Password is auto-generated with bcrypt hashing
          </p>
          <button
            id="submit-create-user"
            type="submit"
            disabled={isSubmitting}
            className="
              px-6 py-2.5 text-sm font-medium
              bg-text-primary text-surface rounded-[var(--radius-button)]
              hover:bg-slate-800 active:scale-[0.98]
              disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
              transition-all duration-200
              flex items-center gap-2 shrink-0
            "
          >
            {isSubmitting ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Provisioning…
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM4 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 10.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
                </svg>
                Provision User
              </>
            )}
          </button>
        </div>
      </form>

      {/* Result Toast */}
      {result && (
        <div
          className={`
            mt-5 px-4 py-3.5 rounded-xl text-sm font-medium
            flex items-center gap-2.5 animate-fade-in-up
            ${result.type === 'success'
              ? 'bg-status-resolved-bg text-status-resolved-text border border-status-resolved-dot/20'
              : 'bg-status-new-bg text-status-new-text border border-status-new-dot/20'
            }
          `}
        >
          {result.type === 'success' ? (
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
          )}
          <span>{result.message}</span>
        </div>
      )}
    </div>
  );
};

export default CreateUser;
