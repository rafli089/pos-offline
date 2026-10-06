import { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useDayShiftStore, calculateExpectedCash } from '../../stores/dayShiftStore';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { ArrowLeft, CheckCircle, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';

export default function CloseShift() {
  const { user } = useAuthStore();
  const { activeShift, closeShift, setBusinessDay } = useDayShiftStore();
  const [actualCashInput, setActualCashInput] = useState<string>('');
  const [confirming, setConfirming] = useState(false);

  if (!activeShift || activeShift.status !== 'OPEN') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-charcoal">
        <Card className="w-full max-w-md bg-charcoal border-iron">
          <CardHeader>
            <CardTitle className="text-xl text-paper-white">Close Shift</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-fog">Tidak ada shift aktif</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => window.history.back()}>Kembali</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const expectedCash = calculateExpectedCash(activeShift);
  const actualCash = Number(actualCashInput);
  const variance = actualCash - expectedCash;
  const varianceStatus = variance === 0 ? 'BALANCED' : variance < 0 ? 'SHORT' : 'OVER';

  const handleConfirm = () => {
    setConfirming(true);
    closeShift(activeShift.id, Math.round(actualCash * 100));
    setTimeout(() => {
      // reset/day ended handled by store
      setConfirming(false);
    }, 500);
  };

  const formatRupiah = (cents: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(cents / 100);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-charcoal p-4">
      <Card className="w-full max-w-lg bg-charcoal border-iron">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="text-xl text-paper-white flex-1">Close Shift</CardTitle>
          </div>
          <p className="text-sm text-fog">{user?.full_name} · Shift {activeShift.id.slice(0, 8)}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Cash Calculation */}
          <div className="space-y-2">
            <Label htmlFor="actual-cash">Actual Cash Counted (Rp)</Label>
            <Input
              id="actual-cash"
              type="number"
              placeholder="Masukkan jumlah cash terhitung"
              value={actualCashInput}
              onChange={(e) => setActualCashInput(e.target.value)}
              className="font-gtamericamono text-lg"
            />
          </div>

          {/* Summary */}
          <div className="rounded-md border border-iron bg-void p-4 space-y-2">
            <h3 className="text-sm font-medium text-paper-white mb-2">Shift Summary</h3>
            <div className="flex justify-between text-sm">
              <span className="text-fog">Starting Cash</span>
              <span className="text-paper-white">{formatRupiah(activeShift.starting_cash)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-fog">Cash Sales</span>
              <span className="text-paper-white text-green-400">+{formatRupiah(activeShift.cash_sales)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-fog">Cash In</span>
              <span className="text-paper-white text-green-400">+{formatRupiah(activeShift.cash_in)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-fog">Cash Out</span>
              <span className="text-paper-white text-red-400">-{formatRupiah(activeShift.cash_out)}</span>
            </div>
            <div className="flex justify-between text-sm border-t border-iron pt-2 mt-2">
              <span className="text-fog font-bold">Expected Cash</span>
              <span className="text-paper-white font-bold">{formatRupiah(expectedCash)}</span>
            </div>
            {actualCashInput && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-fog font-bold">Actual Cash</span>
                  <span className="text-paper-white font-bold">{formatRupiah(actualCash)}</span>
                </div>
                <div className={`flex justify-between text-sm font-bold ${varianceStatus === 'BALANCED' ? 'text-green-400' : varianceStatus === 'SHORT' ? 'text-red-400' : 'text-blue-400'}`}>
                  <span className="flex items-center gap-1">
                    <TrendingDown className="h-3 w-3" />
                    Variance
                  </span>
                  <span>{varianceStatus} ({formatRupiah(variance)})</span>
                </div>
              </>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleConfirm}
            disabled={confirming || !actualCashInput}
            className={`flex-1 ${varianceStatus === 'BALANCED' ? 'bg-green-600 hover:bg-green-700' : 'btn-primary'}`}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            {confirming ? 'Menutup...' : 'Konfirmasi Penutupan'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}