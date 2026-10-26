import { readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
async function filesIn(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(entries.map(e => e.isDirectory() ? filesIn(path.join(dir, e.name)) : [path.join(dir, e.name)]));
  return nested.flat();
}
const paths = (await filesIn(root)).filter(file => !file.endsWith(`${path.sep}sw.js`)).sort();
const hash = createHash('sha256');
for (const file of paths) { hash.update(path.relative(root, file)); hash.update(await readFile(file)); }
const version = hash.digest('hex').slice(0, 16);
const files = paths.map(file => path.relative(root, file).split(path.sep).join('/'));
const worker = `// Generated from the complete production build. No network services are cached.
const VERSION = ${JSON.stringify(version)};
const BASE = new URL('./', self.location.href).pathname;
const PREFIX = 'epso-offline-' + BASE + '-';
const CACHE = PREFIX + VERSION;
const FILES = ${JSON.stringify(files)}.map(file => BASE + file);
const INDEX = BASE + 'index.html';
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES.map(url => new Request(url, { cache: 'reload' })))));
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith(PREFIX) && name !== CACHE).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});
self.addEventListener('message', event => {
  if (event.data?.type === 'ACTIVATE_UPDATE') self.skipWaiting();
  if (event.data?.type === 'CHECK_OFFLINE') event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    const ready = (await Promise.all(FILES.map(file => cache.match(file)))).every(Boolean);
    if (ready) event.source?.postMessage({ type: 'OFFLINE_READY', version: VERSION });
  })());
});
self.addEventListener('fetch', event => {
  const request = event.request, url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || !url.pathname.startsWith(BASE)) return;
  if (request.mode === 'navigate') {
    event.respondWith(caches.open(CACHE).then(async cache => (await cache.match(INDEX)) || fetch(request)));
  } else if (FILES.includes(url.pathname)) {
    event.respondWith(caches.open(CACHE).then(async cache => (await cache.match(url.pathname)) || fetch(request)));
  }
});
`;
await writeFile(path.join(root, 'sw.js'), worker, 'utf8');
console.log(`Offline package: ${files.length} files, version ${version}.`);
