import { parleBob, spawnSpectateur } from "../cinema.js?v=2ab9afab";
import { proprete } from "../engine/simulation.js?v=2ab9afab";
import { SVG_NS, meteoDuJour, ouvreLesPortes, planifie } from "./life.js?v=2ab9afab";
import { silhouette2 } from "./pedestrians.js?v=2ab9afab";
import { Etat } from "../game-state.js?v=2ab9afab";
import { niveauActuel } from "../progression.js?v=2ab9afab";
import { salles } from "../rooms.js?v=2ab9afab";
import { intervalle } from "../screenings.js?v=2ab9afab";

/* ============================================================
   VITALITÉ — la façade raconte l'état réel du cinéma.
   Rien n'est décoratif : chaque silhouette, chaque objet posé
   sur le trottoir est la conséquence d'une décision du joueur.
   ============================================================ */

/* ------------------------------------------------------------
   1. LE POULS — on lit l'état officiel, jamais une valeur inventée
   ------------------------------------------------------------ */
function poulsDuCinema(){
  const c = Etat.cinema || {};
  const salles = Etat.salles || [];
  const seances = Etat.seancesJour || [];
  const bilan = Etat.journee?.resultats || null;
  const niveau = (typeof niveauActuel === "function") ? niveauActuel() : 1;

  const capacite = salles.reduce((n,s)=>n + (Number(s.capacite)||0), 0) || 60;
  const spectateurs = Number(bilan?.total_spectateurs || 0);
  const remplissage = bilan ? Math.min(1, spectateurs / Math.max(1, capacite * Math.max(1, seances.length)))
                            : null;
  const satisfaction = bilan ? Number(bilan.satisfaction_moyenne || 0) : null;
  const reputation = Number(c.reputation ?? 50);
  const proprete = salles.length
    ? salles.reduce((n,s)=>n + Number(s.proprete ?? 100), 0) / salles.length : 100;
  const confort = salles.length
    ? salles.reduce((n,s)=>n + Number(s.confort ?? 0), 0) / salles.length : 0;

  /* affluence : ce qui décide du nombre de passants et du rythme */
  let affluence = 0.25 + reputation / 200;              /* réputation = notoriété du lieu */
  if(remplissage != null) affluence += remplissage * 0.45;
  if(seances.length === 0) affluence *= 0.45;           /* écran éteint : la rue se vide */
  const h = new Date().getHours();
  if(h >= 18 && h < 23) affluence *= 1.35;              /* l'heure des séances */
  if(h >= 0 && h < 8)  affluence *= 0.3;
  const meteo = (typeof meteoDuJour === "function") ? meteoDuJour() : "clair";
  if(meteo === "pluie") affluence *= 0.85;
  if(meteo === "clair" && h >= 12 && h < 18) affluence *= 0.9;
  affluence = Math.max(0.12, Math.min(1.4, affluence));

  /* attirance : la probabilité qu'un passant pousse la porte */
  let attirance = 0.10 + reputation / 400;
  if(satisfaction != null) attirance += (satisfaction - 50) / 300;
  if(seances.length === 0) attirance = 0.02;
  if(proprete < 55) attirance -= 0.05;
  attirance = Math.max(0.02, Math.min(0.55, attirance));

  return {
    niveau, reputation, satisfaction, remplissage, spectateurs, proprete, confort,
    affluence, attirance, meteo,
    seances: seances.length,
    ouvert: !!bilan,
    comble: !!bilan?.salle_complete,
    confiserie: !!Etat.confiserie?.active,
    perso: Etat.perso || {},
    heure: h
  };
}

/* ------------------------------------------------------------
   2. LES PETITES SCÈNES — chacune a une cause dans le jeu
   ------------------------------------------------------------ */
