'use client';

import { useEffect, useRef } from 'react';

function getDeviceInfo() {
  const ua = navigator.userAgent;
  let deviceType = 'desktop';
  if (/Mobile|Android|iPhone|iPad|iPod/i.test(ua)) {
    deviceType = /iPad|Tablet/i.test(ua) ? 'tablet' : 'mobile';
  }

  let browser = 'unknown';
  if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Edg')) browser = 'Edge';
  else if (ua.includes('Opera') || ua.includes('OPR')) browser = 'Opera';

  let os = 'unknown';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad'))
    os = 'iOS';

  return { deviceType, browser, os };
}

function getUTMParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    utmSource: params.get('utm_source') || undefined,
    utmMedium: params.get('utm_medium') || undefined,
    utmCampaign: params.get('utm_campaign') || undefined,
    utmTerm: params.get('utm_term') || undefined,
    utmContent: params.get('utm_content') || undefined,
  };
}

function getSessionId(): string {
  let sessionId = sessionStorage.getItem('_pv_sid');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem('_pv_sid', sessionId);
  }
  return sessionId;
}

function getReferrerDomain(referrer: string): string {
  try {
    const url = new URL(referrer);
    return url.hostname.replace('www.', '');
  } catch {
    return referrer || '';
  }
}

type Props = {
  profileId: number;
  page: string;
};

export default function PageviewTracker({ profileId, page }: Props) {
  const entryTime = useRef(Date.now());
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;

    const { deviceType, browser, os } = getDeviceInfo();
    const utmParams = getUTMParams();
    const sessionId = getSessionId();

    const payload = {
      profileId,
      sessionId,
      pageName: page,
      referrer: getReferrerDomain(document.referrer),
      ...utmParams,
      deviceType,
      browser,
      os,
    };

    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => {});

    tracked.current = true;

    const handleBeforeUnload = () => {
      const duration = Math.round((Date.now() - entryTime.current) / 1000);
      navigator.sendBeacon(
        '/api/analytics/track',
        JSON.stringify({ ...payload, duration })
      );
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      const duration = Math.round((Date.now() - entryTime.current) / 1000);
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, duration }),
      }).catch(() => {});
    };
  }, [profileId, page]);

  return null;
}
