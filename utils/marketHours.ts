// utils/marketHours.ts
export interface MarketStatus {
  isOpen: boolean;
  reason: 'open' | 'weekend' | 'friday_close' | 'sunday_pre_open';
  nextOpenUTC: Date;     // момент, когда откроется (или сейчас, если уже открыт)
  msUntilOpen: number;
}

export function getForexStatus(now: Date = new Date()): MarketStatus {
  const day = now.getUTCDay();      // 0=Нд, 1=Пн, …, 5=Пт, 6=Сб
  const hour = now.getUTCHours();

  let isOpen = true;
  let reason: MarketStatus['reason'] = 'open';

  if (day === 6) { isOpen = false; reason = 'weekend'; }
  else if (day === 5 && hour >= 22) { isOpen = false; reason = 'friday_close'; }
  else if (day === 0 && hour < 22)  { isOpen = false; reason = 'sunday_pre_open'; }

  // вычисляем nextOpen — ближайшее воскресенье 22:00 UTC
  const nextOpen = new Date(Date.UTC(
    now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),
    22, 0, 0, 0
  ));
  if (isOpen) {
    return { isOpen, reason, nextOpenUTC: now, msUntilOpen: 0 };
  }
  // дойти до ближайшего воскресенья
  while (nextOpen.getUTCDay() !== 0 || nextOpen.getTime() <= now.getTime()) {
    nextOpen.setUTCDate(nextOpen.getUTCDate() + 1);
    nextOpen.setUTCHours(22, 0, 0, 0);
  }
  return { isOpen, reason, nextOpenUTC: nextOpen, msUntilOpen: nextOpen.getTime() - now.getTime() };
}

export function formatCountdown(ms: number): string {
  if (ms <= 0) return '00:00:00';
  const total = Math.floor(ms / 1000);
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return d > 0 ? `${d}д ${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(h)}:${pad(m)}:${pad(s)}`;
}