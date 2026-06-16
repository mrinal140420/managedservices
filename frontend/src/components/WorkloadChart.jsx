import React, { useMemo, useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Sector,
} from 'recharts';

const CHART_COLORS = [
  '#6366F1', // Indigo
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#64748B', // Slate
  '#F43F5E', // Rose
  '#06B6D4', // Cyan
  '#8B5CF6', // Violet
];

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const { name, value, percent } = payload[0].payload;
  return (
    <div className="bg-surface rounded-lg shadow-[var(--shadow-elevated)] border border-border-subtle px-4 py-3">
      <p className="text-xs font-semibold text-text-primary mb-1">{name}</p>
      <p className="text-xs text-text-muted">
        <span className="font-semibold text-text-secondary">{value}</span>{' '}
        {value === 1 ? 'ticket' : 'tickets'}{' '}
        <span className="text-text-muted">· {(percent * 100).toFixed(0)}%</span>
      </p>
    </div>
  );
};

const renderActiveShape = (props) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <Sector
      cx={cx}
      cy={cy}
      innerRadius={innerRadius - 2}
      outerRadius={outerRadius + 4}
      startAngle={startAngle}
      endAngle={endAngle}
      fill={fill}
      opacity={0.95}
    />
  );
};

const WorkloadChart = ({ tickets, loading }) => {
  const [activeIndex, setActiveIndex] = useState(-1);

  const data = useMemo(() => {
    const assigneeMap = {};
    tickets.forEach((t) => {
      const name = (!t.assigned_to || t.assigned_to === 'Unassigned')
        ? 'Unassigned'
        : t.assigned_to;
      assigneeMap[name] = (assigneeMap[name] || 0) + 1;
    });

    const total = tickets.length || 1;
    return Object.entries(assigneeMap)
      .map(([name, value]) => ({ name, value, percent: value / total }))
      .sort((a, b) => b.value - a.value);
  }, [tickets]);

  return (
    <div className="animate-fade-in-up bg-surface rounded-[var(--radius-card)] shadow-[var(--shadow-card)] overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border-subtle">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[rgba(16,185,129,0.08)] flex items-center justify-center">
              <svg className="w-4 h-4 text-[#10B981]" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-text-primary leading-none">
                Workload Distribution
              </h3>
              <p className="text-[11px] text-text-muted mt-0.5">
                Tickets by assignee
              </p>
            </div>
          </div>
          <span className="text-[11px] font-medium text-text-muted bg-surface-muted px-2 py-0.5 rounded-md">
            {data.length} assignees
          </span>
        </div>
      </div>

      {/* Chart + Legend */}
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
          <div className="flex items-center gap-6">
            {/* Doughnut */}
            <div className="shrink-0" style={{ width: 200, height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                    strokeWidth={0}
                    activeIndex={activeIndex}
                    activeShape={renderActiveShape}
                    onMouseEnter={(_, index) => setActiveIndex(index)}
                    onMouseLeave={() => setActiveIndex(-1)}
                  >
                    {data.map((_, index) => (
                      <Cell
                        key={index}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                        opacity={activeIndex === -1 || activeIndex === index ? 0.85 : 0.35}
                        style={{ transition: 'opacity 0.2s ease' }}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="flex-1 space-y-2.5 min-w-0">
              {data.map((entry, index) => (
                <div
                  key={entry.name}
                  className="flex items-center gap-3 group cursor-default"
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(-1)}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{
                      backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
                      opacity: activeIndex === -1 || activeIndex === index ? 1 : 0.35,
                      transition: 'opacity 0.2s ease',
                    }}
                  />
                  <span className="text-sm text-text-secondary truncate flex-1 group-hover:text-text-primary transition-colors duration-150">
                    {entry.name}
                  </span>
                  <span className="text-sm font-semibold text-text-primary tabular-nums">
                    {entry.value}
                  </span>
                  <span className="text-[11px] text-text-muted tabular-nums w-10 text-right">
                    {(entry.percent * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkloadChart;
