import React, { useState } from 'react';

const StatusBadge = ({ status }) => {
  const config = {
    new: {
      bg: 'bg-status-new-bg',
      text: 'text-status-new-text',
      dot: 'bg-status-new-dot',
      label: 'New',
    },
    assigned: {
      bg: 'bg-status-assigned-bg',
      text: 'text-status-assigned-text',
      dot: 'bg-status-assigned-dot',
      label: 'Assigned',
    },
    acknowledged: {
      bg: 'bg-status-acknowledged-bg',
      text: 'text-status-acknowledged-text',
      dot: 'bg-status-acknowledged-dot',
      label: 'Acknowledged',
    },
    resolved: {
      bg: 'bg-status-resolved-bg',
      text: 'text-status-resolved-text',
      dot: 'bg-status-resolved-dot',
      label: 'Resolved',
    },
    closed: {
      bg: 'bg-status-closed-bg',
      text: 'text-status-closed-text',
      dot: 'bg-status-closed-dot',
      label: 'Closed',
    },
  };

  const s = config[status?.toLowerCase()] || config.closed;

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1
        text-xs font-medium rounded-[var(--radius-badge)]
        ${s.bg} ${s.text}
      `}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot} ${status?.toLowerCase() === 'new' ? 'animate-pulse-dot' : ''}`} />
      {s.label}
    </span>
  );
};

const TicketList = ({ tickets, loading, error }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Derive unique statuses from data
  const statuses = [...new Set(tickets.map((t) => t.status?.toLowerCase()).filter(Boolean))];

  // Apply filters
  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.client?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.assigned_to?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(ticket.id).includes(searchQuery);

    const matchesStatus =
      statusFilter === 'all' || ticket.status?.toLowerCase() === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // ── Loading State ──
  if (loading) {
    return (
      <div className="animate-fade-in-up bg-surface rounded-[var(--radius-card)] shadow-[var(--shadow-card)] overflow-hidden">
        <div className="px-5 py-4 border-b border-border-subtle">
          <div className="h-5 w-40 rounded animate-shimmer" />
        </div>
        <div className="divide-y divide-border-subtle">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="px-5 py-4 flex items-center gap-4">
              <div className="h-4 w-10 rounded animate-shimmer" />
              <div className="h-4 w-32 rounded animate-shimmer" />
              <div className="h-4 flex-1 rounded animate-shimmer" />
              <div className="h-5 w-20 rounded animate-shimmer" />
              <div className="h-4 w-24 rounded animate-shimmer" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Error State ──
  if (error) {
    return (
      <div className="animate-fade-in-up bg-surface rounded-[var(--radius-card)] shadow-[var(--shadow-card)] p-8">
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-xl bg-status-new-bg flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-status-new-text" fill="none" viewBox="0 0 24 24" strokeWidth="1.75" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-text-primary">Could not connect to backend</p>
          <p className="text-xs text-text-muted mt-1 max-w-xs">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up bg-surface rounded-[var(--radius-card)] shadow-[var(--shadow-card)] overflow-hidden">
      {/* Header with Search + Filter */}
      <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border-subtle">
        {/* Left: Title + Count */}
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-text-primary">
            Triage Queue
          </h3>
          <span className="text-xs font-medium text-text-muted bg-surface-muted px-2 py-0.5 rounded-md">
            {filteredTickets.length} of {tickets.length}
          </span>
        </div>

        {/* Right: Search + Status Filter */}
        <div className="flex items-center gap-2.5">
          {/* Search */}
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input
              id="ticket-search"
              type="text"
              placeholder="Search tickets…"
              className="
                w-full sm:w-56 pl-9 pr-3 py-2 text-sm text-text-primary
                bg-canvas border border-border rounded-[var(--radius-input)]
                placeholder:text-text-muted/60
                focus:outline-none focus:bg-surface focus:border-accent focus:ring-[3px] focus:ring-accent-ring
                transition-all duration-200
              "
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="
                appearance-none pl-3 pr-8 py-2 text-sm text-text-secondary
                bg-canvas border border-border rounded-[var(--radius-input)]
                cursor-pointer
                focus:outline-none focus:bg-surface focus:border-accent focus:ring-[3px] focus:ring-accent-ring
                transition-all duration-200
              "
            >
              <option value="all">All Statuses</option>
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
            <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-surface-muted/50">
              <th className="px-5 py-3 text-left text-[11px] uppercase tracking-wider font-medium text-text-muted w-16">
                ID
              </th>
              <th className="px-5 py-3 text-left text-[11px] uppercase tracking-wider font-medium text-text-muted">
                Client
              </th>
              <th className="px-5 py-3 text-left text-[11px] uppercase tracking-wider font-medium text-text-muted">
                Summary
              </th>
              <th className="px-5 py-3 text-left text-[11px] uppercase tracking-wider font-medium text-text-muted w-32">
                Status
              </th>
              <th className="px-5 py-3 text-left text-[11px] uppercase tracking-wider font-medium text-text-muted w-44">
                Assignee
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {filteredTickets.map((ticket) => (
              <tr
                key={ticket.id}
                className="hover:bg-surface-hover transition-colors duration-150 group cursor-default"
              >
                <td className="px-5 py-3.5 whitespace-nowrap">
                  <span className="text-xs font-mono text-text-muted">
                    #{ticket.id}
                  </span>
                </td>
                <td className="px-5 py-3.5 whitespace-nowrap">
                  <span className="text-sm font-medium text-text-primary">
                    {ticket.client}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <span
                    className="text-sm text-text-secondary truncate block max-w-md group-hover:text-text-primary transition-colors duration-150"
                    title={ticket.summary}
                  >
                    {ticket.summary}
                  </span>
                </td>
                <td className="px-5 py-3.5 whitespace-nowrap">
                  <StatusBadge status={ticket.status} />
                </td>
                <td className="px-5 py-3.5 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    {ticket.assigned_to && ticket.assigned_to !== 'Unassigned' ? (
                      <>
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-[10px] font-semibold text-slate-600 shrink-0">
                          {ticket.assigned_to
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                        <span className="text-sm text-text-secondary">
                          {ticket.assigned_to}
                        </span>
                      </>
                    ) : (
                      <span className="text-xs text-text-muted italic">
                        Unassigned
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}

            {filteredTickets.length === 0 && (
              <tr>
                <td colSpan="5" className="px-5 py-12 text-center">
                  <div className="flex flex-col items-center">
                    <svg className="w-10 h-10 text-text-muted/40 mb-3" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                    </svg>
                    <p className="text-sm font-medium text-text-secondary">No tickets found</p>
                    <p className="text-xs text-text-muted mt-1">
                      Try adjusting your search or filter
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      {filteredTickets.length > 0 && (
        <div className="px-5 py-3 border-t border-border-subtle bg-surface-muted/30 flex items-center justify-between">
          <p className="text-xs text-text-muted">
            Showing <span className="font-medium text-text-secondary">{filteredTickets.length}</span> of{' '}
            <span className="font-medium text-text-secondary">{tickets.length}</span> tickets
          </p>
          <p className="text-xs text-text-muted">
            Last synced just now
          </p>
        </div>
      )}
    </div>
  );
};

export default TicketList;