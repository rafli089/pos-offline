import { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Lock, LogOut } from 'lucide-react';

export default function LockOverlay() {
  const { locked, user, unlock, logout } = useAuthStore();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  if (!locked) return null;

  const handleUnlock = () => {
    if (unlock(pin)) {
      setPin('');
      setError('');
    } else {
      setError('PIN salah');
      setPin('');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4">
      <Card className="w-full max-w-sm bg-charcoal border-iron">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl text-paper-white">
            <Lock className="h-5 w-5" /> Terminal Terkunci
          </CardTitle>
          <p className="text-sm text-fog">{user?.full_name} · {user?.username}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="password"
            placeholder="Masukkan PIN"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
            className="bg-void border-iron text-paper-white"
            autoFocus
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button onClick={handleUnlock} disabled={!pin} className="w-full">Buka Kunci</Button>
          <button onClick={logout} className="flex w-full items-center justify-center gap-1 text-sm text-fog hover:text-paper-white">
            <LogOut className="h-3.5 w-3.5" /> Logout
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
