import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

const CHART_COLORS = [
  '#6366F1', // Indigo
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#64748B', // Slate
  '#F43F5E', // Rose
  '#06B6D4', // Cyan
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface rounded-lg shadow-[var(--shadow-elevated)] border border-border-subtle px-4 py-3">
      <p className="text-xs font-semibold text-text-primary mb-1">{label}</p>
      <p className="text-xs text-text-muted">
        <span className="font-semibold text-text-secondary">{payload[0].value}</span>{' '}
        {payload[0].value === 1 ? 'ticket' : 'tickets'}
      </p>
    </div>
  );
};

const TicketVolumeChart = ({ tickets, loading }) => {
  const data = useMemo(() => {
    const clientMap = {};
    tickets.forEach((t) => {
      // Shorten client names for chart readability
      const name = t.client?.replace(/^Client \w+ - /, '') || 'Unknown';
      clientMap[name] = (clientMap[name] || 0) + 1;
    });
    return Object.entries(clientMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [tickets]);

  return (
    <div className="animate-fade-in-up bg-surface rounded-[var(--radius-card)] shadow-[var(--shadow-card)] overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border-subtle">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent-subtle flex items-center justify-center">
              <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-text-primary leading-none">
                Ticket Volume by Client
              </h3>
              <p className="text-[11px] text-text-muted mt-0.5">
                Distribution of active incidents
              </p>
            </div>
          </div>
          <span className="text-[11px] font-medium text-text-muted bg-surface-muted px-2 py-0.5 rounded-md">
            {tickets.length} total
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="px-5 py-5">
        {loading ? (
          <div className="h-[240px] flex items-center justify-center">
            <div className="h-full w-full rounded animate-shimmer" />
          </div>
        ) : data.length === 0 ? (
          <div className="h-[240px] flex items-center justify-center text-sm text-text-muted">
            No data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart
              data={data}
              margin={{ top: 4, right: 4, left: -12, bottom: 4 }}
              barCategoryGap="30%"
            >
              <CartesianGrid
                vertical={false}
                strokeDasharray="4 4"
                stroke="#F1F5F9"
                strokeOpacity={0.8}
              />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#94A3B8', fontWeight: 500 }}
                dy={8}
              />
              <YAxis
                allowDecimals={false}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#94A3B8', fontWeight: 500 }}
                dx={-4}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99, 102, 241, 0.04)' }} />
              <Bar
                dataKey="count"
                radius={[6, 6, 0, 0]}
                maxBarSize={48}
              >
                {data.map((_, index) => (
                  <Cell
                    key={index}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                    fillOpacity={0.85}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default TicketVolumeChart;
