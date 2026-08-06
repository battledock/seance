/* Accès Supabase : requêtes, RPC, session, erreurs typées. */


import { Etat, rafraichirEtat } from "./game-state.js?v=2ab9afab";
import { deconnexion } from "./auth.js?v=2ab9afab";
/* ============================================================
   CLIENT SUPABASE — point d'entrée réseau unique
   Toutes les requêtes du jeu passent par ici : renouvellement de
   session, délais, erreurs normalisées, statut de sauvegarde.
   ============================================================ */
const SB_URL = "https://zpfkekiavlfphialvphi.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpwZmtla2lhdmxmcGhpYWx2cGhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU3Mjc4MzIsImV4cCI6MjEwMTMwMzgzMn0.ORa4y_AMjuWbxboKm3o6Jn7ryYjkOm4mSgLa2Schv98";
const DELAI_RESEAU = 12000;

/* ---------- session ---------- */
function sessionLocale(){
  try{ return JSON.parse(localStorage.getItem("rex_session") || "null"); }
  catch(e){ return null; }
}
function ecritSession(s){
  localStorage.setItem("rex_session", JSON.stringify(s));
  if(typeof Etat !== "undefined") Etat.session = s;
}

/* renouvellement du jeton — une seule tentative à la fois */
let renouvellementEnCours = null;
async function renouvelleSession(){
  if(renouvellementEnCours) return renouvellementEnCours;
  const s = sessionLocale();
  if(!s?.refresh_token) return null;
  renouvellementEnCours = (async ()=>{
    try{
      const rep = await fetch(SB_URL + "/auth/v1/token?grant_type=refresh_token", {
        method:"POST",
        headers:{"apikey":SB_KEY, "Content-Type":"application/json"},
        body: JSON.stringify({refresh_token: s.refresh_token})
      });
      if(!rep.ok) return null;
      const d = await rep.json();
      if(!d.access_token) return null;
      const neuve = {...s, access_token:d.access_token, refresh_token:d.refresh_token || s.refresh_token,
                     user_id: d.user?.id || s.user_id, expire_le: Date.now() + (d.expires_in || 3600)*1000};
      ecritSession(neuve);
      return neuve;
    }catch(e){ return null; }
    finally{ setTimeout(()=>{ renouvellementEnCours = null; }, 0); }
  })();
  return renouvellementEnCours;
}

/* ---------- erreurs normalisées ---------- */
class ErreurJeu extends Error {
  constructor(code, message, details){
    super(message || code);
    this.code = code;
    this.details = details;
  }
}
const MESSAGES_ERREUR = {
  RESEAU:        "Le réseau a mangé la bobine. Je vérifie que rien n'a été perdu.",
  DELAI:         "Le serveur met trop de temps à répondre. Je réessaie dans un instant.",
  SESSION:       "Ta session a expiré. Reconnecte-toi, le cinéma t'attend.",
  INTERDIT:      "Cette action ne t'est pas permise.",
  CONFLIT:       "Une autre fenêtre a déjà fait cette action. Je recharge l'état officiel.",
  FONDS:         "On ne peut pas payer avec des tickets de tombola. Il manque de l'argent en caisse.",
  ETAT_CONFLIT:  "Ton cinéma a changé ailleurs. Je recharge les données officielles.",
  SERVEUR:       "La machine a toussé. Rien n'est perdu, réessaie."
};
function messageErreur(e){
  const base = MESSAGES_ERREUR[e?.code] || MESSAGES_ERREUR.SERVEUR;
  const d = e?.details;
  if(!d) return base;

  /* Le code seul ne dit rien — ni au joueur, ni à moi quand il me le
     rapporte. On ajoute la phrase du serveur quand elle existe : c'est
     souvent notre propre texte, et c'est ce qui permet de comprendre. */
  const dit = (d.message || d.hint || "").trim();
  const tech = [d.code, dit].filter(Boolean).join(" · ");
  if(tech) console.warn("[Séance] erreur serveur :", d);
  return tech ? base + " (" + tech + ")" : base;
}

/* ------------------------------------------------------------
   VIDER LE CACHE ET REPARTIR PROPRE

   Les fichiers portent un tampon de version, ce qui suffit dans
   presque tous les cas. Reste le cas où c'est la PAGE elle-même
   qui est en cache : elle pointe alors vers d'anciens tampons, et
   le jeu tourne avec un mélange d'ancien et de neuf.

   On ne peut pas forcer un navigateur à vider son cache depuis du
   JavaScript. Ce qu'on peut faire :
     · supprimer les caches applicatifs et les service workers ;
     · recharger la page avec une adresse jamais vue, ce qui oblige
       à la retélécharger, et avec elle les bons tampons.

   La session n'est pas touchée : le joueur reste connecté.
   ------------------------------------------------------------ */
