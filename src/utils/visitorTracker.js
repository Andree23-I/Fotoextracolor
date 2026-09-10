import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Genera o recupera l'ID di sessione (sessionStorage - unico per scheda)
 * e l'ID del visitatore univoco (localStorage - persiste tra sessioni)
 */
export function getSessionInfo() {
  if (typeof window === 'undefined') {
    return { sessionId: 'server_dummy', visitorId: 'server_dummy' };
  }

  let sessionId = sessionStorage.getItem('fotoextracolor_sess_id');
  if (!sessionId) {
    sessionId = 'sess_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
    sessionStorage.setItem('fotoextracolor_sess_id', sessionId);
  }

  let visitorId = localStorage.getItem('fotoextracolor_vis_id');
  if (!visitorId) {
    visitorId = 'vis_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
    localStorage.setItem('fotoextracolor_vis_id', visitorId);
  }

  return { sessionId, visitorId };
}

/**
 * Rileva dettagli su Dispositivo, OS, Browser e Schermo
 */
export function getClientDeviceInfo() {
  if (typeof window === 'undefined') {
    return { deviceType: 'Desktop', os: 'Unknown', browser: 'Unknown', screen: '1920x1080' };
  }

  const ua = navigator.userAgent || '';
  const screen = `${window.screen?.width || window.innerWidth}x${window.screen?.height || window.innerHeight}`;

  // 1. Device Type
  let deviceType = 'Desktop';
  const isTouch = navigator.maxTouchPoints > 0;
  const isMobileUA = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const isTabletUA = /iPad|Tablet|PlayBook|Silk/i.test(ua) || (isTouch && window.innerWidth >= 768 && window.innerWidth <= 1024);

  if (isTabletUA) {
    deviceType = 'Tablet';
  } else if (isMobileUA || (isTouch && window.innerWidth < 768)) {
    deviceType = 'Mobile';
  }

  // 2. Operating System
  let os = 'Unknown OS';
  if (/Windows NT 10.0/i.test(ua)) os = 'Windows 10/11';
  else if (/Windows NT 6.3/i.test(ua)) os = 'Windows 8.1';
  else if (/Windows NT 6.1/i.test(ua)) os = 'Windows 7';
  else if (/Windows/i.test(ua)) os = 'Windows';
  else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';
  else if (/Macintosh|Mac OS X/i.test(ua)) os = 'macOS';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/Linux/i.test(ua)) os = 'Linux';
  else if (/CrOS/i.test(ua)) os = 'Chrome OS';

  // 3. Browser
  let browser = 'Altro Browser';
  if (/Edg\//i.test(ua)) browser = 'Edge';
  else if (/Chrome\//i.test(ua) && !/Edg/i.test(ua) && !/OPR/i.test(ua)) browser = 'Chrome';
  else if (/Safari\//i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari';
  else if (/Firefox\//i.test(ua)) browser = 'Firefox';
  else if (/OPR\//i.test(ua) || /Opera/i.test(ua)) browser = 'Opera';
  else if (/SamsungBrowser/i.test(ua)) browser = 'Samsung Internet';

  return { deviceType, os, browser, screen };
}

/**
 * Normalizza il referrer per una visualizzazione leggibile
 */
export function getCleanReferrer() {
  if (typeof document === 'undefined' || !document.referrer) return 'Accesso Diretto';
  const ref = document.referrer.toLowerCase();
  if (ref.includes(window.location.hostname)) return 'Navigazione Interna';
  if (ref.includes('google')) return 'Google Search';
  if (ref.includes('instagram')) return 'Instagram';
  if (ref.includes('facebook') || ref.includes('fb.')) return 'Facebook';
  if (ref.includes('whatsapp')) return 'WhatsApp';
  if (ref.includes('tiktok')) return 'TikTok';
  if (ref.includes('t.co') || ref.includes('twitter') || ref.includes('x.com')) return 'X / Twitter';
  if (ref.includes('bing')) return 'Bing';
  try {
    const url = new URL(document.referrer);
    return url.hostname;
  } catch {
    return document.referrer;
  }
}

/**
 * Invia un heartbeat ping al backend
 */
export async function sendTrackingPing(page, language = 'it', theme = 'dark') {
  if (typeof window === 'undefined') return;

  const { sessionId, visitorId } = getSessionInfo();
  const { deviceType, os, browser, screen } = getClientDeviceInfo();
  const referrer = getCleanReferrer();

  const payload = {
    sessionId,
    visitorId,
    page: page || window.location.pathname,
    referrer,
    deviceType,
    os,
    browser,
    screen,
    language,
    theme
  };

  // Aggiorna anche lo stato locale di fallback per demo offline
  try {
    const localActiveRaw = localStorage.getItem('local_analytics_active');
    const localActive = localActiveRaw ? JSON.parse(localActiveRaw) : {};
    const now = Math.floor(Date.now() / 1000);
    const existing = localActive[sessionId];
    const prevPages = existing?.pages || [];
    const pages = (prevPages.length === 0 || prevPages[prevPages.length - 1] !== payload.page) 
      ? [...prevPages, payload.page] 
      : prevPages;

    localActive[sessionId] = {
      ...payload,
      ip: '127.0.0.1 (Locale)',
      firstSeen: existing?.firstSeen || now,
      lastPing: now,
      currentPage: payload.page,
      pageViews: pages.length,
      pages
    };
    localStorage.setItem('local_analytics_active', JSON.stringify(localActive));

    // Also update local history fallback
    const localHistRaw = localStorage.getItem('local_analytics_history');
    let localHist = localHistRaw ? JSON.parse(localHistRaw) : [];
    const foundHist = localHist.find(h => h.sessionId === sessionId);
    if (foundHist) {
      foundHist.lastPage = payload.page;
      foundHist.pageViews = pages.length;
      foundHist.pages = pages;
      foundHist.endTime = now;
      foundHist.durationSeconds = Math.max(1, now - foundHist.startTime);
      foundHist.status = 'online';
      foundHist.theme = theme;
      foundHist.language = language;
    } else {
      localHist.unshift({
        sessionId,
        visitorId,
        ip: '127.0.0.1 (Locale)',
        deviceType,
        os,
        browser,
        screen,
        landingPage: payload.page,
        lastPage: payload.page,
        pageViews: 1,
        pages: [payload.page],
        referrer,
        language,
        theme,
        startTime: now,
        endTime: now,
        durationSeconds: 1,
        status: 'online'
      });
      if (localHist.length > 500) localHist = localHist.slice(0, 500);
    }
    localStorage.setItem('local_analytics_history', JSON.stringify(localHist));
  } catch {}

  try {
    await fetch('/api.php?action=trackPing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch {
    // Silenzioso: non deve bloccare il sito se offline
  }
}

/**
 * Invia il beacon di uscita
 */
export function sendTrackingLeave() {
  if (typeof window === 'undefined') return;
  const { sessionId } = getSessionInfo();
  if (!sessionId) return;

  const payload = JSON.stringify({ sessionId });
  const url = '/api.php?action=trackLeave';

  try {
    const localActiveRaw = localStorage.getItem('local_analytics_active');
    if (localActiveRaw) {
      const localActive = JSON.parse(localActiveRaw);
      delete localActive[sessionId];
      localStorage.setItem('local_analytics_active', JSON.stringify(localActive));
    }
    const localHistRaw = localStorage.getItem('local_analytics_history');
    if (localHistRaw) {
      const localHist = JSON.parse(localHistRaw);
      const found = localHist.find(h => h.sessionId === sessionId);
      if (found) {
        found.status = 'ended';
        found.endTime = Math.floor(Date.now() / 1000);
        found.durationSeconds = Math.max(1, found.endTime - found.startTime);
        localStorage.setItem('local_analytics_history', JSON.stringify(localHist));
      }
    }
  } catch {}

  if (navigator.sendBeacon) {
    try {
      const blob = new Blob([payload], { type: 'application/json' });
      navigator.sendBeacon(url, blob);
    } catch {
      fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload, keepalive: true }).catch(() => {});
    }
  } else {
    fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload, keepalive: true }).catch(() => {});
  }
}

/**
 * React Hook da usare in App.jsx per tracciare automaticamente la sessione
 */
export function useVisitorTracker(language = 'it', theme = 'dark') {
  const location = useLocation();
  const lastPageRef = useRef('');

  useEffect(() => {
    const page = location.pathname + (location.hash || '');
    lastPageRef.current = page;
    sendTrackingPing(page, language, theme);

    // Heartbeat ogni 20 secondi
    const interval = setInterval(() => {
      sendTrackingPing(lastPageRef.current, language, theme);
    }, 20000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        sendTrackingLeave();
      } else if (document.visibilityState === 'visible') {
        sendTrackingPing(lastPageRef.current, language, theme);
      }
    };

    const handleBeforeUnload = () => {
      sendTrackingLeave();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [location.pathname, location.hash, language, theme]);
}
