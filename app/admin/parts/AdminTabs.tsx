"use client";
// Simple tabbed admin shell.
// Tabs: Conversations, Redirects, RUM, Industry, and Campaigns.

import React, { useEffect, useMemo, useState } from 'react';
import AdminEventsTable from './AdminEventsTable';
import RedirectsDashboard from './RedirectsDashboard';
import RedirectsRawTable from './RedirectsRawTable';
import IndustryMapping from './IndustryMapping';
import RumDashboard from './RumDashboard';
import CampaignsTab from './CampaignsTab';

type TabType = 'conversations' | 'redirects' | 'rum' | 'industry' | 'campaigns';

function getInitialTab(): TabType {
  if (typeof window === 'undefined') return 'conversations';
  const sp = new URLSearchParams(window.location.search);
  const t = (sp.get('tab') || '').toLowerCase();
  if (t === 'redirects') return 'redirects';
  if (t === 'rum') return 'rum';
  if (t === 'industry') return 'industry';
  if (t === 'campaigns') return 'campaigns';
  return 'conversations';
}

export default function AdminTabs() {
  const [tab, setTab] = useState<TabType>(getInitialTab());

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sp = new URLSearchParams(window.location.search);
    sp.set('tab', tab);
    const url = `${window.location.pathname}?${sp.toString()}`;
    window.history.replaceState({}, '', url);
  }, [tab]);

  const TabButton: React.FC<{ value: TabType; label: string }> = ({ value, label }) => (
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
        <TabButton value="rum" label="RUM" />
        <TabButton value="industry" label="Industry" />
        <TabButton value="campaigns" label="Campaigns" />
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
      {tab === 'rum' && (
        <div>
          <RumDashboard />
        </div>
      )}
      {tab === 'industry' && (
        <div>
          <IndustryMapping />
        </div>
      )}
      {tab === 'campaigns' && (
        <div>
          <CampaignsTab />
        </div>
      )}
    </div>
  );
}
