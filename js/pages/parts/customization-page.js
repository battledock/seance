import {
  CATALOGUE_PERSO,
  accessible,
  achetePersonnalisation,
  appliquePersonnalisation,
  chargePersonnalisation,
  itemPerso
} from "../../data/customization.js?v=2ab9afab";
import { Etat, fmtArgent } from "../../game-state.js?v=2ab9afab";
import { bobCompact } from "../../navigation.js?v=2ab9afab";
import { accomplitMission, estDebloque, recompenseParCle } from "../../progression.js?v=2ab9afab";
import { ICONES } from "../../ui/icons.js?v=2ab9afab";

/* ============================================================
   PAGE PERSONNALISATION
   ============================================================ */
let ongletPerso = (ONGLETS[0] && ONGLETS[0].id) || "sieges";

async function initPersonnalisation(){
  await chargePersonnalisation();
  rendOngletsPerso();
  rendContenuPerso();
  document.getElementById("zoneBob").appendChild(
    bobCompact("Tout ce qui se voit depuis la rue passe par ici. Choisis bien, le quartier regarde."));
}

/* Les onglets suivent le catalogue au lieu d'être écrits à part :
   retirer une catégorie ne peut plus laisser un onglet qui pointe
   dans le vide. */
const ONGLETS = Object.entries(CATALOGUE_PERSO).map(([id, c]) => ({id, nom: c.nom}));


function rendOngletsPerso(){
  document.getElementById("ongletsPerso").innerHTML = ONGLETS.map(o=>{
    const conf = CATALOGUE_PERSO[o.id];
    const verrou = conf.cleDeblocage && !estDebloque(conf.cleDeblocage);
    return `<button class="ongletPerso ${o.id===ongletPerso?'actif':''} ${verrou?'verrou':''}"
      onclick="changeOnglet('${o.id}')">${o.nom}${verrou?" 🔒".replace("🔒",""):""}</button>`;
  }).join("");
}
function changeOnglet(id){ ongletPerso = id; rendOngletsPerso(); rendContenuPerso(); }

function rendContenuPerso(){
  const conf = CATALOGUE_PERSO[ongletPerso];
  if(!conf){ ongletPerso = ONGLETS[0] && ONGLETS[0].id; return rendContenuPerso(); }
  const el = document.getElementById("contenuPerso");
  if(conf.cleDeblocage && !estDebloque(conf.cleDeblocage)){
    const r = recompenseParCle(conf.cleDeblocage);
    el.innerHTML = `<section class="carteEcran"><h2>${conf.nom}</h2>
      <div class="eqVerrou"><b>Verrouillé</b><span>Disponible au niveau ${r ? r.niveau : "?"}.</span></div></section>`;
    return;
  }
  el.innerHTML = conf.emplacements ? rendHall(conf)
              : conf.multiple      ? rendMultiple(conf)
              :                      rendSimple(conf);
}

/* ---------- catégories à choix unique ---------- */
function rendSimple(conf){
  const actuel = Etat.perso[conf.champ];
  return `<section class="carteEcran"><h2>${conf.nom}</h2>
    <div class="grillePerso">
      ${conf.items.map(i=>vignettePerso(ongletPerso, i, i.id===actuel)).join("")}
    </div></section>`;
}
function rendMultiple(conf){
  const liste = Etat.perso.exterieur || [];
  return `<section class="carteEcran"><h2>${conf.nom}</h2>
    <p class="sousTitrePerso">Plusieurs éléments peuvent être posés en même temps.</p>
    <div class="grillePerso">
      ${conf.items.map(i=>vignettePerso(ongletPerso, i, liste.includes(i.id))).join("")}
    </div></section>`;
}
function rendHall(conf){
  return conf.zones.map(z=>{
    const choisi = Etat.perso.hall[z.id] || z.objets[0].id;
    return `<section class="carteEcran"><h2>${z.nom}</h2>
      <div class="grillePerso">
        ${z.objets.map(o=>vignettePerso("hall", o, o.id===choisi, z.id)).join("")}
      </div></section>`;
  }).join("");
}

function vignettePerso(cat, item, actif, zone){
  const a = accessible(cat, item.id);
  const etiquette = a.ok ? (actif ? "Sélectionné" : "Appliquer")
    : a.raison === "niveau" ? "Niveau " + a.niveau
    : fmtArgent(a.cout);
  return `<button class="vignettePerso ${actif?'actif':''} ${a.ok?'':'verrouillee'}"
    onclick="ouvreApercu('${cat}','${item.id}'${zone?`,'${zone}'`:""})">
    <span class="vpApercu">${apercuVignette(cat, item)}</span>
    <span class="vpNom">${item.nom}</span>
    <span class="vpEtat ${actif?'sel':''}">${etiquette}</span>
  </button>`;
}

function apercuVignette(cat, item){
  if(cat === "facade")
    return `<svg viewBox="0 0 60 40"><rect width="60" height="40" fill="${item.mur?item.mur[1]:'#8c3a52'}"/>
      <rect x="6" y="6" width="48" height="7" rx="2" fill="${item.filetsOr?'#e8b84b':'#caa24a'}"/>
      <rect x="18" y="22" width="24" height="18" fill="#22305a" stroke="#caa24a" stroke-width="1.5"/></svg>`;
  if(cat === "enseigne")
    return `<svg viewBox="0 0 60 40"><rect width="60" height="40" fill="#2a1119"/>
      <text x="30" y="25" text-anchor="middle" font-family="Georgia" font-weight="bold" font-size="11"
        fill="${item.couleur}" style="filter:drop-shadow(0 0 5px ${item.halo})">REX</text></svg>`;
  if(cat === "sieges")
    return `<svg viewBox="0 0 60 40"><rect width="60" height="40" fill="#2a2028"/>
      ${[12,30,48].map(x=>`<rect x="${x-7}" y="14" width="14" height="15" rx="3" fill="${item.couleur}"/>`).join("")}</svg>`;
  const ICONES_PERSO = {banc:"fauteuil", lampadaire:"etoile", pot:"maison", panneau:"journal",
    guirlande:"cloche", plaque_quartier:"etoile", aucune:"porte"};
  return `<svg viewBox="0 0 60 40"><rect width="60" height="40" fill="#241a20"/>
    <g transform="translate(18 8) scale(1)">${ICONES[ICONES_PERSO[item.id] || "etoile"]}</g></svg>`;
}

