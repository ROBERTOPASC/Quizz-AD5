import { useRef, useState } from 'react';
import { Copy, Download, Smartphone, Wifi, WifiOff, CheckCircle } from 'lucide-react';
import { installApp, usePwaStatus } from '../pwa';

export default function TabletPanel({ inSession = false }: { inSession?: boolean }) {
  const pwa = usePwaStatus();
  const [showHelp, setShowHelp] = useState(false);
  const [installMessage, setInstallMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const help = useRef<HTMLDetailsElement>(null);
  const appUrl = 'https://robertopasc.github.io/Quizz-AD5/#tests';
  const revealHelp = () => { setShowHelp(true); requestAnimationFrame(() => help.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })); };
  const install = async () => {
    setInstallMessage('');
    if (!pwa.installable) { revealHelp(); return; }
    const result = await installApp();
    if (result === 'accepted') setInstallMessage('Installation demandée. Dès que l’icône EPSO apparaît sur votre écran d’accueil, touchez-la pour lancer l’application.');
    else {
      setInstallMessage(result === 'dismissed' ? 'Installation annulée. Vous pouvez la relancer depuis le menu de Chrome.' : result === 'error' ? 'L’installation n’a pas pu s’ouvrir ici. Utilisez le menu de Chrome sur votre tablette.' : 'Ouvrez ce lien dans Chrome sur votre tablette pour l’installer.');
      revealHelp();
    }
  };
  const copyLink = async () => {
    try { await navigator.clipboard.writeText(appUrl); setCopied(true); }
    catch { setInstallMessage('Copiez l’adresse affichée ci-dessous et ouvrez-la dans Chrome sur la tablette.'); }
  };
  return <aside className="tests-tablet">
    <div className="tests-install-row">
      <div className="tests-install-description"><Smartphone size={27} aria-hidden="true" /><div>
        <strong>{pwa.standalone ? 'EPSO est ouvert en mode application' : pwa.installed ? 'EPSO est installé' : 'EPSO, directement depuis son icône'}</strong>
        <p>{pwa.standalone ? 'Vos révisions sont accessibles depuis votre écran d’accueil.' : pwa.installed ? 'Touchez l’icône EPSO sur votre écran d’accueil pour ouvrir la fenêtre de l’application.' : 'Installez-le une fois sur la tablette, puis lancez-le depuis l’écran d’accueil, sans barre d’adresse.'}</p>
      </div></div>
      {!pwa.standalone && !pwa.installed && <button className="tests-primary tests-install-button" disabled={pwa.installing} onClick={() => void install()} aria-controls="epso-install-help"><Download size={19} />{pwa.installing ? 'Installation…' : 'Installer l’application'}</button>}
    </div>
    {installMessage && <p role="status">{installMessage}</p>}
    <div className="tests-status">{pwa.offlineReady ? <CheckCircle size={19} /> : pwa.online ? <Wifi size={19} /> : <WifiOff size={19} />}
      <strong>{pwa.offlineReady ? (pwa.online ? 'Tests et maths disponibles hors connexion' : 'Hors connexion · vous pouvez continuer') : import.meta.env.DEV ? 'Aperçu sur ordinateur' : 'Préparation du mode hors connexion…'}</strong>
    </div>
    {pwa.error && <p role="alert">{pwa.error}</p>}
    {pwa.updateReady && <div className="tests-update"><p>Une nouvelle version est prête.{inSession ? ' Terminez ou mettez votre séance en pause avant de l’ouvrir.' : ' Votre progression restera enregistrée.'}</p><button disabled={inSession} onClick={() => window.dispatchEvent(new Event('epso-apply-update'))}>Ouvrir la mise à jour</button></div>}
    <details id="epso-install-help" ref={help} open={showHelp} onToggle={e => setShowHelp(e.currentTarget.open)}><summary>{pwa.standalone ? 'Aide et sauvegarde' : 'Installer ou retrouver l’icône sur Android'}</summary>
      {!pwa.standalone && <>
        <p>L’installation se fait une seule fois, avec votre confirmation sur la tablette. Si cette page est ouverte dans l’aperçu d’une autre application, copiez son lien et ouvrez-le dans Chrome.</p>
        <div className="tests-install-link"><a href={appUrl}>{appUrl}</a><button onClick={() => void copyLink()}><Copy size={16} /> {copied ? 'Lien copié' : 'Copier le lien'}</button></div>
        <ol><li>Ouvrez le lien dans <strong>Chrome sur la tablette</strong>, avec Internet.</li><li>Touchez <strong>Installer l’application</strong>. Si la fenêtre d’installation n’apparaît pas, utilisez le menu <strong>⋮ → Ajouter à l’écran d’accueil → Installer</strong> si proposé.</li><li>Attendez le message « Tests et maths disponibles hors connexion ».</li><li>Retrouvez ensuite l’icône <strong>EPSO AD5</strong> sur votre écran d’accueil : elle lance l’application dans sa propre fenêtre.</li></ol>
        {pwa.installed && <p>L’icône est déjà installée : utilisez-la pour quitter l’affichage dans le navigateur.</p>}
      </>}
      <p>Une fois le mode hors connexion prêt, vous pouvez lancer de nouvelles séries, lire les corrections et utiliser la calculatrice sans Internet. Les exercices de maths et les suites abstraites sont générés sur votre appareil ; les autres domaines utilisent les questions déjà incluses.</p>
      <p>Les fonctions de génération par IA (QCM, fiches, analyse de documents…) demandent une connexion à votre service IA. Les tests prêts et le parcours de maths ne demandent aucune clé IA.</p>
      <p>Le suivi reste dans ce navigateur. Utilisez « Exporter mon suivi » pour le transférer entre l’ordinateur et la tablette ou le sauvegarder.</p>
    </details>
  </aside>;
}
