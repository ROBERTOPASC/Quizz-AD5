import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, openSync, closeSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const url = 'http://127.0.0.1:4175/Quizz-Interatif/';
async function probe() {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(1500) });
    return (await response.text()).includes('<title>Prépa EPSO AD5 - Horizon</title>') ? 'ready' : 'occupied';
  } catch { return 'absent'; }
}
try {
  let status = await probe();
  if (status === 'occupied') throw new Error('Le port 4175 est déjà utilisé par une autre application.');
  if (status !== 'ready') {
    const vite = join(root, 'node_modules', 'vite', 'bin', 'vite.js');
    if (!existsSync(vite)) throw new Error('Les dépendances manquent. Ouvrez ce dossier dans Codex et demandez de préparer le lancement EPSO.');
    const logDir = join(root, '.local-epso');
    mkdirSync(logDir, { recursive: true });
    const log = openSync(join(logDir, 'serveur.log'), 'a');
    const server = spawn(process.execPath, [vite, '--host', '127.0.0.1', '--port', '4175', '--strictPort'], { cwd: root, detached: true, windowsHide: true, stdio: ['ignore', log, log] });
    server.unref(); closeSync(log);
    for (let attempt = 0; attempt < 30; attempt++) {
      await new Promise(resolve => setTimeout(resolve, 500));
      status = await probe();
      if (status === 'ready') break;
    }
    if (status !== 'ready') throw new Error('Le serveur ne répond pas. Le journal est disponible dans .local-epso/serveur.log.');
  }
  if (!process.argv.includes('--no-open')) {
    const browser = spawn('cmd.exe', ['/c', 'start', '', `${url}#maths`], { detached: true, windowsHide: true, stdio: 'ignore' });
    browser.unref();
  }
  console.log(`Parcours de maths disponible : ${url}#maths`);
} catch (error) {
  console.error(`Impossible d’ouvrir EPSO : ${error.message}`);
  process.exitCode = 1;
}
