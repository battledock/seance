import { echappe } from "../ui/emblems.js?v=2ab9afab";
import { icone } from "../ui/icons.js?v=2ab9afab";
import { couleurSieges } from "./customization.js?v=2ab9afab";
import { debloque, niveauActuel } from "../progression.js?v=2ab9afab";
import { salles } from "../rooms.js?v=2ab9afab";

/* ============================================================
   CONFIGURATION CENTRALE DES AMÉLIORATIONS
   Un seul endroit pour les coûts, niveaux requis et effets.
   Ajouter un niveau 4/5 = ajouter une entrée dans le tableau.
   ============================================================ */

const TYPES_SALLES = {
  standard: {nom:"Standard",  niveauRequis:1,  capaciteMax:120, desc:"La salle de quartier, sobre et fidèle."},
  familiale:{nom:"Familiale", niveauRequis:18, capaciteMax:160, desc:"Grands rangs, sièges larges, écran bas."},
  auteur:   {nom:"Auteur",    niveauRequis:22, capaciteMax:80,  desc:"Petite salle feutrée pour cinéphiles exigeants."},
  premium:  {nom:"Premium",   niveauRequis:29, capaciteMax:100, desc:"Confort supérieur, places vendues plus cher."},
  prestige: {nom:"Prestige",  niveauRequis:38, capaciteMax:200, desc:"Le grand écrin. Lustres compris."}
};

const AMELIORATIONS = {
  sieges: {
    nom:"Sièges", icone:"fauteuil", cleProgression:["confort_1","sieges_club"],
    niveaux:[
      {niveau:0, nom:"Fauteuils usés",      desc:"Dépareillés, grinçants, attachants.",           cout:0,    satisfaction:0},
      {niveau:1, nom:"Fauteuils restaurés", desc:"Velours rouge remis à neuf.",                   cout:300,  satisfaction:4,  niveauJoueurRequis:4},
      {niveau:2, nom:"Fauteuils confort",   desc:"Plus larges, plus profonds.",                   cout:900,  satisfaction:8,  niveauJoueurRequis:13},
      {niveau:3, nom:"Fauteuils premium",   desc:"Accoudoirs dorés, dossiers inclinables.",       cout:2500, satisfaction:13, niveauJoueurRequis: 18, prixAcceptable:1}
    ]
  },
  ecran: {
    nom:"Écran", icone:"camera", cleProgression:["ecran_sup","ecran_pano","ecran_geant"],
    niveaux:[
      {niveau:0, nom:"Écran ancien",          desc:"Une tache dans le coin depuis 1978.",         cout:0,    satisfaction:0},
      {niveau:1, nom:"Écran restauré",        desc:"Propre, lumineux, enfin blanc.",              cout:500,  satisfaction:3,  niveauJoueurRequis:9,  reputation:1},
      {niveau:2, nom:"Écran haute luminosité",desc:"Les noirs sont noirs, les blancs éclatants.", cout:1500, satisfaction:6,  niveauJoueurRequis: 16},
      {niveau:3, nom:"Projection premium",    desc:"On voit les pores. C'est peut-être trop.",    cout:4000, satisfaction:10, niveauJoueurRequis: 32, reputation:1}
    ]
  },
  son: {
    nom:"Son", icone:"cloche", cleProgression:["son_surround","son_dolby"],
    niveaux:[
      {niveau:0, nom:"Son mono ancien",   desc:"Un haut-parleur. Courageux.",                     cout:0,    satisfaction:0},
      {niveau:1, nom:"Son stéréo restauré",desc:"Deux canaux, deux fois plus d'émotion.",         cout:450,  satisfaction:3,  niveauJoueurRequis:6},
      {niveau:2, nom:"Son immersif",      desc:"Le son vient de partout. Surtout de derrière.",   cout:1700, satisfaction:7,  niveauJoueurRequis: 16},
      {niveau:3, nom:"Son prestige",      desc:"Les murs tremblent, les voisins écrivent.",       cout:4500, satisfaction:11, niveauJoueurRequis: 26, reputation:1}
    ]
  },
  climatisation: {
    nom:"Climatisation", icone:"outil", cleProgression:[],
    niveaux:[
      {niveau:0, nom:"Ventilateur de Bob",  desc:"Il tourne. Parfois dans le bon sens.",          cout:0,    satisfaction:0},
      {niveau:1, nom:"Ventilation réparée", desc:"L'air circule enfin.",                          cout:350,  satisfaction:2,  niveauJoueurRequis:6,  meteo:0.5},
      {niveau:2, nom:"Climatisation",       desc:"Fraîche l'été, tiède l'hiver.",                 cout:1200, satisfaction:5,  niveauJoueurRequis:14, meteo:0.75},
      {niveau:3, nom:"Contrôle thermique",  desc:"Vingt degrés, toute l'année, sans discuter.",   cout:3500, satisfaction:8,  niveauJoueurRequis: 22, meteo:1}
    ]
  },
  decoration: {
    nom:"Décoration", icone:"etoile", cleProgression:["deco_hall"],
    niveaux:[
      {niveau:0, nom:"Murs défraîchis",     desc:"Le beige d'origine. Enfin, ce qu'il en reste.", cout:0,    satisfaction:0},
      {niveau:1, nom:"Décoration classique",desc:"Cadres, affiches anciennes, une plante.",       cout:250,  satisfaction:2,  niveauJoueurRequis:3},
      {niveau:2, nom:"Décoration Art déco", desc:"Moulures, dorures, géométrie.",                 cout:700,  satisfaction:4,  niveauJoueurRequis:7,  reputation:1},
      {niveau:3, nom:"Décoration prestige", desc:"Éclairage indirect et velours mural.",          cout:2000, satisfaction:7,  niveauJoueurRequis: 13, reputation:1}
    ]
  }
};