async function videLeCache(){
  try{
    if(window.caches && caches.keys){
      const noms = await caches.keys();
      await Promise.all(noms.map(n => caches.delete(n)));
    }
  }catch(e){}
  try{
    if(navigator.serviceWorker && navigator.serviceWorker.getRegistrations){
      const rs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(rs.map(r => r.unregister()));
    }
  }catch(e){}

  /* une adresse jamais vue : le navigateur ne peut pas la servir
     depuis son cache, et la page fraîche porte les bons tampons */
  const base = location.pathname;
  location.replace(base + "?frais=" + Date.now());
}

/* Le bouton de secours, proposé quand quelque chose coince. */
function proposeVidageCache(raison, detail){
  if(document.getElementById("secoursCache")) return;
  const d = document.createElement("div");
  d.id = "secoursCache";
  d.className = "secoursCache";
  d.innerHTML = `
    <div class="scTexte"><b>Le jeu semble bloqué</b>
      <span>${raison || "Une version ancienne est peut-être en mémoire."}</span></div>
    ${detail ? `<div class="scDetail" id="scDetail">${
      String(detail).replace(/&/g,"&amp;").replace(/</g,"&lt;").slice(0, 300)}</div>
      <button class="scCopier" id="scCopier">Copier le message</button>` : ""}
    <button class="scBtn" id="scBtn">Vider le cache et recharger</button>
    <button class="scFermer" id="scFermer">Plus tard</button>`;
  document.body.appendChild(d);
  document.getElementById("scBtn").onclick = () => {
    document.getElementById("scBtn").textContent = "On nettoie…";
    videLeCache();
  };
  document.getElementById("scFermer").onclick = () => d.remove();

  /* le message exact, copiable : sans lui on cherche à l'aveugle */
  const c = document.getElementById("scCopier");
  if(c) c.onclick = async () => {
    try{
      await navigator.clipboard.writeText(document.getElementById("scDetail").textContent);
      c.textContent = "Copié";
    }catch(e){
      const r = document.createRange();
      r.selectNodeContents(document.getElementById("scDetail"));
      const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
      c.textContent = "Sélectionné — copie à la main";
    }
  };
}

/* Deux échecs de suite sur le même écran : on le propose de nous-mêmes. */
let echecsDeSuite = 0;
function compteEchec(){
  echecsDeSuite += 1;
  if(echecsDeSuite >= 2) proposeVidageCache();
}
function oublieEchecs(){ echecsDeSuite = 0; }

/* Une erreur de chargement de module — le symptôme exact d'un fichier
   ancien resté en cache — déclenche l'offre immédiatement. */
