"use client";
// Simple tabbed admin shell.
// Tabs: Conversations (existing AdminEventsTable) and Redirects (new RedirectsDashboard).

import React, { useEffect, useMemo, useState } from 'react';
import AdminEventsTable from './AdminEventsTable';
import RedirectsDashboard from './RedirectsDashboard';
import RedirectsRawTable from './RedirectsRawTable';
import IndustryMapping from './IndustryMapping';

function getInitialTab(): 'conversations' | 'redirects' | 'industry' {
  if (typeof window === 'undefined') return 'conversations';
  const sp = new URLSearchParams(window.location.search);
  const t = (sp.get('tab') || '').toLowerCase();
  if (t === 'redirects') return 'redirects';
  if (t === 'industry') return 'industry';
  return 'conversations';
}

export default function AdminTabs() {
  const [tab, setTab] = useState<'conversations' | 'redirects' | 'industry'>(getInitialTab());

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sp = new URLSearchParams(window.location.search);
    sp.set('tab', tab);
    const url = `${window.location.pathname}?${sp.toString()}`;
    window.history.replaceState({}, '', url);
  }, [tab]);

  const TabButton: React.FC<{ value: 'conversations' | 'redirects' | 'industry'; label: string }> = ({ value, label }) => (
    <button
      className={`rounded-md border px-3 py-1 text-sm ${tab === value ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
      onClick={() => setTab(value)}
    >
      {label}
    </button>
  );

  return (
    <div>
      <div className="mb-3 flex items-center gap-2 text-sm">
        <TabButton value="conversations" label="Conversations" />
        <TabButton value="redirects" label="Redirects" />
        <TabButton value="industry" label="Industry" />
      </div>

      {tab === 'conversations' && <AdminEventsTable />}
      {tab === 'redirects' && (
        <div>
          <RedirectsDashboard />
          <details className="mt-4">
            <summary className="cursor-pointer select-none text-sm text-gray-700">Raw events</summary>
            <RedirectsRawTable />
          </details>
        </div>
      )}
      {tab === 'industry' && (
        <div>
          <IndustryMapping />
        </div>
      )}
    </div>
  );
}