/* ---------- aperçu avant application ---------- */
function ouvreApercu(cat, id, zone){
  const conf = CATALOGUE_PERSO[cat];
  const item = itemPerso(cat, id);
  const a = accessible(cat, id);
  const actuelId = conf.emplacements ? (Etat.perso.hall[zone] || conf.zones.find(z=>z.id===zone).objets[0].id)
                 : conf.multiple ? null : Etat.perso[conf.champ];
  const actuel = actuelId ? itemPerso(cat, actuelId) : null;
  const deja = conf.multiple ? (Etat.perso.exterieur||[]).includes(id) : actuelId === id;

  const o = document.createElement("div");
  o.className = "voileConfirm";
  o.innerHTML = `
    <div class="carteConfirm carteApercu">
      <div class="apercuGrand">${apercuVignette(cat, item)}</div>
      <div class="ccTitre">${item.nom}</div>
      ${item.desc ? `<div class="ccTexte">${item.desc}</div>` : ""}
      ${actuel ? `<div class="ccResume">
          <span>Actuellement : <b>${actuel.nom}</b></span>
          <span>Nouvelle apparence : <b>${item.nom}</b></span>
        </div>` : ""}
      ${a.raison === "niveau" ? `<div class="ccAlerte">Disponible au niveau ${a.niveau}.</div>` : ""}
      ${a.raison === "achat" ? `<div class="ccResume"><span>Prix : <b>${fmtArgent(a.cout)}</b></span>
        <span>Caisse après achat : <b>${fmtArgent(Math.max(0, Number(Etat.cinema.argent)-a.cout))}</b></span></div>` : ""}
      <div class="ccBoutons">
        <button class="btnAnnuler" id="aAnnuler">Annuler</button>
        ${a.raison === "niveau" ? ""
          : `<button class="btnOr btnOuvrir" id="aValider">${
              a.raison === "achat" ? "Acheter et appliquer"
              : conf.multiple ? (deja ? "Retirer" : "Installer")
              : deja ? "Déjà appliqué" : "Appliquer"}</button>`}
      </div>
    </div>`;
  document.body.appendChild(o);
  o.querySelector("#aAnnuler").onclick = ()=>{ o.classList.add("sortie"); setTimeout(()=>o.remove(),240); };
  const v = o.querySelector("#aValider");
  if(v) v.onclick = async ()=>{
    v.disabled = true; v.textContent = "…";
    if(a.raison === "achat"){
      const r = await achetePersonnalisation(cat, id);
      if(r && r.erreur === "argent"){ o.remove(); bulleP("La caisse dit non. Poliment, mais fermement."); return; }
    }
    const res = await appliquePersonnalisation(cat, id, zone);
    o.remove();
    if(res && res.erreur){ bulleP("La connexion a lâché. Je recharge l'état officiel."); await chargePersonnalisation(); }
    rendContenuPerso();
    await declencheMissionPerso(cat);
    bulleP(phrasePerso(cat, item));
  };
}
function bulleP(t){
  const z = document.getElementById("zoneBob");
  z.innerHTML = ""; z.appendChild(bobCompact(t));
  window.scrollTo({top:0, behavior:"smooth"});
}
function phrasePerso(cat, item){
  const P = {
    enseigne:`« ${item.nom} » sur la façade. On nous verra depuis le bout de la rue.`,
    facade:`Repeint en ${item.nom.toLowerCase()}. J'ai encore de la peinture sur les mains.`,
    hall:"Le hall change de tête. Les gens vont enfin regarder ailleurs que leurs chaussures.",
    exterieur:"Installé sur le trottoir. Ne me demande pas comment j'ai porté ça tout seul.",
    sieges:`Fauteuils ${item.nom.toLowerCase()}. Le rang 12 approuve. Enfin, il grince différemment.`,
    plaque:"La plaque est posée. Vissée. Bien droite. J'ai vérifié trois fois."
  };
  return P[cat] || "C'est fait, patron.";
}
async function declencheMissionPerso(cat){
  const M = {enseigne:"m_enseigne", hall:"m_hall", exterieur:"m_exterieur", facade:"m_facade"};
  if(M[cat]) await accomplitMission(M[cat]);
}

/* ---- exports ---- */
export {
  ONGLETS,
  apercuVignette,
  bulleP,
  changeOnglet,
  declencheMissionPerso,
  initPersonnalisation,
  ongletPerso,
  ouvreApercu,
  phrasePerso,
  rendContenuPerso,
  rendHall,
  rendMultiple,
  rendOngletsPerso,
  rendSimple,
  vignettePerso
};

/* ---- gestionnaires en attribut ---- */
/* Ces fonctions sont appelées depuis des attributs onclick écrits
   dans le HTML généré. Un module ES n'expose rien globalement :
   on les rend accessibles explicitement. */
Object.assign(window, {
  changeOnglet,
  ouvreApercu
});
