import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const DeveloperDashboard = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal State
  const [resolvingTicket, setResolvingTicket] = useState(null);
  const [timeLogged, setTimeLogged] = useState('');
  const [bugnote, setBugnote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchTickets();
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

  const updateStatus = async (ticketId, newStatus, extraData = {}) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/tickets/${ticketId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status_name: newStatus, ...extraData })
      });
      if (response.ok) {
        fetchTickets();
      } else {
        console.error("Failed to update status");
      }
    } catch (err) {
      console.error("Error:", err);
    }
  };

  const handleDragStart = (e, ticketId) => {
    e.dataTransfer.setData("ticketId", ticketId);
  };

  const handleDrop = (e, targetStatus) => {
    e.preventDefault();
    const ticketId = parseInt(e.dataTransfer.getData("ticketId"));
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket || ticket.status === targetStatus) return;

    if (targetStatus === 'resolved' || targetStatus === 'closed') {
      setResolvingTicket(ticket);
    } else {
      updateStatus(ticketId, targetStatus);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const submitResolve = async (e) => {
    e.preventDefault();
    if (!timeLogged) return;
    
    setIsSubmitting(true);
    await updateStatus(resolvingTicket.id, 'resolved', {
      time_logged_hours: parseFloat(timeLogged),
      bugnote_text: bugnote
    });
    setResolvingTicket(null);
    setTimeLogged('');
    setBugnote('');
    setIsSubmitting(false);
  };

  // Group tickets and strictly isolate to current developer
  const devTickets = tickets.filter(t => t.handler_id === user.id);
  const columns = {
    new: devTickets.filter(t => t.status === 'new' || t.status === 'feedback'),
    inProgress: devTickets.filter(t => t.status === 'acknowledged' || t.status === 'assigned' || t.status === 'confirmed'),
    resolved: devTickets.filter(t => t.status === 'resolved' || t.status === 'closed')
  };

  return (
    <div className="animate-fade-in-up flex flex-col h-[calc(100vh-140px)]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-text-primary">Developer Kanban</h2>
          <p className="text-sm text-text-muted mt-1">Drag tickets to update status. Time logging required for resolution.</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold text-accent">Logged in as {user?.real_name}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center text-text-muted">Loading board...</div>
      ) : (
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden">
          
          {/* Column 1: New / Feedback */}
          <div 
            className="bg-surface rounded-xl border border-border flex flex-col overflow-hidden"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'new')}
          >
            <div className="p-4 border-b border-border bg-canvas/50 flex justify-between items-center">
              <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-status-new-dot"></span>
                To Do
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-surface-hover text-xs font-medium text-text-muted">{columns.new.length}</span>
            </div>
            <div className="p-4 flex-1 overflow-y-auto space-y-3">
              {columns.new.map(t => (
                <div 
                  key={t.id} 
                  draggable 
                  onDragStart={(e) => handleDragStart(e, t.id)}
                  className="p-4 rounded-lg bg-canvas border border-border hover:border-accent/50 hover:shadow-sm cursor-grab active:cursor-grabbing transition-all"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-bold text-text-muted">#{t.id}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-hover text-text-secondary">{t.client}</span>
                  </div>
                  <h4 className="text-sm font-medium text-text-primary mb-3">{t.summary}</h4>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-text-secondary line-clamp-1">{t.assigned_to}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 2: In Progress */}
          <div 
            className="bg-surface rounded-xl border border-border flex flex-col overflow-hidden"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'acknowledged')}
          >
            <div className="p-4 border-b border-border bg-canvas/50 flex justify-between items-center">
              <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-status-acknowledged-dot"></span>
                In Progress
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-surface-hover text-xs font-medium text-text-muted">{columns.inProgress.length}</span>
            </div>
            <div className="p-4 flex-1 overflow-y-auto space-y-3">
              {columns.inProgress.map(t => (
                <div 
                  key={t.id} 
                  draggable 
                  onDragStart={(e) => handleDragStart(e, t.id)}
                  className="p-4 rounded-lg bg-canvas border border-border hover:border-accent/50 hover:shadow-sm cursor-grab active:cursor-grabbing transition-all border-l-4 border-l-status-acknowledged-dot"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-bold text-text-muted">#{t.id}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-hover text-text-secondary">{t.client}</span>
                  </div>
                  <h4 className="text-sm font-medium text-text-primary mb-3">{t.summary}</h4>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-text-secondary line-clamp-1">{t.assigned_to}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 3: Resolved */}
          <div 
            className="bg-surface rounded-xl border border-border flex flex-col overflow-hidden"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'resolved')}
          >
            <div className="p-4 border-b border-border bg-canvas/50 flex justify-between items-center">
              <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-status-resolved-dot"></span>
                Resolved
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-surface-hover text-xs font-medium text-text-muted">{columns.resolved.length}</span>
            </div>
            <div className="p-4 flex-1 overflow-y-auto space-y-3 opacity-70">
              {columns.resolved.map(t => (
                <div 
                  key={t.id} 
                  className="p-4 rounded-lg bg-canvas border border-border border-l-4 border-l-status-resolved-dot"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-bold text-text-muted line-through">#{t.id}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-hover text-text-secondary">{t.client}</span>
                  </div>
                  <h4 className="text-sm font-medium text-text-secondary mb-3">{t.summary}</h4>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-text-muted">Completed</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* Force Time Logging Modal */}
      {resolvingTicket && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-text-primary/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-surface rounded-[var(--radius-card)] shadow-[var(--shadow-elevated)] p-8 animate-fade-in-up">
            
            <h3 className="text-lg font-bold text-text-primary mb-2">Resolve Ticket #{resolvingTicket.id}</h3>
            <p className="text-sm text-text-muted mb-6">Before closing this ticket, you must log your hours worked.</p>

            <form onSubmit={submitResolve} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Hours Worked</label>
                <input
                  type="number"
                  step="0.25"
                  min="0.25"
                  required
                  value={timeLogged}
                  onChange={(e) => setTimeLogged(e.target.value)}
                  placeholder="e.g. 1.5"
                  className="w-full px-3 py-2 text-sm bg-canvas border border-border rounded-[var(--radius-input)] focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Resolution Notes (Optional)</label>
                <textarea
                  value={bugnote}
                  onChange={(e) => setBugnote(e.target.value)}
                  rows="3"
                  placeholder="What was fixed?"
                  className="w-full px-3 py-2 text-sm bg-canvas border border-border rounded-[var(--radius-input)] focus:outline-none focus:border-accent resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setResolvingTicket(null)}
                  className="flex-1 py-2.5 text-sm font-medium bg-canvas border border-border text-text-secondary rounded-[var(--radius-button)] hover:bg-surface-hover transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !timeLogged}
                  className="flex-1 py-2.5 text-sm font-medium bg-accent text-white rounded-[var(--radius-button)] hover:bg-accent-hover transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Resolve Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default DeveloperDashboard;
