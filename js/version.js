/* ============================================================
   CONTRÔLE DE VERSION

   Ce fichier porte le numéro de la version en cours. À chaque
   déploiement, le cache-bust global le met à jour comme tous les
   autres tampons — VERSION vaut donc toujours le tampon courant.

   La carte affichée dans « Plus » compare cette version à celle
   réellement servie par le serveur : elle redemande la page avec
   l'ordre « cache: reload » et lit le tampon qu'elle contient. Si
   le serveur a du neuf que le navigateur n'a pas encore, la carte
   le signale et propose de l'installer d'un tap.

   « Installer » réutilise videLeCache : purge, retéléchargement
   des ressources, rechargement propre.
   ============================================================ */

import { videLeCache } from "./supabase-client.js?v=becf21cb";

/* le tampon courant : injecté par le cache-bust à chaque build */
const VERSION = "becf21cb";

/* on retient la dernière version vue pour repérer un saut */
try{
  const vue = localStorage.getItem("seance_version");
  if(vue && vue !== VERSION){
    /* le joueur vient de passer sur une version neuve : on note */
    localStorage.setItem("seance_version_precedente", vue);
  }
  localStorage.setItem("seance_version", VERSION);
}catch(e){}

/* lit le tampon réellement servi par le serveur pour un fichier
   donné, en contournant le cache du navigateur */
async function versionServeur(){
  try{
    const rep = await fetch("plus.html?sonde=" + Date.now(), {
      cache: "reload", credentials: "same-origin"
    });
    if(!rep.ok) return null;
    const html = await rep.text();
    const m = html.match(/plus\.js\?v=([0-9a-f]{8})/);
    return m ? m[1] : null;
  }catch(e){ return null; }
}

function abrege(v){ return v ? v.slice(0, 8) : "?"; }

/* dessine la carte dans le conteneur fourni */
function rendCarteVersion(cibleId = "blocVersion"){
  const el = document.getElementById(cibleId);
  if(!el) return;

  el.innerHTML = `
    <div class="carteVersion ajour" id="carteVersion">
      <div class="cvBadge"><span class="cvPoint"></span>
        <span class="cvNum">v${VERSION}</span></div>
      <div class="cvEtat" id="cvEtat">Ton jeu est à jour</div>
      <div class="cvDet" id="cvDet">Touche pour vérifier</div>
      <button class="cvBtn" id="cvBtn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 12a9 9 0 11-6.2-8.5"/><path d="M21 3v6h-6"/></svg>
        <span>Vérifier les mises à jour</span>
      </button>
    </div>`;

  const carte = document.getElementById("carteVersion");
  const btn = document.getElementById("cvBtn");
  const etat = document.getElementById("cvEtat");
  const det = document.getElementById("cvDet");
  const txt = btn.querySelector("span");
  const ico = btn.querySelector("svg");

  let neuveTrouvee = null;

  btn.onclick = async ()=>{
    /* deuxième tap : on installe la version repérée */
    if(neuveTrouvee){
      txt.textContent = "Installation…";
      ico.classList.add("cvTourne");
      det.textContent = "Nettoyage du cache…";
      setTimeout(()=> videLeCache(), 500);
      return;
    }
    /* premier tap : on interroge le serveur */
    txt.textContent = "Vérification…";
    ico.classList.add("cvTourne");
    const dispo = await versionServeur();
    ico.classList.remove("cvTourne");

    if(!dispo){
      det.textContent = "Vérification impossible — réessaie plus tard";
      txt.textContent = "Vérifier les mises à jour";
      return;
    }
    if(dispo === VERSION){
      carte.className = "carteVersion ajour";
      etat.textContent = "Ton jeu est à jour";
      det.textContent = "Vérifié à l'instant";
      txt.textContent = "Vérifier les mises à jour";
      return;
    }
    /* une version plus récente est en ligne */
    neuveTrouvee = dispo;
    carte.className = "carteVersion vieux";
    etat.textContent = "Nouvelle version disponible";
    det.textContent = "v" + VERSION + " installée · v" + dispo + " en ligne";
    txt.innerHTML = 'Installer v' + dispo;
  };
}

export { VERSION, rendCarteVersion, versionServeur };
Object.assign(window, { rendCarteVersion });
