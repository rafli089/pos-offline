import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { ArrowLeft } from 'lucide-react';
import mockData from '../../lib/mockData';
import type { Branch, Station, Terminal, User } from '../../types';

export default function MasterData() {
  const [tab, setTab] = useState<'branch' | 'station' | 'terminal' | 'user'>('branch');

  const tabs = [
    { id: 'branch', label: 'Branch' },
    { id: 'station', label: 'Station' },
    { id: 'terminal', label: 'Terminal' },
    { id: 'user', label: 'User' },
  ];

  return (
    <div className="min-h-screen bg-charcoal p-4">
      <div className="mb-6 flex items-center gap-3">
        <button onClick={() => window.history.back()} className="text-fog hover:text-paper-white">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="text-3xl font-bold text-paper-white">Master Data</h1>
      </div>

      <div className="mb-4 flex gap-2">
        {tabs.map((t) => (
          <Button key={t.id} variant={tab === t.id ? 'default' : 'outline'} onClick={() => setTab(t.id as any)}>
            {t.label}
          </Button>
        ))}
      </div>

      <Card className="bg-charcoal border-iron">
        <CardHeader>
          <CardTitle className="text-base text-paper-white">
            {tab === 'branch' ? 'Cabang (Branch)' : tab === 'station' ? 'Station' : tab === 'terminal' ? 'Terminal' : 'Pegawai (User)'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {tab === 'branch' &&
            mockData.branches.map((b: Branch) => (
              <Row key={b.id} title={b.name} sub={`${b.code} · ${b.address ?? '-'}`} />
            ))}
          {tab === 'station' &&
            mockData.stations.map((s: Station) => (
              <Row key={s.id} title={s.name} sub={`${s.type} · ${mockData.branches.find((b) => b.id === s.branch_id)?.name ?? '-'}`} />
            ))}
          {tab === 'terminal' &&
            mockData.terminals.map((t: Terminal) => (
              <Row key={t.id} title={`${t.terminal_id} — ${t.name}`} sub={`${t.status} · ${t.mac_address ?? '-'}`} />
            ))}
          {tab === 'user' &&
            mockData.users.map((u: User) => (
              <Row key={u.id} title={u.full_name} sub={`${u.username} · role ${u.role_id}`} />
            ))}
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="rounded border border-iron p-3">
      <p className="text-paper-white">{title}</p>
      <p className="text-xs text-fog">{sub}</p>
    </div>
  );
}