/* extensions de capacité : une seule fois chacune */
const EXTENSIONS_CAPACITE = [
  {niveau:1, places:10, cout:600,  niveauJoueurRequis:6},
  {niveau:2, places:15, cout:1500, niveauJoueurRequis:12},
  {niveau:3, places:20, cout:4000, niveauJoueurRequis:22}
];

/* construction de salles */
const CONSTRUCTION_SALLES = [
  {index:2, cout:3500,  capacite:40, cleProgression:"salle_2"},
  {index:3, cout:9000,  capacite:50, cleProgression:"salle_3"},
  {index:4, cout:18000, capacite:60, cleProgression:"salle_4"},
  {index:5, cout:32000, capacite:70, cleProgression:"salle_5"}
];

const COUT_NETTOYAGE = 25;
function coutReparation(salle){ return Math.ceil((100 - Number(salle.etat ?? 100)) * 5); }

/* ============================================================
   BONUS — source unique de vérité, lue par la simulation
   ============================================================ */
function niveauEquipement(salle, cle){
  const map = {sieges:"confort", ecran:"ecran", son:"son", climatisation:"clim_niveau", decoration:"deco"};
  return Math.max(0, Math.min(3, Number(salle[map[cle]] ?? 0)));
}
function paletteNiveau(cle, niveau){ return AMELIORATIONS[cle].niveaux[Math.max(0,Math.min(3,niveau))]; }

function obtenirBonusSalle(salle){
  let satisfaction = 0, prixAcceptable = 0, reputation = 0, meteo = 0;
  Object.keys(AMELIORATIONS).forEach(cle=>{
    const n = paletteNiveau(cle, niveauEquipement(salle, cle));
    satisfaction   += n.satisfaction || 0;
    prixAcceptable += n.prixAcceptable || 0;
    reputation     += n.reputation || 0;
    meteo           = Math.max(meteo, n.meteo || 0);
  });
  return {satisfaction, prixAcceptable, reputation, protectionMeteo:meteo,
          risqueIncident: calculerRisqueIncident(salle)};
}

/* propreté et état pilotent le risque d'incident */
function calculerRisqueIncident(salle){
  const prop = Number(salle.proprete ?? 100);
  const etat = Number(salle.etat ?? 100);
  let r = 0.04;                       /* base */
  if(prop < 40) r += 0.06;
  else if(prop < 70) r += 0.02;
  if(etat < 50) r += 0.07;
  else if(etat < 75) r += 0.02;
  r -= obtenirBonusSalle.__sansRecursion ? 0 : 0;   /* garde-fou */
  return Math.max(0.01, Math.min(0.25, r));
}
function libelleRisque(r){
  if(r <= 0.05) return "faible";
  if(r <= 0.10) return "modéré";
  if(r <= 0.16) return "élevé";
  return "critique";
}

/* malus de satisfaction lié à la saleté */
function malusProprete(salle){
  const p = Number(salle.proprete ?? 100);
  if(p >= 70) return 0;
  if(p >= 40) return -4;
  return -9;
}

/* ============================================================
   DISPONIBILITÉ D'UNE AMÉLIORATION
   Renvoie {possible, raison, prochain}
   ============================================================ */
function prochaineAmelioration(salle, cle){
  const actuel = niveauEquipement(salle, cle);
  if(actuel >= 3) return {possible:false, raison:"max", actuel, prochain:null};
  const prochain = AMELIORATIONS[cle].niveaux[actuel + 1];
  const niv = typeof niveauActuel === "function" ? niveauActuel() : 1;
  if(niv < prochain.niveauJoueurRequis)
    return {possible:false, raison:"niveau", actuel, prochain, niveauRequis:prochain.niveauJoueurRequis};
  return {possible:true, actuel, prochain};
}

