import React, { useState, useEffect } from 'react';

const PROJECT_ACCESS_LEVELS = [
  { id: 25, label: 'Reporter' },
  { id: 40, label: 'Updater' },
  { id: 55, label: 'Developer' },
  { id: 70, label: 'Manager' },
  { id: 90, label: 'Administrator' },
];

const AssignProject = () => {
  const [formData, setFormData] = useState({
    manager_email: '',
    manager_name: '',
    project_name: '',
    project_id: '',
    user_id: '',
    access_level: 70,
  });
  
  const [dbData, setDbData] = useState({ users: [], projects: [] });
  const [isLoadingData, setIsLoadingData] = useState(true);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/data`);
        if (response.ok) {
          const data = await response.json();
          setDbData(data);
        }
      } catch (err) {
        console.error("Failed to fetch admin data", err);
      } finally {
        setIsLoadingData(false);
      }
    };
    fetchAdminData();
  }, []);

  const handleUserSelect = (e) => {
    const userId = e.target.value;
    const user = dbData.users.find(u => u.id === parseInt(userId));
    if (user) {
      setFormData(prev => ({
        ...prev,
        user_id: user.id,
        manager_name: user.real_name,
        manager_email: user.email
      }));
    } else {
      setFormData(prev => ({ ...prev, user_id: '', manager_name: '', manager_email: '' }));
    }
  };

  const handleProjectSelect = (e) => {
    const projectId = e.target.value;
    const project = dbData.projects.find(p => p.id === parseInt(projectId));
    if (project) {
      setFormData(prev => ({
        ...prev,
        project_id: project.id,
        project_name: project.name
      }));
    } else {
      setFormData(prev => ({ ...prev, project_id: '', project_name: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.user_id || !formData.project_id) {
        setResult({ type: 'error', message: 'Please select both a User and a Project.' });
        return;
    }
    
    setIsSubmitting(true);
    setResult(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/assign-project`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        setResult({ type: 'success', message: data.message || 'Project assigned and notification sent.' });
        setFormData(prev => ({
          ...prev,
          user_id: '',
          manager_name: '',
          manager_email: '',
          project_id: '',
          project_name: ''
        }));
      } else {
        const errData = await response.text();
        setResult({ type: 'error', message: `Assignment failed: ${errData}` });
      }
    } catch (err) {
      setResult({ type: 'error', message: `Connection error — is the backend running? ${err.message}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingData) {
    return <div className="p-8 text-center text-text-muted">Loading database...</div>;
  }

  return (
    <div className="animate-fade-in-up">
      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 mb-6 rounded-xl bg-status-acknowledged-bg/60 border border-status-acknowledged-dot/10">
        <svg className="w-5 h-5 text-status-acknowledged-text shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth="1.75" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m9.86-4.939a4.5 4.5 0 0 0-1.242-7.244l-4.5-4.5a4.5 4.5 0 1 0-6.364 6.364L7.94 8.688" />
        </svg>
        <div>
          <p className="text-sm font-medium text-status-acknowledged-text">Project Binding</p>
          <p className="text-xs text-text-secondary mt-0.5">
            This links a user to a MantisBT project with the specified access level. The assigned manager will receive an automated notification email with their new responsibilities.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Section: Manager Info */}
        <div>
          <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
            Assignee Details
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* User Dropdown */}
            <div className="md:col-span-2">
              <label htmlFor="assign-user-select" className="block text-xs font-medium text-text-secondary mb-1.5">
                Select User
              </label>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" fill="none" viewBox="0 0 24 24" strokeWidth="1.75" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
                <select
                  id="assign-user-select"
                  required
                  value={formData.user_id}
                  onChange={handleUserSelect}
                  className="
                    w-full pl-10 pr-3 py-2.5 text-sm text-text-primary
                    bg-surface border border-border rounded-[var(--radius-input)]
                    focus:outline-none focus:border-accent focus:ring-[3px] focus:ring-accent-ring
                    transition-all duration-200 appearance-none
                  "
                >
                  <option value="" disabled>-- Select a MantisBT User --</option>
                  {dbData.users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.real_name} (@{u.username}) - Level {u.access_level}
                    </option>
                  ))}
                </select>
                {/* Custom dropdown arrow */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4 text-text-muted" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                  </svg>
                </div>
              </div>
            </div>
            
            {/* Read-only fields showing selected data */}
            {formData.user_id && (
                <>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">MantisBT User ID</label>
                  <input type="text" readOnly value={formData.user_id} className="w-full px-3 py-2 text-sm bg-surface-hover border border-border rounded-[var(--radius-input)] text-text-muted cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">Auto-Dispatch Email</label>
                  <input type="text" readOnly value={formData.manager_email} className="w-full px-3 py-2 text-sm bg-surface-hover border border-border rounded-[var(--radius-input)] text-text-muted cursor-not-allowed" />
                </div>
                </>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-border-subtle" />

        {/* Section: Project Info */}
        <div>
          <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
            </svg>
            Project / Tier Details
          </h4>
          <div className="grid grid-cols-1 gap-4">
            {/* Project Dropdown */}
            <div>
              <label htmlFor="assign-project-select" className="block text-xs font-medium text-text-secondary mb-1.5">
                Select Project / Tier
              </label>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" fill="none" viewBox="0 0 24 24" strokeWidth="1.75" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
                </svg>
                <select
                  id="assign-project-select"
                  required
                  value={formData.project_id}
                  onChange={handleProjectSelect}
                  className="
                    w-full pl-10 pr-3 py-2.5 text-sm text-text-primary
                    bg-surface border border-border rounded-[var(--radius-input)]
                    focus:outline-none focus:border-accent focus:ring-[3px] focus:ring-accent-ring
                    transition-all duration-200 appearance-none
                  "
                >
                  <option value="" disabled>-- Select a Project or Tier --</option>
                  {dbData.projects
                    .filter(p => {
                      // Get currently selected user to determine if we show Tiers or Projects
                      const selectedUser = dbData.users.find(u => u.id === formData.user_id);
                      if (!selectedUser) return true; // Show all if no user selected
                      
                      const isTier = p.name.includes("Tier") || p.name.includes("Plan") || p.name.includes("Basic");
                      
                      if (selectedUser.access_level === 25) {
                          return isTier; // Clients only see Tiers
                      } else if (selectedUser.access_level === 55 || selectedUser.access_level === 70) {
                          return !isTier; // Devs & Managers only see actual Projects
                      }
                      return true; // Admins or other see all
                    })
                    .map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (ID: {p.id})
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4 text-text-muted" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Access Level */}
            <div>
              <label htmlFor="assign-access-level" className="block text-xs font-medium text-text-secondary mb-1.5">
                Project Access Level
              </label>
              <div className="flex flex-wrap gap-2">
                {PROJECT_ACCESS_LEVELS.map((level) => (
                  <button
                    key={level.id}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, access_level: level.id }))}
                    className={`
                      px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border
                      ${formData.access_level === level.id
                        ? 'bg-accent text-white border-accent shadow-sm'
                        : 'bg-canvas border-border-subtle text-text-secondary hover:border-border hover:bg-surface-hover'
                      }
                    `}
                  >
                    {level.label}
                    <span className={`ml-1.5 text-[11px] tabular-nums ${formData.access_level === level.id ? 'text-white/60' : 'text-text-muted'}`}>
                      {level.id}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-border-subtle" />

        {/* Action row */}
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs text-text-muted hidden sm:block">
            <svg className="w-3.5 h-3.5 inline -mt-0.5 mr-1" fill="none" viewBox="0 0 24 24" strokeWidth="1.75" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
            </svg>
            Notification email will be auto-dispatched
          </p>
          <button
            id="submit-assign-project"
            type="submit"
            disabled={isSubmitting || !formData.user_id || !formData.project_id}
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
                Assigning…
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m9.86-4.939a4.5 4.5 0 0 0-1.242-7.244l-4.5-4.5a4.5 4.5 0 1 0-6.364 6.364L7.94 8.688" />
                </svg>
                Assign Project
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

export default AssignProject;
