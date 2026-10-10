import { useEffect, useMemo, useState } from 'react';
import { db } from '../../lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import type { AuditLog } from '../../types';

export default function AuditLogViewer() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [action, setAction] = useState<string>('');

  const load = async () => {
    const all = await db.auditLogs.toArray();
    setLogs(all.sort((a, b) => b.created_at.localeCompare(a.created_at)));
  };

  useEffect(() => {
    load();
  }, []);

  const actions = useMemo(() => [...new Set(logs.map((l) => l.action))].sort(), [logs]);
  const filtered = action ? logs.filter((l) => l.action === action) : logs;

  return (
    <div className="min-h-screen bg-void p-4">
      <div className="mb-4 flex items-center gap-3">
        <button onClick={() => window.history.back()} className="text-fog hover:text-paper-white">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="text-2xl font-bold text-paper-white">Audit Log</h1>
        <button onClick={load} className="ml-auto text-fog hover:text-paper-white" aria-label="Muat ulang">
          <RefreshCw className="h-5 w-5" />
        </button>
      </div>

      <div className="mb-4 flex gap-2 overflow-x-auto">
        <button
          onClick={() => setAction('')}
          className={`px-3 py-1.5 rounded text-xs border ${action === '' ? 'border-ice-signal text-paper-white' : 'border-iron text-fog'}`}
        >
          Semua ({logs.length})
        </button>
        {actions.map((a) => (
          <button
            key={a}
            onClick={() => setAction(a)}
            className={`px-3 py-1.5 rounded text-xs border whitespace-nowrap ${action === a ? 'border-ice-signal text-paper-white' : 'border-iron text-fog'}`}
          >
            {a}
          </button>
        ))}
      </div>

      <Card className="bg-charcoal border-iron">
        <CardHeader><CardTitle className="text-base">Riwayat Aktivitas</CardTitle></CardHeader>
        <CardContent className="space-y-1.5">
          {filtered.length === 0 ? (
            <p className="text-sm text-fog">Belum ada audit log.</p>
          ) : (
            filtered.slice(0, 200).map((l) => (
              <div key={l.id} className="border-b border-iron py-2 text-sm last:border-0">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-paper-white">{l.action}</span>
                  <span className="text-xs text-fog">{new Date(l.created_at).toLocaleString('id-ID')}</span>
                </div>
                <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-fog">
                  <span>user: {l.user_id}</span>
                  <span>entity: {l.entity_type}/{l.entity_id}</span>
                  {l.reason && <span>reason: {l.reason}</span>}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
