import { rendreFacadePublique } from "../../cinema.js?v=2ab9afab";
import { Etat, chargeSallesEtat } from "../../game-state.js?v=2ab9afab";
import { salles } from "../../rooms.js?v=2ab9afab";
import { appelSecurise, rpc, sbFetch } from "../../supabase-client.js?v=2ab9afab";
import { celebreTrophee } from "../../ui/celebration.js?v=2ab9afab";
import { EMBLEMES, echappe, embleme, texteSur } from "../../ui/emblems.js?v=2ab9afab";
import { icone } from "../../ui/icons.js?v=2ab9afab";

/* ============================================================
   PROFIL PERSONNEL — ce que les autres verront
   ============================================================ */
let monProfil = null;
let mesTitres = [];
let mesTrophees = [];

async function initProfil(){
  await chargeMonProfil();
  if(!monProfil){ document.getElementById("contenuProfil").textContent =
    "Profil indisponible pour l'instant. Recharge la page."; return; }

  if(!monProfil.consentement_demande){ demandeConsentement(); }
  try{ await rpc("verifier_trophees", {p_cinema_id: Etat.cinema.id}); }catch(e){}
  try{ await rpc("verifier_trophees_sociaux", {p_cinema_id: Etat.cinema.id}); }catch(e){}
  await chargeTropheesEtTitres();
  celebreNouveauxTrophees();
  rendProfil();
}

async function chargeMonProfil(){
  try{
    await rpc("verifier_trophees", {p_cinema_id: Etat.cinema.id});
  }catch(e){}
  const d = await sbFetch(`profils_publics?cinema_id=eq.${Etat.cinema.id}&select=*`);
  monProfil = (Array.isArray(d) && d[0]) || null;
  return monProfil;
}
async function chargeTropheesEtTitres(){
  const t = await sbFetch(`trophees?cinema_id=eq.${Etat.cinema.id}&select=*`);
  const cat = await sbFetch(`trophees_catalogue?select=*`);
  const parCle = Object.fromEntries((Array.isArray(cat)?cat:[]).map(c=>[c.cle,c]));
  mesTrophees = (Array.isArray(t)?t:[]).map(x=>({...x, ...(parCle[x.cle]||{})}));
  try{
    const r = await rpc("mes_titres", {p_cinema_id: Etat.cinema.id});
    mesTitres = r?.titres || [];
  }catch(e){ mesTitres = []; }
}

/* ---------- consentement à la première ouverture ---------- */
function demandeConsentement(){
  const o = document.createElement("div");
  o.className = "voileConfirm";
  o.innerHTML = `
    <div class="carteConfirm carteConsentement">
      <div class="ccIco">${icone("porte","icoConfirm")}</div>
      <div class="ccTitre">Ouvrir les portes aux visiteurs ?</div>
      <div class="ccTexte">Ton profil public pourra montrer :</div>
      <ul class="listeConsentement">
        <li>le nom de ton cinéma et sa façade</li>
        <li>ton niveau et ton titre</li>
        <li>ta réputation</li>
        <li>tes statistiques publiques</li>
      </ul>
      <div class="ccEffets">Ton argent, tes coûts et tes données privées resteront masqués.</div>
      <div class="ccBoutons colonne">
        <button class="btnOr btnOuvrir" id="cPublic">Activer mon profil public</button>
        <button class="btnAnnuler" id="cPrive">Garder mon profil privé</button>
      </div>
    </div>`;
  document.body.appendChild(o);
  const ferme = ()=>{ o.classList.add("sortie"); setTimeout(()=>o.remove(),240); };
  o.querySelector("#cPublic").onclick = async ()=>{ ferme(); await majConfidentialite("public"); };
  o.querySelector("#cPrive").onclick  = async ()=>{ ferme(); await majConfidentialite("prive"); };
}