window.addEventListener("error", e => {
  const m = String(e?.message || "");
  /* un fichier ancien resté en cache donne toujours l'une de ces erreurs */
  if(!/Can't find variable|is not defined|Failed to fetch dynamically|error loading|undefined is not/i.test(m))
    return;
  const ou = e.filename
    ? String(e.filename).split("/").pop().split("?")[0] + ":" + (e.lineno || "?")
    : "";
  proposeVidageCache("Un fichier ancien est peut-être resté en mémoire.",
    m + (ou ? "  ·  " + ou : ""));
}, true);

/* une promesse qui échoue sans être rattrapée : même symptôme */
window.addEventListener("unhandledrejection", e => {
  const m = String(e?.reason?.message || e?.reason || "");
  if(!/Can't find variable|is not defined|Failed to fetch dynamically|null is not an object|undefined is not/i.test(m))
    return;
  proposeVidageCache("Quelque chose n'a pas répondu.", m);
});

/* ---------- statut de sauvegarde discret ---------- */
function statutSauvegarde(etat){
  let el = document.getElementById("statutSauvegarde");
  if(!el){
    el = document.createElement("div");
    el.id = "statutSauvegarde";
    el.className = "statutSauvegarde";
    document.body.appendChild(el);
  }
  clearTimeout(el._t);
  if(etat === "encours"){ el.textContent = "Sauvegarde…"; el.className = "statutSauvegarde visible"; }
  else if(etat === "ok"){ el.textContent = "Sauvegardé"; el.className = "statutSauvegarde visible ok";
    el._t = setTimeout(()=>{ el.className = "statutSauvegarde"; }, 1400); }
  else if(etat === "erreur"){ el.textContent = "Erreur de synchronisation"; el.className = "statutSauvegarde visible erreur";
    el._t = setTimeout(()=>{ el.className = "statutSauvegarde"; }, 3200); }
  else el.className = "statutSauvegarde";
}

/* ---------- requête REST ---------- */
async function requete(chemin, options = {}, reessai = true){
  const s = sessionLocale();
  const entetes = {
    "apikey": SB_KEY,
    "Content-Type": "application/json",
    "Prefer": options.prefer || "return=representation"
  };
  if(s?.access_token) entetes["Authorization"] = "Bearer " + s.access_token;

  const ctrl = new AbortController();
  const minuteur = setTimeout(()=>ctrl.abort(), options.delai || DELAI_RESEAU);
  let rep;
  try{
    rep = await fetch(SB_URL + "/rest/v1/" + chemin, {
      method: options.method || "GET",
      headers: entetes,
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: ctrl.signal
    });
  }catch(e){
    clearTimeout(minuteur);
    throw new ErreurJeu(e.name === "AbortError" ? "DELAI" : "RESEAU");
  }
  clearTimeout(minuteur);

  /* jeton expiré : on renouvelle et on rejoue une fois */
  if(rep.status === 401 && reessai){
    const neuve = await renouvelleSession();
    if(neuve) return requete(chemin, options, false);
    throw new ErreurJeu("SESSION");
  }
  if(rep.status === 401) throw new ErreurJeu("SESSION");
  if(rep.status === 403) throw new ErreurJeu("INTERDIT");
  if(rep.status === 409) throw new ErreurJeu("CONFLIT");
  if(!rep.ok){
    let d = null;
    try{ d = await rep.json(); }catch(e){}
    /* le détail brut ne va jamais à l'écran, mais il part dans la console
       et un code court est conservé pour le diagnostic */
    const code = d?.code || String(rep.status);
    console.error("[Rex] échec", chemin, code, d?.message || d?.hint || "");
    throw new ErreurJeu("SERVEUR", MESSAGES_ERREUR.SERVEUR, {code, chemin});
  }
  if(options.prefer === "return=minimal") return true;
  try{ return await rep.json(); }catch(e){ return null; }
}

/* compatibilité : sbFetch reste l'API utilisée par les modules du jeu.
   Les lectures renvoient [] en cas d'échec pour ne pas casser l'affichage ;
   les écritures propagent l'erreur pour être traitées explicitement. */
async function sbFetch(chemin, options = {}){
  const ecriture = options.method && options.method !== "GET";
  try{
    if(ecriture) statutSauvegarde("encours");
    const r = await requete(chemin, options);
    if(ecriture) statutSauvegarde("ok");
    return r;
  }catch(e){
    if(ecriture) statutSauvegarde("erreur");
    if(e.code === "SESSION"){ deconnexion(); return null; }
    if(!ecriture) return [];
    throw e;
  }
}

/* ---------- appels de fonctions serveur ---------- */
async function rpc(nom, params){
  return requete("rpc/" + nom, {method:"POST", body: params || {}});
}

/* identifiant d'opération : rejouer le même appel ne l'exécute qu'une fois */
function idOperation(){
  if(crypto?.randomUUID) return crypto.randomUUID();
  return "op-" + Date.now() + "-" + Math.random().toString(16).slice(2);
}

/* ============================================================
   APPEL SÉCURISÉ — enveloppe des actions sensibles
   En cas d'échec on ne suppose jamais que l'action n'a pas eu lieu :
   on recharge l'état officiel avant de rendre la main.
   ============================================================ */
async function appelSecurise(operation, options = {}){
  const {surErreur, rechargeApresErreur = true} = options;
  try{
    const r = {ok:true, data: await operation()};
    oublieEchecs();
    return r;
  }catch(e){
    const msg = messageErreur(e);
    if(rechargeApresErreur && typeof rafraichirEtat === "function"){
      try{ await rafraichirEtat(); }catch(_){}
    }
    if(typeof surErreur === "function") surErreur(msg, e);
    /* deux échecs de suite : on propose de repartir propre */
    compteEchec();
    return {ok:false, code: e.code || "SERVEUR", message: msg};
  }
}

/* ---- exports ---- */
export {
  DELAI_RESEAU,
  MESSAGES_ERREUR,
  SB_KEY,
  SB_URL,
  appelSecurise,
  compteEchec,
  echecsDeSuite,
  ecritSession,
  idOperation,
  messageErreur,
  oublieEchecs,
  proposeVidageCache,
  renouvelleSession,
  renouvellementEnCours,
  requete,
  rpc,
  sbFetch,
  sessionLocale,
  statutSauvegarde,
  videLeCache
};

/* ---- gestionnaires en attribut ---- */
/* Ces fonctions sont appelées depuis des attributs onclick écrits
   dans le HTML généré. Un module ES n'expose rien globalement :
   on les rend accessibles explicitement. */
Object.assign(window, {
  proposeVidageCache,
  videLeCache
});
