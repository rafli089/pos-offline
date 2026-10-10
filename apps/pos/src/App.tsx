import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './stores/authStore';
import { useDayShiftStore } from './stores/dayShiftStore';
import { useMenuStore } from './stores/menuStore';
import { useSyncStore } from './stores/syncStore';
import Login from './features/auth/Login';
import StartDay from './features/day-shift/StartDay';
import StartShift from './features/day-shift/StartShift';
import POSShell from './features/pos/POSShell';
import CloseShift from './features/day-shift/CloseShift';
import Dashboard from './features/dashboard/Dashboard';
import PaymentScreen from './features/payment/PaymentScreen';
import ReceiptScreen from './features/receipt/ReceiptScreen';
import mockData from './lib/mockData';

function App() {
  const { isAuthenticated } = useAuthStore();
  const { businessDay, activeShift } = useDayShiftStore();
  const { categories, menus } = useMenuStore();
  const { setNetworkStatus } = useSyncStore();

  useEffect(() => {
    // seed mock data on first load
    if (categories.length === 0) {
      useMenuStore.getState().setCategories(mockData.categories);
      useMenuStore.getState().setMenus(mockData.menus);
      useMenuStore.getState().setModifiers(mockData.modifiers);
      useMenuStore.getState().setExtras(mockData.extras as any);
    }
    // detect network status
    setNetworkStatus(navigator.onLine ? 'online' : 'offline');
  }, []);

  return (
    <Router>
      <Routes>
        {!isAuthenticated ? (
          <>
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        ) : !businessDay ? (
          <>
            <Route path="/" element={<StartDay />} />
            <Route path="/start-day" element={<StartDay />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        ) : businessDay.status !== 'OPEN' ? (
          <Route path="*" element={<Navigate to="/login" replace />} />
        ) : !activeShift || activeShift.status !== 'OPEN' ? (
          <>
            <Route path="/" element={<StartShift />} />
            <Route path="/start-shift" element={<StartShift />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        ) : (
          <>
            <Route path="/" element={<POSShell />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/payment" element={<PaymentScreen />} />
            <Route path="/receipt/:txId" element={<ReceiptScreen />} />
            <Route path="/close-shift" element={<CloseShift />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        )}
      </Routes>
    </Router>
  );
}

export default App;