/* ---------- rendu ---------- */
function rendProfil(){
  const p = monProfil;
  const pub = p.visibilite === "public";
  document.getElementById("contenuProfil").innerHTML = `
    <div class="bandeauVisibilite ${pub?'ouvert':'ferme'}">
      ${icone(pub?"porte":"cloche")}
      <span>${pub ? "Profil public — les visiteurs peuvent voir ce cinéma" : "Profil privé — personne ne peut le visiter"}</span>
    </div>

    <section class="vitrineMusee">
      <div class="vmEclairage"></div>
      <div class="vmEnseigne">
        <span class="vmLogo"></span><b class="vmNom" id="vmNom"></b>
      </div>
      <div class="vmSousTitre" id="vmSous"></div>
      <div class="vmFacade" id="facadeProfil"></div>
      <div class="vmSocle">
        <div class="vmSocleItem"><b>${p.niveau}</b><span>Niveau</span></div>
        <div class="vmSocleItem"><b>${p.reputation}</b><span>Réputation</span></div>
        <div class="vmSocleItem"><b id="vmTroph">—</b><span>Trophées</span></div>
      </div>
      <a class="btnOr btnVisiteur" href="visite.html?cinema=${encodeURIComponent(p.public_id)}">
        Voir comme un visiteur</a>
    </section>

    <section class="carteEcran">
      <h2>Aperçu public</h2>
      <div class="apercuProfil">
        <div class="apEmbleme">${embleme(p.embleme, 62)}</div>
        <div class="apTexte">
          <div class="apCine"><span class="apLogo"></span><b id="apNom"></b></div>
          <div class="apPar">Géré par <b id="apPseudo"></b></div>
          <div class="apNiveau">Niveau ${p.niveau} · <i id="apTitre"></i></div>
          <div class="apRep">${icone("etoile")} Réputation ${p.reputation} / 100</div>
        </div>
      </div>
      <div class="apDevise" id="apDevise"></div>
    </section>

    <section class="carteEcran">
      <h2>Identité</h2>
      <label class="lblProg">Pseudo public</label>
      <input class="champProfil" id="champPseudo" type="text" maxlength="20" placeholder="Ton pseudo">
      <label class="lblProg">Devise</label>
      <input class="champProfil" id="champDevise" type="text" maxlength="100" placeholder="Une phrase qui te ressemble">
      <label class="lblProg">Emblème</label>
      <div class="grilleEmblemes" id="grilleEmblemes"></div>
      <button class="btnRouge btnEnregistrer" onclick="enregistreIdentite()">Enregistrer</button>
      <div class="messageProfil" id="msgIdentite"></div>
    </section>

    <section class="carteEcran">
      <h2>Titre affiché</h2>
      <div class="listeTitres" id="listeTitres"></div>
    </section>

    <section class="carteEcran">
      <h2>Trophées</h2>
      <div id="listeTrophees"></div>
    </section>

    <section class="carteEcran">
      <h2>La visite</h2>
      <p class="sousTitrePerso">Ce que les visiteurs peuvent parcourir.</p>
      <div id="reglagesVisite"></div>
      <div id="statsVisites" class="statsVisites"></div>
    </section>

    <section class="carteEcran">
      <h2>Mes salles publiques</h2>
      <p class="sousTitrePerso">Choisis celles que les visiteurs peuvent voir.</p>
      <div id="listeSallesPubliques"></div>
      <button class="btnRouge btnEnregistrer" onclick="enregistreSallesPubliques()">Enregistrer les salles</button>
      <div class="messageProfil" id="msgSalles"></div>
    </section>

    <section class="carteEcran">
      <h2>Interactions sociales</h2>
      <p class="sousTitrePerso">Ce que les autres joueurs peuvent faire avec ton cinéma.</p>
      <div id="reglagesSociaux"></div>
    </section>

    <section class="carteEcran">
      <h2>Confidentialité</h2>
      <div class="choixVisibilite" id="choixVisibilite"></div>
      <div class="reglagesProfil" id="reglagesProfil"></div>
    </section>`;

  /* textes joueur : jamais via innerHTML */
  texteSur(document.getElementById("apNom"), p.nom_cinema);
  texteSur(document.getElementById("vmNom"), p.nom_cinema);
  texteSur(document.getElementById("vmSous"),
    (p.devise ? "« " + p.devise + " »" : "Géré par " + (p.pseudo || "—")));
  const vl = document.querySelector(".vmLogo"); if(vl) vl.textContent = p.logo || "";
  const vt = document.getElementById("vmTroph");
  if(vt) vt.textContent = String(mesTrophees.length || 0);
  texteSur(document.getElementById("apPseudo"), p.pseudo || "—");
  texteSur(document.getElementById("apTitre"), titreAffiche(p));
  texteSur(document.getElementById("apDevise"), p.devise ? "« " + p.devise + " »" : "");
  document.querySelector(".apLogo").textContent = p.logo || "";
  document.getElementById("champPseudo").value = p.pseudo || "";
  document.getElementById("champDevise").value = p.devise || "";

  rendEmblemes(); rendTitres(); rendTrophees(); rendConfidentialite();
  rendReglagesVisite(); rendSallesPubliques(); chargeStatsVisites(); rendReglagesSociaux();
  rendreFacadePublique("facadeProfil", {
    nomCinema:p.nom_cinema, logo:p.logo, quartier:p.quartier, nbSalles:p.nb_salles,
    styleFacade:p.style_facade, styleEnseigne:p.style_enseigne, plaque:p.plaque,
    exterieur: Etat.perso?.exterieur || [], films: []
  });
}

