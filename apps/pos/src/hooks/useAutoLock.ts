import { useEffect, useRef } from 'react';
import { useAuthStore } from '../stores/authStore';

// PRD §6 — auto-lock after inactivity. Resets on user activity.
export function useAutoLock(timeoutMs = 5 * 60 * 1000) {
  const lock = useAuthStore((s) => s.lock);
  const locked = useAuthStore((s) => s.locked);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (locked) return;

    const reset = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => lock(), timeoutMs);
    };

    const events = ['mousemove', 'keydown', 'click', 'touchstart'] as const;
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();

    return () => {
      if (timer.current) clearTimeout(timer.current);
      events.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [lock, locked, timeoutMs]);
}