function prochaineExtension(salle){
  const fait = Number(salle.extensions ?? 0);
  if(fait >= EXTENSIONS_CAPACITE.length) return {possible:false, raison:"max"};
  const ext = EXTENSIONS_CAPACITE[fait];
  const niv = typeof niveauActuel === "function" ? niveauActuel() : 1;
  const type = TYPES_SALLES[salle.type || "standard"];
  if(Number(salle.capacite) + ext.places > type.capaciteMax)
    return {possible:false, raison:"capacite_max", ext};
  if(niv < ext.niveauJoueurRequis) return {possible:false, raison:"niveau", ext, niveauRequis:ext.niveauJoueurRequis};
  return {possible:true, ext};
}

/* ============================================================
   APPARENCE — la salle et la façade changent avec les niveaux
   ============================================================ */
function obtenirNiveauVisuelCinema(cinema, salles){
  const s = salles || [];
  const moy = cle => s.length ? s.reduce((t,x)=>t+niveauEquipement(x,cle),0)/s.length : 0;
  const propMoy = s.length ? s.reduce((t,x)=>t+Number(x.proprete ?? 100),0)/s.length : 100;
  return {
    salles: s.length,
    aile: s.length >= 2,                                   /* aile visible sur la façade */
    deco: Math.round(moy("decoration")),                   /* 0-3 : cadres, moulures, éclairage */
    eclairage: Math.round(moy("ecran")),                   /* enseigne plus lumineuse */
    entretien: Math.round(propMoy),                        /* façade plus ou moins propre */
    affiches: 2 + (typeof debloque==="function" && debloque("affiche_3") ? 1 : 0)
                + (typeof debloque==="function" && debloque("affiche_4") ? 1 : 0),
    decoExterieure: typeof debloque==="function" && debloque("deco_exterieur"),
    enseignePerso: typeof debloque==="function" && debloque("enseigne")
  };
}

/* aperçu SVG d'une salle, variable selon les équipements */
/* Vue d'une salle. En mode public, `salle.visuel` fournit les niveaux
   sans exposer la propreté ni l'état réels. */
function apercuSalle(salle, opts = {}){
  const v = salle.visuel || null;
  const nSieges = v ? Math.max(0,Math.min(3,v.sieges||0)) : niveauEquipement(salle,"sieges");
  const nEcran  = v ? Math.max(0,Math.min(3,v.ecran||0))  : niveauEquipement(salle,"ecran");
  const nDeco   = v ? Math.max(0,Math.min(3,v.deco||0))   : niveauEquipement(salle,"decoration");
  const prop    = v ? 100 : Number(salle.proprete ?? 100);   /* jamais de propreté publique */

  const murs   = ["#3a2f36","#43323c","#4a2f3e","#55283f"][nDeco];
  const teinte = opts.couleurSieges || (salle.visuel && salle.visuel.couleurSieges);
  const base   = teinte ? couleurParCle(teinte)
    : ((typeof couleurSieges === "function" && nSieges >= 1) ? couleurSieges() : null);
  const velours= base || ["#6b5a52","#8c2331","#a82b3d","#b8324a"][nSieges];
  const ecranC = ["#c9c2b0","#e8e2d0","#f6f2e4","#ffffff"][nEcran];
  const largeurEcran = [92, 100, 116, 130][nEcran];
  const lueur = nEcran >= 1 ? `<ellipse cx="110" cy="52" rx="${largeurEcran*0.7}" ry="26" fill="#fff" opacity="${.06+nEcran*.05}"/>` : "";
  const salete = prop < 70 ? `<g fill="#3a2a18" opacity="${prop<40?.28:.14}">
      <ellipse cx="52" cy="118" rx="13" ry="4"/><ellipse cx="168" cy="126" rx="10" ry="3"/>
      <ellipse cx="110" cy="132" rx="16" ry="4"/></g>` : "";

  /* décoration murale */
  let deco = "";
  if(nDeco >= 1) deco += `<rect x="14" y="60" width="16" height="20" rx="1.5" fill="none" stroke="#caa24a" stroke-width="1.5"/>
    <rect x="190" y="60" width="16" height="20" rx="1.5" fill="none" stroke="#caa24a" stroke-width="1.5"/>`;
  if(nDeco >= 2) deco += `<path d="M8 44 L212 44" stroke="#caa24a" stroke-width="2"/>
    <path d="M8 49 L212 49" stroke="#caa24a" stroke-width="1" opacity=".6"/>
    <path d="M20 44 L20 96 M200 44 L200 96" stroke="#caa24a" stroke-width="1.2" opacity=".5"/>`;
  if(nDeco >= 3) deco += `<g fill="#ffdf9a" opacity=".55">
    <ellipse cx="20" cy="100" rx="9" ry="16"/><ellipse cx="200" cy="100" rx="9" ry="16"/></g>`;

  /* rangs de fauteuils, plus larges avec le niveau */
  const largeurF = [11, 12, 14, 15][nSieges];
  const rangs = [ {y:104, n:7, s:1}, {y:120, n:8, s:1.12}, {y:138, n:8, s:1.26} ];
  let sieges = "";
  rangs.forEach(r=>{
    const l = largeurF * r.s, espace = l + 4;
    const total = r.n * espace;
    for(let i=0;i<r.n;i++){
      const x = 110 - total/2 + i*espace + espace/2;
      sieges += `<g transform="translate(${x} ${r.y})">
        <rect x="${-l/2}" y="-12" width="${l}" height="13" rx="3" fill="${velours}"/>
        <rect x="${-l/2}" y="0" width="${l}" height="5" rx="2" fill="${velours}" opacity=".75"/>
        ${nSieges>=3?`<rect x="${-l/2-1.6}" y="-8" width="1.6" height="9" rx="1" fill="#e8b84b"/>
                      <rect x="${l/2}" y="-8" width="1.6" height="9" rx="1" fill="#e8b84b"/>`:""}
        ${nSieges===0 && i%3===1?`<rect x="${-l/2}" y="-12" width="${l}" height="13" rx="3" fill="#5c4e46"/>`:""}
      </g>`;
    }
  });

  return `<svg viewBox="0 0 220 150" class="apercuSalle" xmlns="http://www.w3.org/2000/svg"
    role="img" aria-label="Vue de ${(salle.nom||"la salle").replace(/[<>&"]/g,"")}">
    <rect width="220" height="150" fill="${murs}"/>
    <path d="M0 96 L220 96 L220 150 L0 150 Z" fill="#241a20"/>
    ${deco}
    <rect x="${110-largeurEcran/2}" y="26" width="${largeurEcran}" height="${52+nEcran*3}" rx="2"
      fill="${ecranC}" stroke="#1a1216" stroke-width="2"/>
    ${nEcran===0?`<path d="M${110-largeurEcran/2+8} 40 L${110-largeurEcran/2+22} 62" stroke="#a89a86" stroke-width="2"/>`:""}
    ${lueur}
    ${sieges}
    ${salete}
  </svg>`;
}