function titreAffiche(p){
  if(p.titre_choisi){
    const t = mesTitres.find(x=>x.cle === p.titre_choisi);
    if(t) return t.nom;
  }
  return p.titre_niveau || "";
}

function rendEmblemes(){
  document.getElementById("grilleEmblemes").innerHTML =
    Object.entries(EMBLEMES).map(([cle,e])=>`
      <button class="vignetteEmbleme ${cle===monProfil.embleme?'actif':''}" onclick="choisitEmbleme('${cle}')">
        ${embleme(cle, 44)}<span>${e.nom}</span>
      </button>`).join("");
}
function choisitEmbleme(cle){
  monProfil.embleme = cle;
  rendEmblemes();
  document.querySelector(".apEmbleme").innerHTML = embleme(cle, 62);
}

function rendTitres(){
  const el = document.getElementById("listeTitres");
  const dispo = mesTitres.filter(t=>t.possede);
  el.innerHTML = `
    <button class="ligneTitre ${!monProfil.titre_choisi?'actif':''}" onclick="choisitTitre('')">
      ${icone("etoile")}<span>Titre du niveau — <i>${echappe(monProfil.titre_niveau||"")}</i></span></button>
    ${dispo.map(t=>`
      <button class="ligneTitre ${t.cle===monProfil.titre_choisi?'actif':''}" onclick="choisitTitre('${t.cle}')">
        ${icone("etoile")}<span>${echappe(t.nom)}</span></button>`).join("")}
    ${mesTitres.filter(t=>!t.possede).map(t=>`
      <div class="ligneTitre verrou">${icone("porte")}<span>${echappe(t.nom)}</span>
        <span class="badgeNiv">Verrouillé</span></div>`).join("")}`;
}
async function choisitTitre(cle){
  const r = await appelSecurise(()=>rpc("select_public_title",
    {p_cinema_id: Etat.cinema.id, p_titre: cle || null}));
  if(!r.ok) return;
  monProfil.titre_choisi = cle || null;
  rendTitres();
  texteSur(document.getElementById("apTitre"), titreAffiche(monProfil));
}

function rendTrophees(){
  const el = document.getElementById("listeTrophees");
  if(mesTrophees.length === 0){
    el.innerHTML = `<div class="vide">Aucun trophée pour l'instant.<br>Ils arrivent en jouant.</div>`;
    return;
  }
  el.innerHTML = mesTrophees.map(t=>`
    <div class="ligneRecit">${icone(t.icone || "etoile")}
      <span><b>${echappe(t.nom || t.cle)}</b><br><small>${echappe(t.description||"")}</small></span></div>`).join("");
}

function rendConfidentialite(){
  const p = monProfil;
  const OPTIONS = [
    {v:"public", nom:"Profil public", desc:"Visible par tous les joueurs"},
    {v:"amis",   nom:"Amis seulement", desc:"Bientôt disponible", desactive:true},
    {v:"prive",  nom:"Profil privé", desc:"Personne ne peut le visiter"}
  ];
  document.getElementById("choixVisibilite").innerHTML = OPTIONS.map(o=>`
    <button class="optVisibilite ${o.v===p.visibilite?'sel':''} ${o.desactive?'desactive':''}"
      ${o.desactive?"disabled":`onclick="majConfidentialite('${o.v}')"`}>
      <b>${o.nom}</b><small>${o.desc}</small></button>`).join("");

  const REGLAGES = [
    {cle:"montre_films",     nom:"Afficher mes films à l'affiche"},
    {cle:"montre_trophees",  nom:"Afficher mes trophées"},
    {cle:"montre_activite",  nom:"Afficher ma dernière activité"},
    {cle:"dans_classements", nom:"Apparaître dans les classements"}
  ];
  document.getElementById("reglagesProfil").innerHTML = REGLAGES.map(r=>`
    <label class="ligneReglage">
      <span>${r.nom}</span>
      <input type="checkbox" ${p[r.cle]?"checked":""} onchange="basculeReglage('${r.cle}', this.checked)">
    </label>`).join("");
}

