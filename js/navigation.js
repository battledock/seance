/* Header et navigation basse, injectés sur chaque page. */

import { Etat, fmtArgent, statutCinema } from "./game-state.js?v=2ab9afab";
import { majBarreXPHeader, niveauActuel } from "./progression.js?v=2ab9afab";
import { icone } from "./ui/icons.js?v=2ab9afab";

/* Header + nav basse injectés sur chaque page. initNavigation("jeu") */
const PAGES_NAV = [
  {id:"jeu",   url:"jeu.html",           ic:"batiment",  label:"Cinéma"},
  {id:"prog",  url:"programmation.html", ic:"pellicule", label:"Séances"},
  {id:"salles",url:"salles.html",        ic:"fauteuil",  label:"Salles"},
  {id:"studio",url:"studio.html",        ic:"camera",    label:"Studio"},
  {id:"plus",  url:"plus.html",        ic:"etoile",    label:"Plus"}
];

function initNavigation(actif){
  const c = Etat.cinema || {logo:"", nom:"…", argent:0};
  const h = document.createElement("header");
  h.className = "entete";
  h.innerHTML = `
    <div class="in">
      <span class="medailleH" id="medailleH" aria-hidden="true"></span>
      <span class="bloc">
        <span class="nomCine" id="nomCineH"></span>
        <span class="etatH" id="etatH"><span class="pastilleH" id="pastilleH"></span></span>
      </span>
      <span class="droiteH">
        <span class="argentH" id="statArgent">${fmtArgent(c.argent)}</span>
        <span class="xpZone">
          <span class="xpNiv" id="xpNiv">niv ${typeof niveauActuel==="function"?niveauActuel():1}</span>
          <span class="xpPiste"><span class="xpBarre" id="xpBarre"></span></span>
        </span>
      </span>
    </div>`;
  document.body.prepend(h);
  /* le nom et l'emblème sont du texte joueur : jamais en innerHTML */
  const nomH = h.querySelector("#nomCineH");
  if(nomH) nomH.textContent = c.nom || "";
  const med = h.querySelector("#medailleH");
  if(med) med.textContent = c.logo || "★";
  const n = document.createElement("nav");
  n.className = "navBas";
  n.innerHTML = PAGES_NAV.map(p =>
    `<a href="${p.url}" class="${p.id===actif?'actif':''}">${icone(p.ic,"icoNav")}${p.label}</a>`
  ).join("");
  document.body.append(n);
  majStatutHeader();
  if(typeof majBarreXPHeader==="function") setTimeout(majBarreXPHeader, 60);
}

/* phrase de statut : « Ouvert · séance à 20h00 » */
function phraseStatut(){
  const st = (typeof statutCinema==="function") ? statutCinema() : {code:"ferme", pastille:"ferme"};
  const c = Etat.cinema || {};
  const seances = (Etat.seancesJour || []).slice().sort((a,b)=>(a.heure||"").localeCompare(b.heure||""));
  let txt;
  if(st.code === "travaux_total") txt = "Fermé pour travaux";
  else if(st.code === "travaux_partiel") txt = "Ouvert · travaux en cours";
  else if(st.code === "ferme") txt = "Fermé · jour " + (c.jour||1);
  else if(seances.length) txt = "Ouvert · séance à " + seances[0].heure;
  else txt = "Ouvert · aucune séance au programme";
  return {txt, pastille:st.pastille};
}

function majStatutHeader(){
  const pas = document.getElementById("pastilleH");
  const eta = document.getElementById("etatH");
  if(!pas || !eta) return;
  const p = phraseStatut();
  pas.className = "pastilleH " + (p.pastille==="ouvert" ? "" : p.pastille==="travaux" ? "travauxH" : "fermeH");
  eta.className = "etatH " + (p.pastille==="ouvert" ? "" : p.pastille==="travaux" ? "travaux" : "ferme");
  /* on garde la pastille et on n'écrit que le texte à côté */
  let libelle = eta.querySelector(".libelleH");
  if(!libelle){
    libelle = document.createElement("span");
    libelle.className = "libelleH";
    eta.appendChild(libelle);
  }
  libelle.textContent = p.txt;
}
setInterval(()=>{ if(document.getElementById("etatH")) majStatutHeader(); }, 30000);

function majHeaderArgent(){
  const el = document.getElementById("statArgent");
  if(el && Etat.cinema) el.textContent = fmtArgent(Etat.cinema.argent);
}

/* Bob compact pour les pages secondaires : bobCompact("texte du conseil") */
function bobCompact(texte){
  const d = document.createElement("div");
  d.className = "bobMini";
  d.innerHTML = `
    <span class="bobMiniTete"><svg viewBox="30 40 60 60">
      <circle cx="60" cy="70" r="26" fill="#f0c9a0"/>
      <path d="M40 78 Q50 86 60 79 Q70 86 80 78 Q72 92 60 84 Q48 92 40 78" fill="#4a3527"/>
      <path d="M44 60 Q51 55 57 59 M63 59 Q69 55 76 60" stroke="#4a3527" stroke-width="4" fill="none" stroke-linecap="round"/>
      <circle cx="51" cy="66" r="2.6" fill="#1c1210"/><circle cx="69" cy="66" r="2.6" fill="#1c1210"/>
      <path d="M34 56 Q60 34 86 56 L86 50 Q60 28 34 50 Z" fill="#571520"/>
      <rect x="52" y="44" width="16" height="7" rx="2" fill="#e8b84b"/>
    </svg></span>
    <span class="bobMiniTxt">${texte}</span>`;
  return d;
}

/* ---- exports ---- */
export {
  PAGES_NAV,
  bobCompact,
  initNavigation,
  majHeaderArgent,
  majStatutHeader,
  phraseStatut
};
