import { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useDayShiftStore } from '../../stores/dayShiftStore';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { LogOut, PlayCircle, StopCircle, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function StartDay() {
  const { user, branch, logout, hasPermission } = useAuthStore();
  const { startDay, endDay, businessDay, activeShift } = useDayShiftStore();
  const [starting, setStarting] = useState(false);
  const [ending, setEnding] = useState(false);

  const handleStartDay = () => {
    setStarting(true);
    const today = new Date().toISOString().slice(0, 10);
    startDay(branch?.id ?? '', user?.id ?? '', today);
    setStarting(false);
  };

  const handleEndDay = () => {
    if (!businessDay) return;
    setEnding(true);
    endDay(user?.id ?? '');
    setEnding(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-charcoal">
      <Card className="w-full max-w-md bg-charcoal border-iron">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl text-paper-white">
              {businessDay?.status === 'OPEN' ? 'End Day' : 'Start Day'}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-fog">
            {branch?.name} · {user?.full_name}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-sm border border-iron bg-void p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-fog">Outlet</span>
              <span className="text-paper-white">{branch?.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-fog">Kasir</span>
              <span className="text-paper-white">{user?.full_name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-fog">Terminal</span>
              <span className="text-paper-white font-gtamericamono">{user?.terminal_id}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-fog">Tanggal</span>
              <span className="text-paper-white">{new Date().toLocaleDateString('id-ID')}</span>
            </div>
            {businessDay && (
              <div className="flex justify-between text-sm border-t border-iron pt-2 mt-2">
                <span className="text-fog">Status</span>
                <span className="text-ice-signal">{businessDay.status}</span>
              </div>
            )}
          </div>

          {/* End Day Warning */}
          {businessDay?.status === 'OPEN' && (
            <div className={`rounded-md p-3 flex gap-2 ${activeShift?.status === 'OPEN' ? 'bg-red-900/20 border border-red-500/50' : 'bg-green-900/20 border border-green-500/50'}`}>
              {activeShift?.status === 'OPEN' ? (
                <>
                  <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-red-200">Tutup shift aktif sebelum end day</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-green-200">Siap untuk end day</span>
                </>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter>
          {businessDay?.status === 'OPEN' ? (
            <Button
              onClick={handleEndDay}
              disabled={ending || activeShift?.status === 'OPEN'}
              className="w-full"
            >
              <StopCircle className="h-4 w-4 mr-2" />
              {ending ? 'Menutup Hari...' : 'End Day'}
            </Button>
          ) : (
            <Button onClick={handleStartDay} disabled={starting} className="btn-primary w-full">
              <PlayCircle className="h-4 w-4 mr-2" />
              {starting ? 'Membuka...' : 'Buka Business Day'}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}