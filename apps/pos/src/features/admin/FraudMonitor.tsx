import { useEffect, useState } from 'react';
import { db } from '../../lib/db';
import { detectFraud, riskColor, type FraudAlert } from '../../lib/fraud';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { ArrowLeft, ShieldAlert, RefreshCw } from 'lucide-react';

export default function FraudMonitor() {
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [auditLogs, shiftLogs, transactions, shifts] = await Promise.all([
      db.auditLogs.toArray(),
      db.shiftLogs.toArray(),
      db.transactions.toArray(),
      db.shifts.toArray(),
    ]);
    setAlerts(detectFraud({ auditLogs, shiftLogs, transactions, shifts }));
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const critical = alerts.filter((a) => a.level === 'CRITICAL').length;
  const high = alerts.filter((a) => a.level === 'HIGH').length;

  return (
    <div className="min-h-screen bg-void p-4">
      <div className="mb-4 flex items-center gap-3">
        <button onClick={() => window.history.back()} className="text-fog hover:text-paper-white">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <ShieldAlert className="h-6 w-6 text-red-400" />
        <h1 className="text-2xl font-bold text-paper-white">Fraud Monitor</h1>
        <button onClick={load} className="ml-auto text-fog hover:text-paper-white" aria-label="Muat ulang">
          <RefreshCw className="h-5 w-5" />
        </button>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-3">
        <Card className="bg-charcoal border-iron">
          <CardContent className="p-4">
            <p className="text-xs text-fog">Total Alert</p>
            <p className="text-lg font-bold text-paper-white mt-1">{alerts.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-charcoal border-iron">
          <CardContent className="p-4">
            <p className="text-xs text-fog">Critical</p>
            <p className="text-lg font-bold text-red-500 mt-1">{critical}</p>
          </CardContent>
        </Card>
        <Card className="bg-charcoal border-iron">
          <CardContent className="p-4">
            <p className="text-xs text-fog">High</p>
            <p className="text-lg font-bold text-orange-400 mt-1">{high}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-charcoal border-iron">
        <CardHeader><CardTitle className="text-base">Rule-Based Alerts</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {loading ? (
            <p className="text-sm text-fog">Memuat...</p>
          ) : alerts.length === 0 ? (
            <p className="text-sm text-fog">Tidak ada anomali terdeteksi.</p>
          ) : (
            alerts.map((a) => (
              <div key={a.id} className="flex items-start justify-between gap-3 border-b border-iron py-2 last:border-0">
                <div>
                  <p className="text-sm text-paper-white">{a.detail}</p>
                  <p className="mt-0.5 font-gtamericamono text-xs text-fog">{a.rule} · {a.entity_id.slice(0, 20)}</p>
                </div>
                <span className={`shrink-0 text-xs font-bold ${riskColor[a.level]}`}>{a.level}</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
