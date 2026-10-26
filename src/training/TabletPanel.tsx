import { Download, Wifi, WifiOff, CheckCircle } from 'lucide-react';
import { installApp, usePwaStatus } from '../pwa';

export default function TabletPanel({ inSession = false }: { inSession?: boolean }) {
  const pwa = usePwaStatus();
  return <aside className="tests-tablet">
    <div className="tests-status">{pwa.offlineReady ? <CheckCircle size={19} /> : pwa.online ? <Wifi size={19} /> : <WifiOff size={19} />}
      <strong>{pwa.offlineReady ? (pwa.online ? 'Tests et maths disponibles hors connexion' : 'Hors connexion · vous pouvez continuer') : import.meta.env.DEV ? 'Aperçu sur ordinateur' : 'Préparation du mode hors connexion…'}</strong>
    </div>
    {pwa.error && <p role="alert">{pwa.error}</p>}
    {pwa.updateReady && <div className="tests-update"><p>Une nouvelle version est prête.{inSession ? ' Terminez ou mettez votre séance en pause avant de l’ouvrir.' : ' Votre progression restera enregistrée.'}</p><button disabled={inSession} onClick={() => window.dispatchEvent(new Event('epso-apply-update'))}>Ouvrir la mise à jour</button></div>}
    <details><summary>{pwa.installed ? 'Application installée · aide et sauvegarde' : 'Installer sur ma tablette Android'}</summary>
      {import.meta.env.DEV ? <p>Cette adresse locale sert à l’aperçu sur l’ordinateur. La version publiée dispose d’une adresse accessible depuis la tablette.</p> : <>
        <ol><li>Ouvrez cette adresse dans <strong>Chrome sur la tablette</strong>, avec Internet.</li><li>Attendez le message « Tests et maths disponibles hors connexion ».</li><li>Dans le menu ⋮ de Chrome, choisissez <strong>Ajouter à l’écran d’accueil</strong>, puis <strong>Installer</strong> si proposé.</li><li>Lancez ensuite EPSO depuis son icône.</li></ol>
        {pwa.installable && <button className="tests-primary" onClick={() => void installApp()}><Download size={18} /> Installer EPSO</button>}
      </>}
      <p>Les tests prêts et le parcours de maths fonctionnent sans clé IA. La génération IA à partir de vos documents demande Internet et votre clé personnelle.</p>
      <p>Le suivi reste dans ce navigateur. Utilisez « Exporter mon suivi » pour le transférer entre l’ordinateur et la tablette ou le sauvegarder.</p>
    </details>
  </aside>;
}