async function majConfidentialite(visibilite){
  const p = monProfil || {};
  const r = await appelSecurise(()=>rpc("update_profile_privacy", {
    p_cinema_id: Etat.cinema.id, p_visibilite: visibilite,
    p_films: p.montre_films ?? true, p_trophees: p.montre_trophees ?? true,
    p_activite: p.montre_activite ?? true, p_classements: p.dans_classements ?? true}));
  if(!r.ok) return;
  await chargeMonProfil();
  await chargeTropheesEtTitres();
  rendProfil();
}
async function basculeReglage(cle, valeur){
  monProfil[cle] = valeur;
  await appelSecurise(()=>rpc("update_profile_privacy", {
    p_cinema_id: Etat.cinema.id, p_visibilite: monProfil.visibilite,
    p_films: monProfil.montre_films, p_trophees: monProfil.montre_trophees,
    p_activite: monProfil.montre_activite, p_classements: monProfil.dans_classements}));
}

/* ---------- réglages sociaux ---------- */
function rendReglagesSociaux(){
  const p = monProfil;
  const R = [
    {cle:"autorise_abonnements",   nom:"Autoriser les abonnements"},
    {cle:"autorise_reactions",     nom:"Autoriser les réactions"},
    {cle:"autorise_demandes_amis", nom:"Autoriser les demandes d'amis"},
    {cle:"montre_abonnes",         nom:"Afficher mon nombre d'abonnés"},
    {cle:"montre_reactions",       nom:"Afficher les réactions reçues"},
    {cle:"montre_amis",            nom:"Afficher ma liste d'amis"}
  ];
  document.getElementById("reglagesSociaux").innerHTML = R.map(r=>`
    <label class="ligneReglage">
      <span>${r.nom}</span>
      <input type="checkbox" ${p[r.cle]?"checked":""} onchange="basculeSocial('${r.cle}', this.checked)">
    </label>`).join("");
}
async function basculeSocial(cle, valeur){
  monProfil[cle] = valeur;
  await appelSecurise(()=>rpc("update_social_settings", {
    p_cinema_id: Etat.cinema.id,
    p_abonnements: monProfil.autorise_abonnements,
    p_reactions: monProfil.autorise_reactions,
    p_amis: monProfil.autorise_demandes_amis,
    p_montre_abonnes: monProfil.montre_abonnes,
    p_montre_amis: monProfil.montre_amis,
    p_montre_reactions: monProfil.montre_reactions}));
}

/* ---------- réglages de visite ---------- */
function rendReglagesVisite(){
  const p = monProfil;
  const R = [
    {cle:"autorise_visites",  nom:"Autoriser les visites"},
    {cle:"montre_hall",       nom:"Afficher mon hall"},
    {cle:"montre_salles",     nom:"Afficher mes salles"},
    {cle:"montre_collection", nom:"Afficher ma collection"},
    {cle:"montre_compteur",   nom:"Afficher le compteur de visites"}
  ];
  document.getElementById("reglagesVisite").innerHTML = R.map(r=>`
    <label class="ligneReglage">
      <span>${r.nom}</span>
      <input type="checkbox" ${p[r.cle]?"checked":""} onchange="basculeVisite('${r.cle}', this.checked)">
    </label>`).join("");
}
async function basculeVisite(cle, valeur){
  monProfil[cle] = valeur;
  await appelSecurise(()=>rpc("update_visit_settings", {
    p_cinema_id: Etat.cinema.id,
    p_autorise: monProfil.autorise_visites, p_hall: monProfil.montre_hall,
    p_salles: monProfil.montre_salles, p_collection: monProfil.montre_collection,
    p_compteur: monProfil.montre_compteur}));
}

async function chargeStatsVisites(){
  const el = document.getElementById("statsVisites");
  if(!el) return;
  try{
    const r = await rpc("get_my_visit_stats", {p_cinema_id: Etat.cinema.id});
    const d = r?.data || {};
    el.innerHTML = `
      <div class="ligneRecit">${icone("spectateurs")}<span>
        <b>${d.aujourdhui||0}</b> visiteur(s) aujourd'hui · <b>${d.cetteSemaine||0}</b> cette semaine ·
        <b>${d.visiteursUniques||0}</b> visiteur(s) unique(s) au total</span></div>
      <div class="notePied">Les identités des visiteurs ne sont jamais communiquées.</div>`;
  }catch(e){ el.innerHTML = ""; }
}

