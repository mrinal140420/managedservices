import React from 'react';

const MetricCard = ({ icon, label, value, trend, trendUp, color, bgColor, loading, stagger }) => (
  <div
    className={`
      animate-fade-in-up ${stagger}
      bg-surface rounded-[var(--radius-card)] shadow-[var(--shadow-card)]
      hover:shadow-[var(--shadow-card-hover)]
      transition-shadow duration-300
      p-5 flex items-center gap-4
    `}
  >
    <div
      className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
      style={{ backgroundColor: bgColor }}
    >
      <svg
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="1.75"
        stroke={color}
      >
        {icon}
      </svg>
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[11px] font-medium text-text-muted uppercase tracking-wider leading-none">
        {label}
      </p>
      {loading ? (
        <div className="mt-2 h-7 w-14 rounded animate-shimmer" />
      ) : (
        <div className="flex items-end gap-2 mt-1">
          <p className="text-2xl font-semibold text-text-primary tracking-tight leading-none">
            {value}
          </p>
          {trend && (
            <span className={`text-[11px] font-medium leading-none mb-0.5 ${trendUp ? 'text-status-new-text' : 'text-status-resolved-text'}`}>
              {trendUp ? '↑' : '↓'} {trend}
            </span>
          )}
        </div>
      )}
    </div>
  </div>
);

const DashboardMetrics = ({ tickets, loading }) => {
  // Derive metrics from ticket data
  const total = tickets.length;
  const critical = tickets.filter(
    (t) => t.status?.toLowerCase() === 'new'
  ).length;
  const unassigned = tickets.filter(
    (t) => !t.assigned_to || t.assigned_to === 'Unassigned'
  ).length;
  const resolved = tickets.filter(
    (t) => t.status?.toLowerCase() === 'resolved' || t.status?.toLowerCase() === 'closed'
  ).length;

  const cards = [
    {
      label: 'Active Tickets',
      value: total,
      trend: null,
      trendUp: false,
      color: 'var(--color-metric-total)',
      bgColor: 'var(--color-metric-total-bg)',
      stagger: 'stagger-1',
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6"
        />
      ),
    },
    {
      label: 'Critical Alerts',
      value: critical,
      trend: critical > 0 ? `${critical} need triage` : 'All clear',
      trendUp: critical > 0,
      color: 'var(--color-metric-critical)',
      bgColor: 'var(--color-metric-critical-bg)',
      stagger: 'stagger-2',
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
        />
      ),
    },
    {
      label: 'Unassigned',
      value: unassigned,
      trend: unassigned > 0 ? `${unassigned} pending` : 'All clear',
      trendUp: unassigned > 0,
      color: 'var(--color-metric-unassigned)',
      bgColor: 'var(--color-metric-unassigned-bg)',
      stagger: 'stagger-3',
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"
        />
      ),
    },
    {
      label: 'Resolved',
      value: resolved,
      trend: total > 0 ? `${Math.round((resolved / total) * 100)}% of total` : null,
      trendUp: false,
      color: 'var(--color-metric-resolution)',
      bgColor: 'var(--color-metric-resolution-bg)',
      stagger: 'stagger-4',
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
        />
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-5 mb-6 lg:mb-8">
      {cards.map((card) => (
        <MetricCard key={card.label} {...card} loading={loading} />
      ))}
    </div>
  );
};

export default DashboardMetrics;