/* couleur de fauteuil par clé (partagée avec la personnalisation) */
function couleurParCle(cle){
  const C = {rouge:"#a82b3d", bordeaux:"#6e1424", bleu:"#2a3a6b", vert:"#2a5a42"};
  return C[cle] || null;
}

/* ============================================================
   VUE PUBLIQUE D'UNE SALLE — lecture seule, mêmes composants
   ============================================================ */
function rendreSallePublique({room, currentScreening}){
  const seance = currentScreening || room.seance;
  const etat = !seance ? `<span class="spProgramme prive">Programme non communiqué</span>`
    : seance.enCours ? `<span class="spProgramme encours">${icone("pellicule")} Projection en cours — ${echappe(seance.titre)}</span>`
    : `<span class="spProgramme">${icone("horloge")} Prochaine séance ${echappe(seance.heure)} — ${echappe(seance.titre)}</span>`;
  return `<section class="carteEcran carteSallePublique">
    <h2>${echappe(room.nom)}<span class="capBadge">${icone("fauteuil")} ${Number(room.capacite)||0} places</span></h2>
    <div class="salleType">${echappe(typeSalleNom(room.type))}</div>
    ${room.description ? `<div class="spDesc">${echappe(room.description)}</div>` : ""}
    <div class="apercuBoite">${apercuSalle(room)}</div>
    <div class="grillePaliers">
      <div>${icone("fauteuil")}<span>Confort</span><b>${echappe(room.confortPalier||"—")}</b></div>
      <div>${icone("camera")}<span>Écran</span><b>${echappe(room.ecranPalier||"—")}</b></div>
      <div>${icone("cloche")}<span>Son</span><b>${echappe(room.sonPalier||"—")}</b></div>
      <div>${icone("etoile")}<span>Décor</span><b>${echappe(room.decoPalier||"—")}</b></div>
    </div>
    ${etat}
  </section>`;
}
function typeSalleNom(t){
  const T = {standard:"Standard", familiale:"Familiale", auteur:"Auteur",
             premium:"Premium", prestige:"Prestige"};
  return T[t] || "Standard";
}

/* ---- exports ---- */
export {
  AMELIORATIONS,
  CONSTRUCTION_SALLES,
  COUT_NETTOYAGE,
  EXTENSIONS_CAPACITE,
  TYPES_SALLES,
  apercuSalle,
  calculerRisqueIncident,
  couleurParCle,
  coutReparation,
  libelleRisque,
  malusProprete,
  niveauEquipement,
  obtenirBonusSalle,
  obtenirNiveauVisuelCinema,
  paletteNiveau,
  prochaineAmelioration,
  prochaineExtension,
  rendreSallePublique,
  typeSalleNom
};
