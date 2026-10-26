import { useSyncExternalStore } from 'react';

interface InstallEvent extends Event { prompt(): Promise<void>; userChoice: Promise<{ outcome: string }> }
type PwaStatus = { offlineReady: boolean; online: boolean; installable: boolean; installed: boolean; standalone: boolean; installing: boolean; updateReady: boolean; error: string };
let installEvent: InstallEvent | null = null;
let registration: ServiceWorkerRegistration | null = null;
const appDisplay = matchMedia('(display-mode: standalone)');
let status: PwaStatus = { offlineReady: false, online: navigator.onLine, installable: false, installed: appDisplay.matches, standalone: appDisplay.matches, installing: false, updateReady: false, error: '' };
const listeners = new Set<() => void>();
const update = (patch: Partial<PwaStatus>) => { status = { ...status, ...patch }; listeners.forEach(listener => listener()); };
const subscribe = (listener: () => void) => { listeners.add(listener); return () => listeners.delete(listener); };
export function usePwaStatus() { return useSyncExternalStore(subscribe, () => status); }
export async function installApp(): Promise<'accepted' | 'dismissed' | 'unavailable' | 'error'> {
  if (!installEvent || status.installing) return 'unavailable';
  const event = installEvent;
  installEvent = null;
  update({ installing: true, installable: false });
  try { await event.prompt(); return (await event.userChoice).outcome === 'accepted' ? 'accepted' : 'dismissed'; }
  catch { return 'error'; }
  finally { update({ installing: false }); }
}
export function applyUpdate() { registration?.waiting?.postMessage({ type: 'ACTIVATE_UPDATE' }); }

export function registerOffline() {
  window.addEventListener('online', () => update({ online: true }));
  window.addEventListener('offline', () => update({ online: false }));
  window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); installEvent = event as InstallEvent; update({ installable: true }); });
  window.addEventListener('appinstalled', () => { installEvent = null; update({ installed: true, installable: false }); });
  appDisplay.addEventListener('change', event => update({ standalone: event.matches, installed: status.installed || event.matches }));
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  let updating = false;
  navigator.serviceWorker.addEventListener('message', event => {
    if (event.data?.type === 'OFFLINE_READY') update({ offlineReady: true });
  });
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (updating) location.reload();
    else navigator.serviceWorker.controller?.postMessage({ type: 'CHECK_OFFLINE' });
  });
  const base = import.meta.env.BASE_URL;
  navigator.serviceWorker.register(`${base}sw.js`, { scope: base }).then(reg => {
    registration = reg;
    if (reg.waiting) update({ updateReady: true });
    reg.addEventListener('updatefound', () => {
      const worker = reg.installing;
      worker?.addEventListener('statechange', () => {
        if (worker.state === 'installed' && navigator.serviceWorker.controller) update({ updateReady: true });
        if (worker.state === 'redundant' && !status.offlineReady) update({ error: 'Le téléchargement hors connexion a échoué. Rechargez avec Internet pour réessayer.' });
      });
    });
    navigator.serviceWorker.ready.then(ready => ready.active?.postMessage({ type: 'CHECK_OFFLINE' }));
  }).catch(() => update({ error: 'Le mode hors connexion n’a pas pu être préparé. Rechargez la page avec Internet.' }));
  window.addEventListener('epso-apply-update', () => { updating = true; applyUpdate(); });
}
