export function trackEvent(event: string, payload: Record<string, unknown> = {}) {
  if (typeof window === 'undefined') return;

  const body = JSON.stringify({ event, payload, path: window.location.pathname, at: new Date().toISOString() });

  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/events', body);
    return;
  }

  fetch('/api/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body
  }).catch(() => undefined);
}
