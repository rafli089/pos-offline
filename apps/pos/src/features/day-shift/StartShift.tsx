import { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useDayShiftStore } from '../../stores/dayShiftStore';
import { useMenuStore } from '../../stores/menuStore';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { PlayCircle } from 'lucide-react';
import type { Shift } from '../../types';

export default function StartShift() {
  const { user, branch, terminal, station } = useAuthStore();
  const { businessDay, startShift } = useDayShiftStore();
  const [startingCash, setStartingCash] = useState<string>('300000'); // default Rp300rb
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');

  const handleStart = () => {
    if (!startingCash || Number(startingCash) <= 0) {
      setError('Starting cash wajib diisi');
      return;
    }
    setStarting(true);
    const cashCents = Math.round(Number(startingCash) * 100);
    const now = new Date();

    // ponytail: useMenuStore has no paymentMethods; pass later via context or provider when needed

    const shift: Shift = {
      id: crypto.randomUUID(),
      business_day_id: businessDay?.id ?? '',
      branch_id: branch?.id ?? '',
      user_id: user?.id ?? '',
      station_id: station?.id ?? '',
      terminal_id: terminal?.id ?? '',
      status: 'OPEN',
      starting_cash: cashCents,
      expected_cash: cashCents, // ponytail: adjust on PAID transactions
      actual_cash: 0,
      variance: 0,
      variance_status: 'BALANCED',
      cash_sales: 0,
      cash_in: 0,
      cash_out: 0,
      cash_refund: 0,
      started_at: now.toISOString(),
      started_by: user?.id ?? '',
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    };

    startShift(shift);
    setStarting(false);
  };

  const handleCashChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) setStartingCash(value);
  };

  const displayedCash = Number(startingCash || 0);

  return (
    <div className="flex min-h-screen items-center justify-center bg-charcoal">
      <Card className="w-full max-w-md bg-charcoal border-iron">
        <CardHeader>
          <CardTitle className="text-xl text-paper-white">Start Shift</CardTitle>
          <p className="text-sm text-fog">{user?.full_name} · {terminal?.terminal_id}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="starting-cash">Starting Cash (Rp)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-fog font-gtamericamono">Rp</span>
              <Input
                id="starting-cash"
                type="text"
                value={startingCash}
                onChange={handleCashChange}
                className="pl-12 font-gtamericamono text-lg"
                autoFocus
              />
            </div>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="rounded-sm border border-iron bg-void p-3 flex justify-between">
            <span className="text-sm text-fog">Total Cash</span>
            <span className="text-lg font-medium text-paper-white font-gtamericamono">Rp {displayedCash.toLocaleString('id-ID')}</span>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleStart} disabled={starting} className="btn-primary w-full">
            <PlayCircle className="h-4 w-4 mr-2" />
            {starting ? 'Memulai...' : 'Mulai Shift'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}