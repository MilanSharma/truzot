"use client";

import { useEffect, useState } from "react";

/**
 * Live countdown to a real expiresAt timestamp (waitlist.created_at + 96h,
 * computed server-side in /api/free-preview and /api/validate-coupon - this
 * component never invents its own deadline, only ever displays one it was
 * handed). Renders nothing once expired; the caller is expected to re-check
 * validity server-side rather than trust the client clock for enforcement.
 */
export function DiscountCountdown({
  expiresAt,
  className,
}: {
  expiresAt: string;
  className?: string;
}) {
  const [remainingMs, setRemainingMs] = useState<number | null>(null);

  useEffect(() => {
    const target = new Date(expiresAt).getTime();
    const tick = () => setRemainingMs(target - Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  if (remainingMs === null) return null;
  if (remainingMs <= 0) {
    return (
      <p className={className}>
        This code has expired — free preview is still free to try again.
      </p>
    );
  }

  const totalSeconds = Math.floor(remainingMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");

  return (
    <p className={className}>
      Expires in {pad(hours)}:{pad(minutes)}:{pad(seconds)}
    </p>
  );
}