const SCENES = [
  {
    cle:"file_attente",
    quand:p => p.seances > 0 && p.heure >= 17 && p.heure < 23 && p.affluence > .7,
    poids:p => p.affluence * 3,
    joue:jouerFileAttente,
    bob:"Il y a une file devant le guichet. Une vraie. Avec des gens dedans."
  },
  {
    cle:"sortie_contents",
    quand:p => p.ouvert && p.satisfaction != null && p.satisfaction >= 72,
    poids:p => 2.5,
    joue:p => jouerSortie(p, "content"),
    bob:"Ils sortent en parlant du film. C'est le meilleur bruit du métier."
  },
  {
    cle:"sortie_decus",
    quand:p => p.ouvert && p.satisfaction != null && p.satisfaction < 48,
    poids:() => 2,
    joue:p => jouerSortie(p, "decu"),
    bob:"Deux spectateurs sont sortis avant la fin. Je n'ai rien dit, mais j'ai noté."
  },
  {
    cle:"couple_hesite",
    quand:p => p.seances > 0 && p.attirance > .12,
    poids:p => 2 - p.attirance * 2,
    joue:jouerCoupleHesitant,
    bob:"Ils lisent l'affiche depuis cinq minutes. Ça se joue à pas grand-chose."
  },
  {
    cle:"photo_facade",
    quand:p => p.reputation >= 72,
    poids:() => 1.2,
    joue:jouerPhoto,
    bob:"Quelqu'un a pris notre façade en photo. On est devenus un décor."
  },
  {
    cle:"balayeur",
    quand:p => p.proprete < 60,
    poids:() => 2.4,
    joue:jouerBalayeur,
    bob:"J'ai sorti le balai. Le hall commençait à parler tout seul."
  },
  {
    cle:"enfant_affiche",
    quand:p => p.seances > 0,
    poids:() => 1,
    joue:jouerEnfant,
    bob:"Un enfant montre l'affiche du doigt. C'est comme ça que ça commence."
  }
];

/* ------------------------------------------------------------
   3. LES PNJ — marcher, attendre, entrer, sortir
   ------------------------------------------------------------ */
const X_PORTE = 240, Y_TROTTOIR = 452, Y_MILIEU = 424;

/* silhouette réutilisée depuis la façade, posée à un endroit précis */
function poseSilhouette(cible, x, y, k, opts = {}){
  const g = document.createElementNS(SVG_NS, "g");
  const s = silhouette2();
  const sens = opts.sens || 1;
  g.setAttribute("class", "pnj " + (opts.classe || ""));
  g.setAttribute("opacity", opts.opacite ?? 1);
  g.innerHTML = `<g transform="translate(${x} ${y}) scale(${(k*sens).toFixed(3)} ${k})">
    <ellipse cx="0" cy="0.5" rx="6.5" ry="1.8" fill="#000" opacity=".28"/>
    ${s.html}</g>`;
  cible.appendChild(g);
  return g;
}

function calqueVie(){
  return document.getElementById("planProche") || document.querySelector("#facade svg");
}

/* --- file d'attente au guichet : des gens qui patientent vraiment --- */
function jouerFileAttente(p){
  const cible = calqueVie(); if(!cible) return;
  const n = Math.min(5, 2 + Math.round(p.affluence * 3));
  const groupe = document.createElementNS(SVG_NS, "g");
  groupe.setAttribute("class", "fileAttente");
  cible.appendChild(groupe);

  for(let i = 0; i < n; i++){
    const g = poseSilhouette(groupe, X_PORTE - 62 - i*19, Y_TROTTOIR, 1.55,
      {sens:1, classe:"patiente"});
    g.style.animationDelay = (i * 0.7).toFixed(1) + "s";
    /* chacun avance d'un cran, puis entre */
    planifie(()=>{
      g.classList.add("avance");
      g.style.setProperty("--dx", (i*19 + 48) + "px");
    }, 2600 + i * 2200);
    planifie(()=>{
      if(typeof ouvreLesPortes === "function") ouvreLesPortes();
      g.classList.add("entre");
    }, 3400 + i * 2200);
    planifie(()=>g.remove(), 5200 + i * 2200);
  }
  planifie(()=>groupe.remove(), 5600 + n * 2200);
}

