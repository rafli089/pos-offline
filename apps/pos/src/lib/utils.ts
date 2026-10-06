import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRupiah(cents: number): string {
  const rupiah = cents / 100;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(rupiah);
}

export function generateTransactionNumber(terminalId: string): string {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const seq = String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
  return `TRX-${y}${m}${d}-${terminalId}-${seq}`;
}

export function generateOrderNumber(): string {
  const seq = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return `ORD-${seq}`;
}

export function generateShiftNumber(date: string): string {
  const seq = String(Math.floor(Math.random() * 10)).padStart(3, '0');
  const ymd = date.replace(/-/g, '');
  return `SHIFT-${ymd}-${seq}`;
}