/* ---------- salles publiques ---------- */
function rendSallesPubliques(){
  const el = document.getElementById("listeSallesPubliques");
  const salles = Etat.salles || [];
  if(salles.length === 0){ el.innerHTML = `<div class="vide">Aucune salle pour l'instant.</div>`; return; }
  el.innerHTML = salles.map((s,i)=>`
    <div class="ligneSallePub" data-id="${s.id}">
      <label class="ligneReglage">
        <span><b>${echappe(s.nom)}</b><br><small>${Number(s.capacite)||0} places</small></span>
        <input type="checkbox" class="chkSalle" ${s.publique !== false ? "checked" : ""}>
      </label>
      <input class="champProfil champDesc" type="text" maxlength="120"
        placeholder="Description publique (facultatif)" value="${echappe(s.description_publique||"")}">
    </div>`).join("");
}
async function enregistreSallesPubliques(){
  const msg = document.getElementById("msgSalles");
  const lignes = [...document.querySelectorAll(".ligneSallePub")].map(n=>({
    id: n.dataset.id,
    publique: n.querySelector(".chkSalle").checked,
    description: n.querySelector(".champDesc").value
  }));
  const r = await appelSecurise(()=>rpc("update_public_rooms", {
    p_cinema_id: Etat.cinema.id, p_salles: lignes}));
  texteSur(msg, r.ok ? "Enregistré." : r.message);
  if(r.ok) await chargeSallesEtat();
}

async function enregistreIdentite(){
  const msg = document.getElementById("msgIdentite");
  const pseudo = document.getElementById("champPseudo").value;
  const devise = document.getElementById("champDevise").value;
  const r = await appelSecurise(()=>rpc("update_public_identity", {
    p_cinema_id: Etat.cinema.id, p_pseudo: pseudo,
    p_embleme: monProfil.embleme, p_devise: devise}));
  if(!r.ok){ texteSur(msg, r.message); return; }
  const rep = r.data;
  if(!rep?.success){
    const M = {USERNAME_TOO_SHORT:"Le pseudo fait 3 caractères au minimum.",
               EMBLEM_UNKNOWN:"Emblème inconnu."};
    texteSur(msg, M[rep?.code] || "Enregistrement impossible.");
    return;
  }
  texteSur(msg, "Enregistré.");
  await chargeMonProfil();
  rendProfil();
}


/* un trophée jamais vu déclenche sa cérémonie, une seule fois */
function celebreNouveauxTrophees(){
  if(typeof celebreTrophee !== "function") return;
  let vus = [];
  try{ vus = JSON.parse(localStorage.getItem("rex_trophees_vus") || "[]"); }catch(e){}
  const nouveaux = mesTrophees.filter(t=>!vus.includes(t.cle));
  if(nouveaux.length === 0) return;
  nouveaux.slice(0, 2).forEach((t,i)=>{
    setTimeout(()=>celebreTrophee(t.nom || t.cle, t.description || "", t.icone || "etoile"), i * 3800);
  });
  try{ localStorage.setItem("rex_trophees_vus",
    JSON.stringify([...vus, ...nouveaux.map(t=>t.cle)])); }catch(e){}
}

/* ---- exports ---- */
export {
  basculeReglage,
  basculeSocial,
  basculeVisite,
  celebreNouveauxTrophees,
  chargeMonProfil,
  chargeStatsVisites,
  chargeTropheesEtTitres,
  choisitEmbleme,
  choisitTitre,
  demandeConsentement,
  enregistreIdentite,
  enregistreSallesPubliques,
  initProfil,
  majConfidentialite,
  mesTitres,
  mesTrophees,
  monProfil,
  rendConfidentialite,
  rendEmblemes,
  rendProfil,
  rendReglagesSociaux,
  rendReglagesVisite,
  rendSallesPubliques,
  rendTitres,
  rendTrophees,
  titreAffiche
};

/* ---- gestionnaires en attribut ---- */
/* Ces fonctions sont appelées depuis des attributs onclick écrits
   dans le HTML généré. Un module ES n'expose rien globalement :
   on les rend accessibles explicitement. */
Object.assign(window, {
  basculeReglage,
  basculeSocial,
  basculeVisite,
  choisitEmbleme,
  choisitTitre,
  enregistreIdentite,
  enregistreSallesPubliques,
  majConfidentialite
});
