import React, { useState } from 'react';
import CreateUser from './CreateUser';
import AssignProject from './AssignProject';
import ManageUsers from './ManageUsers';

const TABS = [
  {
    id: 'users',
    label: 'Provision User',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.75" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM4 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 10.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
      </svg>
    ),
  },
  {
    id: 'manage_users',
    label: 'Manage Users',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.75" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
      </svg>
    ),
  },
  {
    id: 'projects',
    label: 'Project Assignment',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.75" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
      </svg>
    ),
  },
];

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('users');

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent to-indigo-400 flex items-center justify-center shadow-sm">
              <svg className="w-[18px] h-[18px] text-white" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-text-primary tracking-tight">
              Admin Console
            </h2>
          </div>
          <p className="text-sm text-text-muted mt-1 ml-[47px]">
            Provision accounts, assign projects, and manage access levels.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => window.open(`${import.meta.env.VITE_API_BASE_URL}/reports/tickets/csv`, '_blank')}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-canvas border border-border text-text-secondary rounded-lg hover:bg-surface-hover hover:text-accent transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Global Report
          </button>
          
          {/* Sync badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent-subtle">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-dot" />
            <span className="text-xs font-medium text-accent">MantisBT Synced</span>
          </div>
        </div>
      </div>

      {/* ── Tab Navigation ── */}
      <div className="bg-surface rounded-[var(--radius-card)] shadow-[var(--shadow-card)] overflow-hidden">
        <div className="border-b border-border">
          <nav className="flex px-5 gap-1" aria-label="Admin tabs">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                id={`admin-tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  relative flex items-center gap-2 px-4 py-3.5 text-sm font-medium
                  transition-colors duration-200 rounded-t-lg
                  ${activeTab === tab.id
                    ? 'text-accent'
                    : 'text-text-muted hover:text-text-secondary'
                  }
                `}
              >
                {tab.icon}
                {tab.label}
                {/* Active indicator bar */}
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-accent rounded-full" />
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* ── Tab Content ── */}
        <div className="p-5 lg:p-6">
          {activeTab === 'users' && <CreateUser />}
          {activeTab === 'manage_users' && <ManageUsers />}
          {activeTab === 'projects' && <AssignProject />}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