/* --- sortie de séance : ils repartent en discutant, ou en grimaçant --- */
function jouerSortie(p, humeur){
  const cible = calqueVie(); if(!cible) return;
  const n = 2 + Math.floor(Math.random() * 2);
  for(let i = 0; i < n; i++){
    planifie(()=>{
      if(typeof ouvreLesPortes === "function" && i === 0) ouvreLesPortes();
      const sens = Math.random() < .5 ? 1 : -1;
      const g = poseSilhouette(cible, X_PORTE, Y_TROTTOIR, 1.55,
        {sens, classe:"sort " + humeur});
      g.style.setProperty("--fin", (sens > 0 ? 290 : -290) + "px");
      g.style.animationDuration = (5 + Math.random()*2).toFixed(1) + "s";
      /* un popcorn à la main si la confiserie tourne */
      if(p.confiserie && Math.random() < .5){
        const b = document.createElementNS(SVG_NS, "g");
        b.innerHTML = `<g transform="translate(${X_PORTE} ${Y_TROTTOIR}) scale(${2*sens} 2)">
          <rect x="5.5" y="-19" width="5" height="7" rx="1" fill="#e8443a"/>
          <g fill="#fdf3d2"><circle cx="6.8" cy="-19.6" r="1.5"/><circle cx="9" cy="-20" r="1.6"/></g></g>`;
      }
      planifie(()=>g.remove(), 7500);
    }, i * 900);
  }
}

/* --- le couple qui hésite : il lit l'affiche, puis décide --- */
function jouerCoupleHesitant(p){
  const cible = calqueVie(); if(!cible) return;
  const cote = Math.random() < .5 ? -1 : 1;
  const x = X_PORTE + cote * 112;   /* devant une affiche */
  const groupe = document.createElementNS(SVG_NS, "g");
  cible.appendChild(groupe);

  const a = poseSilhouette(groupe, x - 9, Y_TROTTOIR, 1.5, {sens:1, classe:"regarde"});
  const b = poseSilhouette(groupe, x + 9, Y_TROTTOIR, 1.46, {sens:-1, classe:"regarde"});
  b.style.animationDelay = ".9s";

  /* la décision dépend de l'attirance réelle du cinéma */
  const entrent = Math.random() < (p.attirance * 1.8);
  planifie(()=>{
    if(entrent){
      if(typeof ouvreLesPortes === "function") ouvreLesPortes();
      [a,b].forEach((g,i)=>{
        g.classList.add("marcheVers");
        g.style.setProperty("--dx", (X_PORTE - x - (i?9:-9)) + "px");
        planifie(()=>g.classList.add("entre"), 2200);
      });
      planifie(()=>groupe.remove(), 3400);
    }else{
      [a,b].forEach(g=>{
        g.classList.add("marcheVers");
        g.style.setProperty("--dx", (cote * 270) + "px");
      });
      planifie(()=>groupe.remove(), 4200);
    }
  }, 4200);
}

/* --- la photo de la façade : uniquement si le cinéma est réputé --- */
function jouerPhoto(p){
  const cible = calqueVie(); if(!cible) return;
  const g = poseSilhouette(cible, X_PORTE - 130, Y_TROTTOIR, 1.55, {sens:1, classe:"photographe"});
  planifie(()=>{
    const flash = document.createElementNS(SVG_NS, "rect");
    flash.setAttribute("x","0"); flash.setAttribute("y","0");
    flash.setAttribute("width","480"); flash.setAttribute("height","520");
    flash.setAttribute("fill","#fff"); flash.setAttribute("class","flashPhoto");
    flash.setAttribute("pointer-events","none");
    (document.querySelector("#facade svg") || cible).appendChild(flash);
    planifie(()=>flash.remove(), 500);
  }, 2400);
  planifie(()=>{ g.classList.add("marcheVers"); g.style.setProperty("--dx","260px"); }, 3600);
  planifie(()=>g.remove(), 8200);
}

