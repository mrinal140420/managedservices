import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const ManagerDashboard = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [developers, setDevelopers] = useState([]);
  const [managerProjects, setManagerProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedHandlers, setSelectedHandlers] = useState({});
  const [assignStatus, setAssignStatus] = useState({ type: null, message: null, ticketId: null });

  useEffect(() => {
    fetchTickets();
    fetchUsers();
    fetchProjects();
  }, []);

  const fetchTickets = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/tickets`);
      if (response.ok) {
        const data = await response.json();
        setTickets(data.tickets || []);
      }
    } catch (err) {
      console.error("Failed to fetch tickets", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/data`);
      if (response.ok) {
        const data = await response.json();
        // Filter developers (level 55)
        setDevelopers(data.users.filter(u => u.access_level === 55));
      }
    } catch (err) {
      console.error("Failed to fetch users", err);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/users/${user.id}/projects`);
      if (response.ok) {
        const data = await response.json();
        setManagerProjects(data.projects || []);
      }
    } catch (err) {
      console.error("Failed to fetch projects", err);
    }
  };

  const handleAssign = async (ticketId) => {
    const handlerUsername = selectedHandlers[ticketId];
    if (!handlerUsername) {
      setAssignStatus({ type: 'error', message: 'Please select a developer first.', ticketId });
      return;
    }
    
    setAssignStatus({ type: 'loading', message: 'Assigning...', ticketId });
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/tickets/${ticketId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handler_name: handlerUsername, status_name: 'assigned' })
      });
      if (response.ok) {
        setAssignStatus({ type: 'success', message: 'Ticket assigned successfully!', ticketId });
        fetchTickets(); // Refresh list
        // Clear message after 3 seconds
        setTimeout(() => setAssignStatus({ type: null, message: null, ticketId: null }), 3000);
      } else {
        const errData = await response.json();
        setAssignStatus({ type: 'error', message: errData.detail || 'Failed to assign ticket.', ticketId });
      }
    } catch (err) {
      setAssignStatus({ type: 'error', message: 'Network error.', ticketId });
    }
  };

  const handleApproveService = async (ticket) => {
    const match = ticket.summary.match(/^\[New Service Request:\s*(.*?)\]/);
    if (!match) {
        setAssignStatus({ type: 'error', message: 'Invalid service format.', ticketId: ticket.id });
        return;
    }
    const serviceName = match[1];
    setAssignStatus({ type: 'loading', message: 'Approving...', ticketId: ticket.id });
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/projects/${ticket.project_id}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: serviceName })
      });
      
      if (response.ok) {
        // Automatically resolve ticket to indicate completion
        await fetch(`${import.meta.env.VITE_API_BASE_URL}/tickets/${ticket.id}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ handler_name: user.username, status_name: 'resolved' })
        });
        
        setAssignStatus({ type: 'success', message: 'Service Approved!', ticketId: ticket.id });
        fetchTickets(); 
        setTimeout(() => setAssignStatus({ type: null, message: null, ticketId: null }), 3000);
      } else {
        const errData = await response.json();
        setAssignStatus({ type: 'error', message: errData.detail || 'Approval failed.', ticketId: ticket.id });
      }
    } catch (err) {
      setAssignStatus({ type: 'error', message: 'Network error.', ticketId: ticket.id });
    }
  };

  // Isolate tickets to manager's explicitly assigned projects
  const managerTickets = tickets.filter(t => managerProjects.some(p => p.id === t.project_id));

  // Analytics Data Prep
  const statusCounts = managerTickets.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {});

  const statusData = Object.keys(statusCounts).map(key => ({
    name: key,
    value: statusCounts[key]
  }));

  const tierCounts = managerTickets.reduce((acc, t) => {
    const client = t.client || 'Unknown';
    acc[client] = (acc[client] || 0) + 1;
    return acc;
  }, {});

  const tierData = Object.keys(tierCounts).map(key => ({
    name: key,
    count: tierCounts[key]
  }));

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  const unassignedTickets = managerTickets.filter(t => t.assigned_to === 'Unassigned' || t.status === 'new');

  const getDeveloperWorkload = (devRealName) => {
    const devTickets = managerTickets.filter(t => t.assigned_to === devRealName);
    return {
      active: devTickets.filter(t => t.status !== 'resolved' && t.status !== 'closed').length,
      resolved: devTickets.filter(t => t.status === 'resolved' || t.status === 'closed').length
    };
  };

  return (
    <div className="animate-fade-in-up space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-text-primary">Manager Analytics</h2>
          <p className="text-sm text-text-muted mt-1">Project oversight and developer resource allocation.</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold text-accent">Logged in as {user?.real_name}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-text-muted">Loading analytics...</div>
      ) : (
        <>
          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart: Status Distribution */}
            <div className="bg-surface p-6 rounded-xl border border-border shadow-sm">
              <h3 className="text-sm font-semibold text-text-primary mb-6">Tickets by Status</h3>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', borderRadius: '8px' }}
                      itemStyle={{ color: 'var(--color-text-primary)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 mt-2 flex-wrap">
                {statusData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-1.5 text-xs text-text-secondary">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                    {entry.name} ({entry.value})
                  </div>
                ))}
              </div>
            </div>

            {/* Bar Chart: Volume by Tier/Project */}
            <div className="bg-surface p-6 rounded-xl border border-border shadow-sm">
              <h3 className="text-sm font-semibold text-text-primary mb-6">Volume by Project / Tier</h3>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={tierData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-subtle)" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} />
                    <Tooltip 
                      cursor={{ fill: 'var(--color-surface-hover)' }}
                      contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', borderRadius: '8px' }}
                    />
                    <Bar dataKey="count" fill="var(--color-accent)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Triage Queue */}
          <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border bg-canvas/50 flex justify-between items-center">
              <h3 className="text-sm font-semibold text-text-primary">Triage & Assignment Queue</h3>
              <span className="px-2 py-0.5 rounded-full bg-status-new-bg text-status-new-text text-xs font-medium border border-status-new-dot/20">
                {unassignedTickets.length} Needs Attention
              </span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-canvas border-b border-border">
                  <tr>
                    <th className="px-4 py-3 font-medium text-text-secondary">ID</th>
                    <th className="px-4 py-3 font-medium text-text-secondary">Summary</th>
                    <th className="px-4 py-3 font-medium text-text-secondary">Project / Tier</th>
                    <th className="px-4 py-3 font-medium text-text-secondary">Assign To Developer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {unassignedTickets.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-4 py-8 text-center text-text-muted">Queue is completely clear!</td>
                    </tr>
                  ) : (
                    unassignedTickets.map((t) => (
                      <tr key={t.id} className="hover:bg-surface-hover transition-colors">
                        <td className="px-4 py-3 text-text-muted font-medium w-16">#{t.id}</td>
                        <td className="px-4 py-3 text-text-primary">{t.summary}</td>
                        <td className="px-4 py-3 text-text-secondary w-48">{t.client || '-'}</td>
                        <td className="px-4 py-3 w-72">
                          {t.category === 'Others' && t.summary.startsWith('[New Service Request:') ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleApproveService(t)}
                                disabled={assignStatus.ticketId === t.id && assignStatus.type === 'loading'}
                                className="px-3 py-1.5 text-xs font-medium bg-emerald-600 text-white rounded hover:bg-emerald-500 transition-colors disabled:opacity-50"
                              >
                                {assignStatus.ticketId === t.id && assignStatus.type === 'loading' ? '...' : 'Approve Custom Service'}
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <select
                                value={selectedHandlers[t.id] || ''}
                                onChange={(e) => setSelectedHandlers({...selectedHandlers, [t.id]: e.target.value})}
                                className="flex-1 px-2.5 py-1.5 text-xs bg-canvas border border-border rounded focus:outline-none focus:border-accent"
                              >
                                <option value="" disabled>Select developer...</option>
                                {developers.map(d => (
                                  <option key={d.id} value={d.username}>{d.real_name}</option>
                                ))}
                              </select>
                              <button
                                onClick={() => handleAssign(t.id)}
                                disabled={assignStatus.ticketId === t.id && assignStatus.type === 'loading'}
                                className="px-3 py-1.5 text-xs font-medium bg-accent text-white rounded hover:bg-accent-hover transition-colors disabled:opacity-50"
                              >
                                {assignStatus.ticketId === t.id && assignStatus.type === 'loading' ? '...' : 'Assign'}
                              </button>
                            </div>
                          )}
                          {assignStatus.ticketId === t.id && assignStatus.type !== 'loading' && (
                            <p className={`text-[10px] mt-1 font-medium ${assignStatus.type === 'success' ? 'text-status-resolved-text' : 'text-status-new-text'}`}>
                              {assignStatus.message}
                            </p>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Developer Workload Tracker */}
          <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border bg-canvas/50">
              <h3 className="text-sm font-semibold text-text-primary">Developer Workload Tracker</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-canvas border-b border-border">
                  <tr>
                    <th className="px-4 py-3 font-medium text-text-secondary">Developer</th>
                    <th className="px-4 py-3 font-medium text-text-secondary">Active Tickets</th>
                    <th className="px-4 py-3 font-medium text-text-secondary">Resolved Tickets</th>
                    <th className="px-4 py-3 font-medium text-text-secondary">Bandwidth Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {developers.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-4 py-8 text-center text-text-muted">No developers found.</td>
                    </tr>
                  ) : (
                    developers.map((d) => {
                      const workload = getDeveloperWorkload(d.real_name);
                      return (
                        <tr key={d.id} className="hover:bg-surface-hover transition-colors">
                          <td className="px-4 py-3 text-text-primary font-medium">{d.real_name}</td>
                          <td className="px-4 py-3 text-text-secondary">{workload.active}</td>
                          <td className="px-4 py-3 text-text-secondary">{workload.resolved}</td>
                          <td className="px-4 py-3">
                            {workload.active > 3 ? (
                              <span className="px-2 py-0.5 rounded-full bg-status-new-bg text-status-new-text text-xs font-medium border border-status-new-dot/20">High Load</span>
                            ) : workload.active > 0 ? (
                              <span className="px-2 py-0.5 rounded-full bg-status-acknowledged-bg text-status-acknowledged-text text-xs font-medium border border-status-acknowledged-dot/20">Optimal</span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-status-resolved-bg text-status-resolved-text text-xs font-medium border border-status-resolved-dot/20">Available</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* All Project Tickets Tracker */}
          <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden mt-8">
            <div className="p-4 border-b border-border bg-canvas/50">
              <h3 className="text-sm font-semibold text-text-primary">All Project Tickets Oversight</h3>
            </div>
            <div className="overflow-x-auto max-h-[400px]">
              <table className="w-full text-left text-sm border-collapse relative">
                <thead className="bg-canvas border-b border-border sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="px-4 py-3 font-medium text-text-secondary">ID</th>
                    <th className="px-4 py-3 font-medium text-text-secondary">Summary</th>
                    <th className="px-4 py-3 font-medium text-text-secondary">Project / Tier</th>
                    <th className="px-4 py-3 font-medium text-text-secondary">Developer</th>
                    <th className="px-4 py-3 font-medium text-text-secondary">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {managerTickets.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-4 py-8 text-center text-text-muted">No tickets found for your projects.</td>
                    </tr>
                  ) : (
                    managerTickets.map((t) => (
                      <tr key={t.id} className="hover:bg-surface-hover transition-colors">
                        <td className="px-4 py-3 text-text-muted font-medium w-16">#{t.id}</td>
                        <td className="px-4 py-3 text-text-primary">{t.summary}</td>
                        <td className="px-4 py-3 text-text-secondary">{t.client || '-'}</td>
                        <td className="px-4 py-3 text-text-secondary font-medium">{t.assigned_to}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                            ${t.status === 'resolved' || t.status === 'closed' ? 'bg-status-resolved-bg text-status-resolved-text border border-status-resolved-dot/20' : 
                              t.status === 'acknowledged' || t.status === 'assigned' || t.status === 'confirmed' ? 'bg-status-acknowledged-bg text-status-acknowledged-text border border-status-acknowledged-dot/20' : 
                              'bg-status-new-bg text-status-new-text border border-status-new-dot/20'}
                          `}>
                            {t.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </>
      )}
    </div>
  );
};

export default ManagerDashboard;
