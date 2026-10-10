import { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useDayShiftStore } from '../../stores/dayShiftStore';
import { useSyncStore } from '../../stores/syncStore';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { Label } from '../../components/ui/label';
import mockData from '../../lib/mockData';
import { apiClient, ApiError } from '../../lib/apiClient';
import type { User } from '../../types';

export default function Login() {
  const { login } = useAuthStore();
  const { setNetworkStatus, networkStatus } = useSyncStore();
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setLoading(true);
    setError('');

    try {
      // Real API call
      const response = await apiClient.post<{ token: string; user: { id: string; username: string; full_name: string; role: string } }>(
        '/api/auth/login',
        { username, pin }
      );

      // Map backend response to frontend User type using mock data for consistency
      const mockUser = mockData.users.find(u => u.username === response.user.username);
      if (!mockUser) {
        throw new Error('User not found in mock data');
      }
      const user = mockUser;
      const branch = mockData.branches[0];
      const terminal = mockData.terminals[0];
      const station = mockData.stations[0];
      
      const rolePerms = mockData.rolePermissions[user.role_id] || [];
      const permissions = mockData.permissions.filter(p => rolePerms.includes(p.id));

      login(user, branch, terminal, station, permissions);
      useDayShiftStore.getState().setStatus('READY');
      setNetworkStatus('online');
    } catch (err) {
      console.error('Login error:', err);
      if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof TypeError && err.message === 'Failed to fetch') {
        setError('Tidak dapat terhubung ke server. Periksa koneksi internet.');
        setNetworkStatus('offline');
      } else {
        setError('Terjadi kesalahan. Silakan coba lagi.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNetworkStatus = (status: 'online' | 'offline' | 'syncing' | 'sync-error') => {
    setNetworkStatus(status);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-charcoal">
      <Card className="w-full max-w-sm bg-charcoal border-iron">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-paper-white">POS Login</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Outlet / Kasir</Label>
            <Input
              id="username"
              type="text"
              placeholder="Masukkan username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              className="bg-void border-iron text-paper-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pin">PIN</Label>
            <Input
              id="pin"
              type="password"
              placeholder="Masukkan PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              autoComplete="off"
              className="bg-void border-iron text-paper-white"
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleLogin}
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? 'Masuk...' : 'Login'}
          </Button>
          <div className="mt-2 text-xs text-fog">
            Demo credentials: kasir1/1234 atau admin/1234
          </div>
        </CardFooter>
      </Card>
      <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-void border border-iron rounded-sm">
        <span className={`w-2 h-2 rounded-full ${networkStatus === 'online' ? 'bg-green-500' : networkStatus === 'offline' ? 'bg-red-500' : 'bg-yellow-500'}`}></span>
        <span className="text-sm text-fog">{networkStatus === 'online' ? 'Online' : 'Offline'}</span>
      </div>
    </div>
  );
}