/* --- le balayeur : il n'apparaît que si les salles sont sales --- */
function jouerBalayeur(p){
  const cible = calqueVie(); if(!cible) return;
  const g = poseSilhouette(cible, X_PORTE - 38, Y_TROTTOIR, 1.6, {sens:1, classe:"balaie"});
  const balai = document.createElementNS(SVG_NS,"g");
  balai.setAttribute("class","balai");
  balai.innerHTML = `<g transform="translate(${X_PORTE - 30} ${Y_TROTTOIR}) scale(1.6)">
    <line x1="0" y1="-22" x2="7" y2="-1" stroke="#8a6238" stroke-width="1.4"/>
    <rect x="4" y="-2" width="8" height="2.6" rx="1" fill="#c9a86a"/></g>`;
  cible.appendChild(balai);
  planifie(()=>{ g.remove(); balai.remove(); }, 16000);
}

/* --- l'enfant qui montre l'affiche --- */
function jouerEnfant(p){
  const cible = calqueVie(); if(!cible) return;
  const cote = Math.random() < .5 ? -1 : 1;
  const x = X_PORTE + cote * 108;
  const g = poseSilhouette(cible, x, Y_TROTTOIR, 1.15, {sens:cote > 0 ? -1 : 1, classe:"montre"});
  planifie(()=>{ g.classList.add("marcheVers"); g.style.setProperty("--dx", (cote*200)+"px"); }, 4800);
  planifie(()=>g.remove(), 9200);
}

/* ------------------------------------------------------------
   4. LES OBJETS QUI APPARAISSENT AVEC LES DÉBLOCAGES
   ------------------------------------------------------------ */
function poseObjetsDebloques(svg, p){
  const g = document.createElementNS(SVG_NS, "g");
  g.setAttribute("class", "objetsDebloques");
  g.setAttribute("pointer-events","none");
  let html = "";

  /* enseigne « CONFISERIE » quand le comptoir est ouvert */
  if(p.confiserie){
    html += `<g class="apparait enseigneConf" transform="translate(348 246)">
      <rect x="0" y="0" width="58" height="20" rx="3" fill="#1c1018" stroke="#caa24a" stroke-width="1.6"/>
      <text x="29" y="14" text-anchor="middle" font-family="Courier New" font-size="8"
        letter-spacing="1.4" fill="#e8b84b">CONFISERIE</text>
      <circle cx="6" cy="-4" r="2" fill="#ffdf9a" class="amp a0"/>
      <circle cx="52" cy="-4" r="2" fill="#ffdf9a" class="amp a2"/>
    </g>`;
  }
  /* pancarte COMPLET après une salle comble */
  if(p.comble){
    html += `<g class="apparait pancarteComplet" transform="translate(300 296) rotate(-6)">
      <rect x="0" y="0" width="52" height="24" rx="2" fill="#f2e8d5" stroke="#8c2331" stroke-width="2"/>
      <text x="26" y="16" text-anchor="middle" font-family="Georgia" font-weight="bold"
        font-size="11" letter-spacing="1" fill="#8c2331">COMPLET</text>
    </g>`;
  }
  /* banderole pendant un festival communautaire */
  if(Etat.festivalActif){
    html += `<g class="apparait banderole">
      <path d="M62 128 Q240 156 418 128" stroke="#caa24a" stroke-width="2" fill="none"/>
      ${[...Array(11)].map((_,i)=>{
        const x = 70 + i*32, y = 132 + Math.sin(i/1.7)*10;
        const c = ["#e8443a","#e8b84b","#5fd8c8","#a83a5c"][i%4];
        return `<path d="M${x} ${y} l6 11 l-6 9 l-6 -9 Z" fill="${c}" opacity=".85"
          class="fanion f${i%3}"/>`;}).join("")}
    </g>`;
  }
  if(!html) return;
  g.innerHTML = html;
  svg.appendChild(g);
}

