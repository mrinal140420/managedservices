import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const TIER_CATEGORIES = {
  Basic: [
    'Billing Related Issues', 'IAM User Management', 'Incident Management', 
    'Increase Quota Limit', 'Monitor Server Availability', 'Monitor Server Utilization', 
    'Problem Management', 'Report Management', 'Subscription Management', 'Ticketing System'
  ],
  Gold: [
    'Backup & Restore', 'Patch Management', 'Website Health Monitoring', 
    'Change Management', 'Cost Optimization (Native Tools)'
  ],
  Platinum: [
    'Application Performance Monitoring', 'Best Practice Recommendation', 
    'Capacity Management', 'Database Backup (Native Tool)', 'Database Monitoring', 
    'Security Recommendation'
  ]
};

const ClientDashboard = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [projects, setProjects] = useState([]);
  const [customCategories, setCustomCategories] = useState([]);
  
  // Form State
  const [formData, setFormData] = useState({
    summary: '',
    description: '',
    client: '',
    category: 'Billing Related Issues',
    requestedService: '',
  });
  const [file, setFile] = useState(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch tickets and projects on mount
  useEffect(() => {
    fetchTickets();
    fetchProjects();
  }, []);

  const fetchTickets = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/tickets`);
      if (response.ok) {
        const data = await response.json();
        // Since Mantis API returns all tickets, we could filter by user in a real app.
        // For this demo, we'll show the fetched tickets.
        setTickets(data.tickets || []);
      }
    } catch (err) {
      console.error("Failed to fetch tickets", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/users/${user.id}/projects`);
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || []);
        if (data.projects && data.projects.length > 0) {
          setFormData(prev => ({ ...prev, client: data.projects[0].name }));
        }
      }
      
      const catResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/users/${user.id}/categories`);
      if (catResponse.ok) {
        const catData = await catResponse.json();
        setCustomCategories(catData.categories || []);
      }
    } catch (err) {
      console.error("Failed to fetch projects or categories", err);
    }
  };

  // Compute available categories based on selected project
  const getAvailableCategories = () => {
    const isGold = formData.client.includes('Gold');
    const isPlatinum = formData.client.includes('Platinum');
    
    let cats = [...TIER_CATEGORIES.Basic];
    if (isGold || isPlatinum) cats = [...cats, ...TIER_CATEGORIES.Gold];
    if (isPlatinum) cats = [...cats, ...TIER_CATEGORIES.Platinum];
    
    // Add dynamically approved custom categories
    customCategories.forEach(c => {
      if (!cats.includes(c)) cats.push(c);
    });
    
    return cats.sort();
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setResult(null);

    const submitData = new FormData();
    // If 'Others', modify the summary and category to inject the custom service request
    if (formData.category === 'Others') {
      submitData.append('summary', `[New Service Request: ${formData.requestedService}] ${formData.summary}`);
      submitData.append('category', 'Others');
    } else {
      submitData.append('summary', formData.summary);
      submitData.append('category', formData.category);
    }
    
    submitData.append('description', formData.description);
    submitData.append('client', formData.client);
    if (file) {
      submitData.append('file', file);
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/tickets`, {
        method: 'POST',
        body: submitData,
      });

      if (response.ok) {
        const data = await response.json();
        setResult({ type: 'success', message: `Ticket #${data.id} submitted successfully.` });
        setFormData(prev => ({ ...prev, summary: '', description: '' }));
        setFile(null);
        fetchTickets(); // Refresh list
      } else {
        const errData = await response.text();
        setResult({ type: 'error', message: `Failed to submit: ${errData}` });
      }
    } catch (err) {
      setResult({ type: 'error', message: `Connection error: ${err.message}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in-up space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-text-primary">Client Portal</h2>
          <p className="text-sm text-text-muted mt-1">Submit tickets and view your active requests.</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold text-accent">Logged in as {user?.real_name}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Ticket Submission Form */}
        <div className="lg:col-span-1">
          <div className="bg-surface rounded-xl border border-border p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              Create New Ticket
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Project / Tier</label>
                {projects.length > 0 ? (
                  <select
                    required
                    value={formData.client}
                    onChange={(e) => setFormData({...formData, client: e.target.value})}
                    className="w-full px-3 py-2 text-sm bg-canvas border border-border rounded-[var(--radius-input)] focus:outline-none focus:border-accent"
                  >
                    {projects.map(p => (
                      <option key={p.id} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                ) : (
                  <div className="w-full px-3 py-2 text-sm bg-surface-hover text-text-muted border border-border rounded-[var(--radius-input)]">
                    No assigned projects. Please contact an administrator.
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Category</label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full px-3 py-2 text-sm bg-canvas border border-border rounded-[var(--radius-input)] focus:outline-none focus:border-accent"
                >
                  {getAvailableCategories().map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="Others">Others (Request New Service)</option>
                </select>
              </div>

              {formData.category === 'Others' && (
                <div className="p-4 bg-accent-subtle rounded-xl border border-accent/20 animate-fade-in-up">
                  <label className="block text-xs font-medium text-accent mb-1.5">Requested Service Name</label>
                  <input
                    required
                    type="text"
                    value={formData.requestedService}
                    onChange={(e) => setFormData({...formData, requestedService: e.target.value})}
                    placeholder="e.g. AWS CI/CD Setup"
                    className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-[var(--radius-input)] focus:outline-none focus:border-accent focus:ring-[3px] focus:ring-accent-ring transition-all"
                  />
                  <p className="text-[10px] text-accent/80 mt-1.5">
                    This request will be sent to your manager for approval. Once approved, this service will be permanently added to your category list.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Summary</label>
                <input
                  required
                  type="text"
                  value={formData.summary}
                  onChange={(e) => setFormData({...formData, summary: e.target.value})}
                  placeholder="Brief description of the issue"
                  className="w-full px-3 py-2 text-sm bg-canvas border border-border rounded-[var(--radius-input)] focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Detailed Description</label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows="4"
                  placeholder="Provide steps to reproduce or details"
                  className="w-full px-3 py-2 text-sm bg-canvas border border-border rounded-[var(--radius-input)] focus:outline-none focus:border-accent resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Attachment (Optional)</label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-border border-dashed rounded-lg bg-canvas hover:border-accent transition-colors">
                  <div className="space-y-1 text-center">
                    <svg className="mx-auto h-8 w-8 text-text-muted" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="flex text-xs text-text-secondary justify-center">
                      <label htmlFor="file-upload" className="relative cursor-pointer bg-transparent rounded-md font-medium text-accent hover:text-accent-hover focus-within:outline-none">
                        <span>Upload a file</span>
                        <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-[10px] text-text-muted mt-1">PNG, JPG, PDF up to 10MB</p>
                    {file && <p className="text-[11px] text-accent mt-2 font-medium break-all">{file.name}</p>}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || projects.length === 0}
                className="w-full py-2.5 mt-2 text-sm font-medium bg-accent text-white rounded-[var(--radius-button)] hover:bg-accent-hover transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Ticket'}
              </button>
            </form>

            {result && (
              <div className={`mt-4 p-3 rounded-lg text-xs font-medium border ${result.type === 'success' ? 'bg-status-resolved-bg text-status-resolved-text border-status-resolved-dot/20' : 'bg-status-new-bg text-status-new-text border-status-new-dot/20'}`}>
                {result.message}
              </div>
            )}
          </div>
        </div>

        {/* Ticket List */}
        <div className="lg:col-span-2">
          <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-4 border-b border-border bg-canvas/50">
              <h3 className="text-sm font-semibold text-text-primary">My Active Tickets</h3>
            </div>
            
            <div className="p-0 overflow-auto flex-1 max-h-[600px]">
              {isLoading ? (
                <div className="p-8 text-center text-text-muted text-sm">Loading tickets...</div>
              ) : tickets.filter(t => t.reporter_id === user.id).length === 0 ? (
                <div className="p-8 text-center text-text-muted text-sm flex flex-col items-center">
                  <svg className="w-8 h-8 mb-3 opacity-50" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 15.75h3.75M18 9.75v-.75a2.25 2.25 0 0 0-2.25-2.25h-7.5a2.25 2.25 0 0 0-2.25 2.25v.75m11.25 0v11.25c0 1.243-1.007 2.25-2.25 2.25h-7.5a2.25 2.25 0 0 1-2.25-2.25V9.75M12 2.25A2.25 2.25 0 0 1 14.25 4.5h-4.5A2.25 2.25 0 0 1 12 2.25Z" />
                  </svg>
                  You haven't submitted any tickets yet.
                </div>
              ) : (
                <table className="w-full text-left text-sm border-collapse">
                  <thead className="bg-canvas sticky top-0 z-10 border-b border-border">
                    <tr>
                      <th className="px-4 py-3 font-medium text-text-secondary">ID</th>
                      <th className="px-4 py-3 font-medium text-text-secondary">Summary</th>
                      <th className="px-4 py-3 font-medium text-text-secondary">Project / Tier</th>
                      <th className="px-4 py-3 font-medium text-text-secondary">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {tickets.filter(t => t.reporter_id === user.id).map((t) => (
                      <tr key={t.id} className="hover:bg-surface-hover transition-colors">
                        <td className="px-4 py-3 text-text-muted font-medium">#{t.id}</td>
                        <td className="px-4 py-3 text-text-primary">{t.summary}</td>
                        <td className="px-4 py-3 text-text-secondary">{t.client || '-'}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                            ${t.status === 'resolved' || t.status === 'closed' ? 'bg-status-resolved-bg text-status-resolved-text' : 
                              t.status === 'acknowledged' || t.status === 'assigned' ? 'bg-status-acknowledged-bg text-status-acknowledged-text' : 
                              'bg-status-new-bg text-status-new-text'}
                          `}>
                            {t.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;
