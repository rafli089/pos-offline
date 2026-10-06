import { useEffect, useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useDayShiftStore } from '../../stores/dayShiftStore';
import { useMenuStore } from '../../stores/menuStore';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { LayoutDashboard, LogOut, TrendingUp, Users, Package, AlertTriangle, Clock, Wifi, WifiOff } from 'lucide-react';

export default function Dashboard() {
  const { user, logout } = useAuthStore();
  const { activeShift, businessDay, shiftLogs } = useDayShiftStore();
  const { menus } = useMenuStore();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatRupiah = (cents: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(cents / 100);

  // Compute dummy stats from shift
  const totalSales = shiftLogs
    .filter(l => l.action === 'PAYMENT_COMPLETED')
    .reduce((s, l) => s + (l.amount || 0), 0);

  const transactionCount = shiftLogs.filter(l => l.action === 'TRANSACTION_CREATED').length;

  const lowStockItems = menus.filter(m => m.stock_tracking && (m.stock_quantity ?? 0) <= (m.minimum_stock ?? 0));

  return (
    <div className="min-h-screen bg-void">
      {/* Header */}
      <header className="h-12 bg-obsidian border-b border-iron flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="h-4 w-4 text-ice-signal" />
          <span className="text-sm text-paper-white font-medium">Dashboard</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-fog" />
          <span className="text-fog">{currentTime.toLocaleTimeString('id-ID')}</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Welcome */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-heading-lg text-paper-white">Selamat {currentTime.getHours() < 12 ? 'Pagi' : currentTime.getHours() < 18 ? 'Siang' : 'Malam'}, {user?.full_name}</h1>
            <p className="text-fog text-sm mt-1">{businessDay?.business_date} · Shift {activeShift?.status || 'CLOSED'}</p>
          </div>
          <Button onClick={logout} variant="outline">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Sales Hari Ini" value={formatRupiah(totalSales)} icon={<TrendingUp className="h-5 w-5" />} accent="text-green-400" />
          <StatCard title="Transaksi" value={String(transactionCount)} icon={<Users className="h-5 w-5" />} accent="text-ice-signal" />
          <StatCard title="Menu Aktif" value={String(menus.filter(m => m.availability === 'AVAILABLE').length)} icon={<Package className="h-5 w-5" />} accent="text-paper-white" />
          <StatCard title="Low Stock" value={String(lowStockItems.length)} icon={<AlertTriangle className="h-5 w-5" />} accent={lowStockItems.length > 0 ? 'text-red-400' : 'text-green-400'} />
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-charcoal border-iron">
            <CardHeader>
              <CardTitle className="text-lg">Aktivitas Terakhir</CardTitle>
            </CardHeader>
            <CardContent>
              {shiftLogs.length === 0 ? (
                <p className="text-fog text-sm">Belum ada aktivitas</p>
              ) : (
                <div className="space-y-2">
                  {shiftLogs.slice(-10).reverse().map(log => (
                    <div key={log.id} className="flex justify-between items-center py-1.5 border-b border-iron last:border-0">
                      <span className="text-sm text-fog">{log.action.replace(/_/g, ' ').toLowerCase()}</span>
                      <span className="text-xs text-fog font-gtamericamono">{new Date(log.created_at).toLocaleTimeString('id-ID')}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-charcoal border-iron">
            <CardHeader>
              <CardTitle className="text-lg">Status Sistem</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <StatusRow label="Business Day" value={businessDay?.status || 'CLOSED'} ok={businessDay?.status === 'OPEN'} />
              <StatusRow label="Shift" value={activeShift?.status || 'NOT_STARTED'} ok={activeShift?.status === 'OPEN'} />
              <StatusRow label="Network" value={navigator.onLine ? 'Online' : 'Offline'} ok={navigator.onLine} />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

function StatCard({ title, value, icon, accent }: {
  title: string;
  value: string;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <Card className="bg-charcoal border-iron shadow-card">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-fog">{title}</p>
            <p className={`text-heading-sm font-bold mt-1 ${accent}`}>{value}</p>
          </div>
          <div className={`p-2 rounded-md bg-void ${accent}`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusRow({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-iron last:border-0">
      <span className="text-sm text-fog">{label}</span>
      <span className={`text-sm font-medium ${ok ? 'text-green-400' : 'text-yellow-400'}`}>{value}</span>
    </div>
  );
}