/* ------------------------------------------------------------
   5. LE CHEF D'ORCHESTRE
   ------------------------------------------------------------ */
let poulsCourant = null;

function animeLaVitalite(){
  const svg = document.querySelector("#facade svg");
  if(!svg) return null;
  poulsCourant = poulsDuCinema();
  poseObjetsDebloques(svg, poulsCourant);
  lancePassants(poulsCourant);
  lanceScenes(poulsCourant);
  return poulsCourant;
}

/* la rue se remplit à hauteur de la notoriété du cinéma */
function lancePassants(p){
  const intervalle = Math.round(3400 / Math.max(.15, p.affluence));
  const boucle = ()=>{
    if(!document.hidden){
      spawnSpectateurVivant(p);
      /* aux heures de séance, parfois deux d'un coup */
      if(p.affluence > .9 && Math.random() < .35) planifie(()=>spawnSpectateurVivant(p), 700);
    }
    planifie(boucle, intervalle * (0.7 + Math.random()*0.6));
  };
  planifie(boucle, 600);
  for(let i = 0; i < Math.round(p.affluence * 4); i++)
    planifie(()=>spawnSpectateurVivant(p), 300 + i*520);
}

/* un passant sur N pousse la porte, selon l'attirance réelle */
function spawnSpectateurVivant(p){
  if(typeof spawnSpectateur !== "function") return;
  window.__attirance = p.attirance;   /* lu par spawnSpectateur */
  spawnSpectateur();
}

/* les scènes se déclenchent selon ce que le joueur a fait */
function lanceScenes(p){
  const eligibles = SCENES.filter(s=>s.quand(p));
  if(eligibles.length === 0) return;

  const boucle = ()=>{
    if(!document.hidden){
      const total = eligibles.reduce((n,s)=>n + s.poids(p), 0);
      let r = Math.random() * total, choisie = eligibles[0];
      for(const s of eligibles){ r -= s.poids(p); if(r <= 0){ choisie = s; break; } }
      choisie.joue(p);
      /* une scène sur trois s'accompagne d'un mot de Bob */
      if(choisie.bob && Math.random() < .34 && typeof parleBob === "function")
        planifie(()=>parleBob("« " + choisie.bob + " »"), 2600);
    }
    planifie(boucle, 17000 + Math.random()*16000);
  };
  planifie(boucle, 4500 + Math.random()*4000);
}

/* ------------------------------------------------------------
   6. CE QUE BOB DIT DE L'ÉTAT DU CINÉMA
   ------------------------------------------------------------ */
function remarqueVitalite(){
  const p = poulsCourant || poulsDuCinema();
  if(p.seances === 0) return "Le trottoir est vide. Sans programme, personne ne s'arrête.";
  if(p.comble) return "Après hier soir, ils reviennent. On a une réputation à tenir maintenant.";
  if(p.satisfaction != null && p.satisfaction < 48)
    return "Il y a moins de monde qu'avant. Le bouche-à-oreille marche dans les deux sens.";
  if(p.reputation >= 75) return "Regarde la rue. Ils ralentissent tous en passant devant chez nous.";
  if(p.proprete < 60) return "On aurait besoin d'un coup de balai avant que ça se voie de dehors.";
  if(p.affluence > .9) return "Belle affluence dehors. C'est l'heure où le quartier sort.";
  return null;
}

/* ---- exports ---- */
export {
  SCENES,
  X_PORTE,
  animeLaVitalite,
  calqueVie,
  jouerBalayeur,
  jouerCoupleHesitant,
  jouerEnfant,
  jouerFileAttente,
  jouerPhoto,
  jouerSortie,
  lancePassants,
  lanceScenes,
  poseObjetsDebloques,
  poseSilhouette,
  poulsCourant,
  poulsDuCinema,
  remarqueVitalite,
  spawnSpectateurVivant
};
