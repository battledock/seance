import { etatBatiment, murSelonEtat } from "./ages.js?v=becf21cb";
import {
  PALETTES,
  ampoules,
  decoupe,
  fenetreVoisin,
  pilastre
} from "./palettes.js?v=becf21cb";
import { A } from "../ui/genre-posters.js?v=becf21cb";

/* ============================================================
   FAÇADE ÉVOLUTIVE — le même bâtiment à travers six âges
   ============================================================ */



/* ------------------------------------------------------------
   LE VOISINAGE

   Deux blocs de couleur unie encadraient le cinéma. Un immeuble
   haussmannien n'est pas une masse plate : il a des bandeaux qui
   marquent les étages, des appuis de fenêtre, des balcons filants,
   une corniche. Ce sont ces lignes horizontales qui donnent
   l'échelle et disent « ville » plutôt que « décor ».
   ------------------------------------------------------------ */
function immeubleVoisin(x, y, l, h, P, cote, lum){
  const ETAGE = 38;
  const n = Math.floor((h - 20) / ETAGE);
  const teinte = P.immeubles[0];
  let out = `<rect x="${x}" y="${y}" width="${l}" height="${h}" fill="${teinte}"/>`;

  /* la face qui regarde le cinéma reçoit moins de jour */
  out += `<rect x="${cote === "g" ? x + l - 14 : x}" y="${y}" width="14" height="${h}"
    fill="#000" opacity=".18"/>`;
  out += `<rect x="${cote === "g" ? x : x + l - 8}" y="${y}" width="8" height="${h}"
    fill="#fff" opacity=".06"/>`;

  /* corniche : trois plans pour l'épaisseur */
  out += `<rect x="${x-3}" y="${y-7}" width="${l+6}" height="7" fill="${P.toit}"/>
    <rect x="${x-4}" y="${y-9}" width="${l+8}" height="3" fill="${P.toit}" opacity=".85"/>
    <rect x="${x-5}" y="${y-11}" width="${l+10}" height="2" fill="${P.toit}" opacity=".55"/>
    <rect x="${x-3}" y="${y}" width="${l+6}" height="2" fill="#000" opacity=".26"/>`;

  for(let i = 0; i < n; i++){
    const ye = y + 14 + i * ETAGE;
    /* bandeau d'étage : arête claire + creux sombre */
    out += `<rect x="${x}" y="${ye + 26}" width="${l}" height="3.5" fill="${P.toit}" opacity=".42"/>
      <rect x="${x}" y="${ye + 29.5}" width="${l}" height="1.4" fill="#000" opacity=".18"/>
      <rect x="${x}" y="${ye + 25}" width="${l}" height=".8" fill="#fff" opacity=".08"/>`;
    /* balcon filant un étage sur deux */
    if(i % 2 === 1){
      out += `<rect x="${x-2}" y="${ye + 22}" width="${l+4}" height="2.4" fill="${P.toit}" opacity=".55"/>`;
      for(let b = 0; b < Math.floor(l / 7); b++)
        out += `<rect x="${(x + 3 + b * 7).toFixed(1)}" y="${ye + 16}" width="1.1" height="6"
          fill="${P.toit}" opacity=".46"/>`;
      /* main courante avec liseré : le fer forgé attrape la lumière */
      out += `<rect x="${x-2}" y="${ye + 15.4}" width="${l+4}" height=".8" fill="#000" opacity=".22"/>`;
    }
    /* appui de fenêtre : une simple barre horizontale qui pose l'étage */
    out += `<rect x="${x+4}" y="${ye + 4}" width="${l-8}" height="1.6" fill="${P.toit}" opacity=".3"/>`;
  }
  return out;
}

/* ------------------------------------------------------------
   L'APPAREIL DE PIERRE

   Le mur n'était qu'un dégradé barré de neuf traits horizontaux :
   à l'œil, une surface plastique. Une façade de 1930 est faite de
   blocs taillés, et ce qui la rend vivante n'est pas le joint mais
   la variation d'un bloc à l'autre — l'un plus clair, l'autre plus
   gris, un troisième piqué d'humidité.

   On pose donc un vrai appareil : assises régulières, joints
   décalés d'une rangée à l'autre, et une teinte propre à chaque
   pierre tirée d'une suite déterministe — la façade est toujours
   la même d'une visite à l'autre.
   ------------------------------------------------------------ */
function appareilPierre(x, y, l, h, M, P, usure, graine = 7){
  const HA = 26;                       /* hauteur d'assise */
  const LB = 44;                       /* longueur moyenne d'un bloc */
  const rangs = Math.ceil(h / HA);
  let out = "";
  let n = graine;
  const suite = ()=>{ n = (n * 1103515245 + 12345) & 0x7fffffff; return (n % 1000) / 1000; };

  for(let r = 0; r < rangs; r++){
    const yb = y + r * HA;
    const hb = Math.min(HA, y + h - yb);
    if(hb < 4) continue;
    /* une assise sur deux démarre à mi-bloc : les joints ne s'alignent pas */
    let xb = x - (r % 2 ? LB * .5 : 0);
    while(xb < x + l){
      const lb = LB * (.72 + suite() * .56);
      const x0 = Math.max(x, xb), x1 = Math.min(x + l, xb + lb);
      if(x1 - x0 > 3){
        const t = suite();
        /* la teinte du bloc : claire, neutre ou sourde */
        const ton = t < .3 ? "#fff" : t < .62 ? null : "#000";
        const force = t < .3 ? (.05 + t * .12)
                    : t < .62 ? 0
                    : (.04 + (t - .62) * .16);
        if(ton) out += `<rect x="${x0.toFixed(1)}" y="${yb.toFixed(1)}"
          width="${(x1-x0).toFixed(1)}" height="${hb.toFixed(1)}"
          fill="${ton}" opacity="${force.toFixed(3)}"/>`;
        /* piqûre d'humidité sur les pierres du bas */
        if(usure > .1 && suite() < .16 && yb > y + h * .55)
          out += `<ellipse cx="${(x0 + (x1-x0)*suite()).toFixed(1)}"
            cy="${(yb + hb * .7).toFixed(1)}" rx="${(4 + suite()*7).toFixed(1)}"
            ry="${(3 + suite()*4).toFixed(1)}" fill="#3a3020"
            opacity="${(.05 + usure * .09).toFixed(3)}"/>`;
      }
      xb += lb;
    }
  }

  /* les joints : creux en haut, lumière en bas — c'est ce relief
     minuscule qui fait lire la pierre plutôt que le papier peint */
  let joints = `<g>`;
  for(let r = 1; r < rangs; r++){
    const yb = y + r * HA;
    if(yb > y + h - 2) break;
    joints += `<path d="M${x} ${yb} L${x+l} ${yb}" stroke="#000" stroke-opacity=".13" stroke-width="1.1"/>`
            + `<path d="M${x} ${(yb+1).toFixed(1)} L${x+l} ${(yb+1).toFixed(1)}"
                 stroke="#fff" stroke-opacity=".05" stroke-width=".8"/>`;
  }
  /* joints verticaux, en quinconce */
  n = graine * 3;
  for(let r = 0; r < rangs; r++){
    const yb = y + r * HA, hb = Math.min(HA, y + h - yb);
    if(hb < 4) continue;
    let xb = x - (r % 2 ? LB * .5 : 0);
    while(xb < x + l){
      const lb = LB * (.72 + suite() * .56);
      xb += lb;
      if(xb > x + 2 && xb < x + l - 2)
        joints += `<path d="M${xb.toFixed(1)} ${yb.toFixed(1)} L${xb.toFixed(1)} ${(yb+hb).toFixed(1)}"
          stroke="#000" stroke-opacity=".10" stroke-width="1"/>`;
    }
  }
  joints += `</g>`;
  return out + joints;
}

/* ------------------------------------------------------------
   GÉOMÉTRIE ADAPTATIVE

   Le dessin ne se contente plus d'être rogné : il se recompose.
   Le bâtiment garde toujours la même taille apparente ; ce sont
   le ciel au-dessus et la route en dessous qui s'étirent ou se
   resserrent selon la forme de l'écran.

   ratio = largeur / hauteur de la zone visible.
     0.42 → écran très allongé (Redmi, S24 Ultra)
     0.56 → écran court (iPhone SE)
     0.75 → tablette
   ------------------------------------------------------------ */
function geometrieSelonEcran(ratio){
  const r = Math.max(.34, Math.min(.95, Number(ratio) || .48));

  /* le bâtiment et son trottoir : bloc incompressible, 480 × 400 */
  const LARGEUR = 480;
  const BLOC = 400;

  /* Hauteur d'un cadre qui épouserait exactement l'écran. On en
     retient 84 % : le dessin déborde donc légèrement sur les côtés,
     ce qui donne au bâtiment sa présence. Le rognage latéral ne
     mange que le bord des immeubles voisins, jamais le cinéma. */
  const exact = LARGEUR / r;
  let hauteur = Math.round(exact * .84);

  /* bornes : ni écrasé sur une tablette, ni étiré sur un mobile long */
  hauteur = Math.max(640, Math.min(920, hauteur));

  /* le reste se partage : le ciel prend la part du lion */
  const reste = hauteur - BLOC;
  let ciel  = Math.round(reste * .62);
  let route = reste - ciel;

  /* la route ne doit ni disparaître ni s'étaler */
  if(route < 46){ route = 46; ciel = reste - 46; }
  if(route > 132){ route = 132; ciel = reste - 132; }

  return {
    hauteur: BLOC + ciel + route,
    ciel, route,
    dy: ciel - 88
  };
}

function dessineFacadeEvolutive(opts = {}){
  const phase = opts.phase || "nuit";
  const G = geometrieSelonEcran(opts.ratio);
  const H = G.hauteur;
  const DY = G.dy;
  const CIEL = G.ciel;
  const BASROUTE = H - DY;       /* bas du cadre, en coordonnées locales */
  const HROUTE = BASROUTE - 466; /* hauteur de route disponible */
  /* Un nom de phase inattendu renvoyait undefined, et tout le dessin
     s'effondrait sur la première couleur lue. On retombe sur une
     palette valide : mieux vaut un ciel approximatif qu'un écran mort. */
  const P = PALETTES[phase] || PALETTES.aprem;
  const E = etatBatiment(opts.niveau || 1);
  const M = murSelonEtat(P, E);
  const lum = P.lumieres;
  const nomBrut = (opts.nom || "LE COSMOS").toUpperCase();
  const logo = opts.logo || "★";
  const seances = E.affiches ? (opts.seances || []) : [];
  const tailleNom = nomBrut.length > 15 ? 17 : nomBrut.length > 11 ? 21 : 25;

  /* les lettres tombent quand l'enseigne est ruinée */
  const nom = nomBrut;
  const enseigneVive = E.enseigneAllumee && lum;

  /* ---------- fabriques dépendantes de l'état ---------- */
  const ecaillure = (x, y, l, h) => E.peintureEcaillee
    ? `<path d="M${x} ${y} l${l*.3} ${-h*.4} l${l*.5} ${h*.2} l${l*.2} ${h*.5} l${-l*.4} ${h*.3} Z"
        fill="#000" opacity="${(.10 + E.usure*.10).toFixed(2)}"/>` : "";

  const coulure = (x, y, h) => E.rouille
    ? `<path d="M${x} ${y} q1.5 ${h*.5} 0 ${h}" stroke="#6a4a2a"
        stroke-width="${(1 + E.usure).toFixed(1)}" fill="none"
        opacity="${(.18 + E.usure*.22).toFixed(2)}"/>` : "";

  return `
<svg viewBox="0 0 480 ${H}" class="facadeRiche" xmlns="http://www.w3.org/2000/svg"
  preserveAspectRatio="xMidYMid slice"
  role="img" aria-label="Façade du cinéma ${nomBrut}, ${E.age.nom}">
<defs>
  <linearGradient id="cielG" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${P.ciel[0]}"/>
    <stop offset=".55" stop-color="${P.ciel[1]}"/>
    <stop offset="1" stop-color="${P.ciel[2]}"/>
  </linearGradient>
  <linearGradient id="murG" x1="0" y1="0" x2="1" y2=".3">
    <stop offset="0"   stop-color="${M.fonce}"/>
    <stop offset=".28" stop-color="${M.clair}"/>
    <stop offset=".62" stop-color="${M.clair}"/>
    <stop offset="1"   stop-color="${M.fonce}"/>
  </linearGradient>
  <linearGradient id="pierreG" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="${M.pierre}" stop-opacity=".55"/>
    <stop offset=".4" stop-color="${M.pierre}"/>
    <stop offset="1" stop-color="${P.murOmbre}"/>
  </linearGradient>
  <linearGradient id="orG" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${E.usure > .5 ? "#8a7a5a" : "#f7dd9a"}"/>
    <stop offset=".5" stop-color="${E.usure > .5 ? "#6a5a3a" : "#caa24a"}"/>
    <stop offset="1" stop-color="${E.usure > .5 ? "#4a3e28" : "#8a6c2a"}"/>
  </linearGradient>
  <linearGradient id="laitonG" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${E.rouille ? "#8a7a52" : "#e8cf8a"}"/>
    <stop offset=".5" stop-color="${E.rouille ? "#5a4a2a" : "#a8862f"}"/>
    <stop offset="1" stop-color="${E.rouille ? "#7a6a48" : "#d8bd76"}"/>
  </linearGradient>
  <linearGradient id="afficheG" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#fff" stop-opacity=".2"/>
    <stop offset=".5" stop-color="#000" stop-opacity="0"/>
    <stop offset="1" stop-color="#000" stop-opacity=".3"/>
  </linearGradient>
  <linearGradient id="trottoirG" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${P.trottoir[0]}"/><stop offset="1" stop-color="${P.trottoir[1]}"/>
  </linearGradient>
  <linearGradient id="routeG" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${P.route[0]}"/>
    <stop offset=".42" stop-color="${P.route[1]}"/>
    <stop offset="1" stop-color="${P.routeBas || P.route[1]}"/>
  </linearGradient>
  <linearGradient id="cielHautG" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${P.cielHaut || P.ciel[0]}"/>
    <stop offset=".62" stop-color="${P.ciel[0]}" stop-opacity=".55"/>
    <stop offset="1" stop-color="${P.ciel[0]}" stop-opacity="0"/>
  </linearGradient>
  <radialGradient id="nuageG" cx=".4" cy=".38" r=".72">
    <stop offset="0" stop-color="#ffffff" stop-opacity=".95"/>
    <stop offset=".55" stop-color="#ffffff" stop-opacity=".55"/>
    <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="nuageOmbreG" cx=".5" cy=".72" r=".6">
    <stop offset="0" stop-color="${P.nuageOmbre || "#8fa4bc"}" stop-opacity=".5"/>
    <stop offset="1" stop-color="${P.nuageOmbre || "#8fa4bc"}" stop-opacity="0"/>
  </radialGradient>
  <!-- bord de nuage : blanc plein au centre, fondu vers le vide.
       Remplace le flou gaussien : le contour respire sans laiteux. -->
  <radialGradient id="nuageBordG" cx=".5" cy=".5" r=".5">
    <stop offset=".62" stop-color="#ffffff" stop-opacity="1"/>
    <stop offset=".82" stop-color="#ffffff" stop-opacity=".55"/>
    <stop offset="1"   stop-color="#ffffff" stop-opacity="0"/>
  </radialGradient>
  <!-- ventre d'ombre du nuage -->
  <linearGradient id="nuageVentreG" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0"   stop-color="${P.nuageOmbre || "#8fa4bc"}" stop-opacity="0"/>
    <stop offset=".55" stop-color="${P.nuageOmbre || "#8fa4bc"}" stop-opacity=".22"/>
    <stop offset="1"   stop-color="${P.nuageOmbre || "#8fa4bc"}" stop-opacity=".4"/>
  </linearGradient>
  <!-- crête éclairée -->
  <radialGradient id="nuageCreteG" cx=".5" cy=".4" r=".6">
    <stop offset="0"  stop-color="#ffffff" stop-opacity=".9"/>
    <stop offset="1"  stop-color="#ffffff" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="voieLacteeG" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0"   stop-color="#8ea4d8" stop-opacity="0"/>
    <stop offset=".5"  stop-color="#aab6e4" stop-opacity=".5"/>
    <stop offset="1"   stop-color="#8ea4d8" stop-opacity="0"/>
  </linearGradient>
  <radialGradient id="luneHaloG" cx=".5" cy=".5" r=".5">
    <stop offset="0"   stop-color="#dfe8ff" stop-opacity=".22"/>
    <stop offset=".5"  stop-color="#dfe8ff" stop-opacity=".08"/>
    <stop offset="1"   stop-color="#dfe8ff" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="soleilHaloG" cx=".5" cy=".5" r=".5">
    <stop offset="0"   stop-color="${P.soleil}" stop-opacity=".28"/>
    <stop offset=".5"  stop-color="${P.soleil}" stop-opacity=".1"/>
    <stop offset="1"   stop-color="${P.soleil}" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="etoileHaloG" cx=".5" cy=".5" r=".5">
    <stop offset="0"  stop-color="#dfe8ff" stop-opacity=".5"/>
    <stop offset="1"  stop-color="#dfe8ff" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="ampouleG" cx=".4" cy=".35" r=".7">
    <stop offset="0" stop-color="#fffdf0"/><stop offset=".5" stop-color="#ffdf9a"/>
    <stop offset="1" stop-color="#e8a83a"/>
  </radialGradient>
  <radialGradient id="haloG" cx=".5" cy=".5" r=".5">
    <stop offset="0" stop-color="#ffdf9a" stop-opacity=".55"/>
    <stop offset=".45" stop-color="#ffc76a" stop-opacity=".18"/>
    <stop offset="1" stop-color="#ffc76a" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="solHaloG" cx=".5" cy=".5" r=".5">
    <stop offset="0" stop-color="#ffdf9a" stop-opacity=".4"/>
    <stop offset="1" stop-color="#ffdf9a" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="vitreG" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${enseigneVive ? "#4a3a28" : "#2a3038"}"/>
    <stop offset=".5" stop-color="${enseigneVive ? "#7a5a30" : "#3a4048"}"/>
    <stop offset="1" stop-color="${enseigneVive ? "#3a2a1c" : "#22282e"}"/>
  </linearGradient>
  <!-- ce que renvoie une vitre :
       en haut, le ciel du jour ;
       vers 40 %, la ligne des toits d'en face qui se réfléchit ;
       en bas, la rue à contre-jour. -->
  <linearGradient id="refletCielG" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0"    stop-color="${P.ciel[1]}"      stop-opacity=".48"/>
    <stop offset=".22"  stop-color="${P.ciel[2]}"      stop-opacity=".34"/>
    <stop offset=".42"  stop-color="${P.immeubles[0]}" stop-opacity=".42"/>
    <stop offset=".55"  stop-color="${P.immeubles[1]}" stop-opacity=".32"/>
    <stop offset=".78"  stop-color="${P.route[0]}"     stop-opacity=".28"/>
    <stop offset="1"    stop-color="#000"              stop-opacity=".34"/>
  </linearGradient>
  <!-- le liseré du haut : châssis de porte -->
  <linearGradient id="liseréHautG" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0"   stop-color="#fff" stop-opacity=".28"/>
    <stop offset=".5"  stop-color="#fff" stop-opacity=".08"/>
    <stop offset="1"   stop-color="#fff" stop-opacity="0"/>
  </linearGradient>
  <!-- le halo doré que l'enseigne projette sur les vitres, le soir -->
  <radialGradient id="refletEnseigneG" cx=".5" cy="0" r=".9">
    <stop offset="0"   stop-color="#ffdf9a" stop-opacity=".32"/>
    <stop offset=".45" stop-color="#ffc76a" stop-opacity=".18"/>
    <stop offset="1"   stop-color="#ffc76a" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="tapisG" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#a82b3d"/><stop offset="1" stop-color="#6e1424"/>
  </linearGradient>
  <linearGradient id="coneG" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#ffe9b0" stop-opacity=".3"/>
    <stop offset="1" stop-color="#ffe9b0" stop-opacity="0"/>
  </linearGradient>
  <linearGradient id="planchesG" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#8a6c48"/><stop offset="1" stop-color="#5a4430"/>
  </linearGradient>
  <linearGradient id="ombreAuventG" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#000" stop-opacity=".34"/>
    <stop offset=".45" stop-color="#000" stop-opacity=".14"/>
    <stop offset="1" stop-color="#000" stop-opacity="0"/>
  </linearGradient>
  <radialGradient id="vignetteG" cx=".5" cy=".45" r=".72">
    <stop offset=".55" stop-color="#000" stop-opacity="0"/>
    <stop offset="1" stop-color="#000" stop-opacity="${P.vignette}"/>
  </radialGradient>
  <filter id="flouLeger" x="-20%" y="-20%" width="140%" height="140%">
    <feGaussianBlur stdDeviation="1.6"/>
  </filter>
  <filter id="flouFort" x="-30%" y="-30%" width="160%" height="160%">
    <feGaussianBlur stdDeviation="5"/>
  </filter>
  <pattern id="grain" width="60" height="60" patternUnits="userSpaceOnUse">
    ${[...Array(48)].map(()=>`<circle cx="${(Math.random()*60).toFixed(1)}"
      cy="${(Math.random()*60).toFixed(1)}" r=".45" fill="#fff" opacity=".05"/>`).join("")}
  </pattern>
  <pattern id="salissure" width="80" height="80" patternUnits="userSpaceOnUse">
    ${[...Array(10)].map(()=>`<ellipse cx="${(Math.random()*80).toFixed(0)}"
      cy="${(Math.random()*80).toFixed(0)}" rx="${(6+Math.random()*14).toFixed(0)}"
      ry="${(4+Math.random()*9).toFixed(0)}" fill="#2a2418"
      opacity="${(.05 + Math.random()*.06).toFixed(3)}"/>`).join("")}
  </pattern>
</defs>

<!-- ═══ CIEL ═══ -->
<rect width="480" height="${H}" fill="url(#cielG)"/>
<rect width="480" height="${Math.round(CIEL*.92)}" fill="url(#cielHautG)"/>

${phase === "nuit" ? `
<g class="voieLactee" opacity=".16">
  <ellipse cx="300" cy="${Math.round(CIEL*.34)}" rx="240" ry="${Math.round(CIEL*.18)}" fill="url(#voieLacteeG)"
    transform="rotate(-24 300 ${Math.round(CIEL*.34)})"/>
  <ellipse cx="240" cy="${Math.round(CIEL*.48)}" rx="180" ry="${Math.round(CIEL*.12)}" fill="url(#voieLacteeG)"
    transform="rotate(-20 240 ${Math.round(CIEL*.48)})" opacity=".7"/>
</g>
<g class="etoiles">${[...Array(120)].map((_,i)=>{
  const x = (Math.random()*480).toFixed(0);
  const y = (Math.random()*CIEL*.94).toFixed(0);
  const r = (0.35 + Math.random()*1.05).toFixed(2);
  const o = (.22 + Math.random()*.7).toFixed(2);
  const teinte = Math.random() < .12 ? "#cfe0ff" : Math.random() < .2 ? "#ffeccf" : "#fff";
  return `<circle cx="${x}" cy="${y}" r="${r}" fill="${teinte}" opacity="${o}"
    style="animation-delay:${(i*.11).toFixed(2)}s;animation-duration:${(3 + Math.random()*3.5).toFixed(1)}s"/>`;
}).join("")}</g>
<g class="etoilesVives">${[...Array(7)].map((_,i)=>{
  const x = (40 + Math.random()*400).toFixed(0);
  const y = (12 + Math.random()*CIEL*.7).toFixed(0);
  return `<g style="animation-delay:${(i*.9).toFixed(1)}s">
    <circle cx="${x}" cy="${y}" r="1.5" fill="#fff"/>
    <circle cx="${x}" cy="${y}" r="5.5" fill="url(#etoileHaloG)"/>
    <path d="M${x} ${Number(y)-6} L${x} ${Number(y)+6} M${Number(x)-6} ${y} L${Number(x)+6} ${y}"
      stroke="#fff" stroke-width=".55" opacity=".5"/>
  </g>`;
}).join("")}</g>` : ""}

${phase === "nuit"
  ? `<g>
     <circle cx="392" cy="${Math.round(CIEL*.34)}" r="76" fill="url(#luneHaloG)"/>
     <circle cx="392" cy="${Math.round(CIEL*.34)}" r="44" fill="url(#luneHaloG)"/>
     <circle cx="392" cy="${Math.round(CIEL*.34)}" r="21" fill="#f2f5ff"/>
     <circle cx="392" cy="${Math.round(CIEL*.34)}" r="21" fill="#dfe4f2" opacity=".5"/>
     <g opacity=".2" fill="#8a94b0">
       <circle cx="386" cy="${Math.round(CIEL*.30)}" r="4.2"/>
       <circle cx="398" cy="${Math.round(CIEL*.38)}" r="3"/>
       <circle cx="390" cy="${Math.round(CIEL*.41)}" r="2.2"/>
     </g>
     <circle cx="383" cy="${Math.round(CIEL*.29)}" r="18.5" fill="${P.ciel[0]}"/>
     </g>`
  : `<g>
     <circle cx="${phase==="crepuscule"?96:368}" cy="${Math.round(CIEL*(phase==="crepuscule"?.74:.30))}" r="118"
       fill="url(#soleilHaloG)"/>
     <circle cx="${phase==="crepuscule"?96:368}" cy="${Math.round(CIEL*(phase==="crepuscule"?.74:.30))}" r="64"
       fill="url(#soleilHaloG)"/>
     <circle cx="${phase==="crepuscule"?96:368}" cy="${Math.round(CIEL*(phase==="crepuscule"?.74:.30))}"
       r="${phase==="crepuscule"?28:20}" fill="${P.soleil}" opacity=".95"/>
     </g>`}

<!-- nuages : trois plans, volume par superposition de bulbes -->
<g class="cieux">
  <!-- plan lointain, très diffus -->
  <g class="nuageLoin" opacity="${phase==="nuit"?.10:.26}">
    ${nuageVolumetrique(80,  CIEL*.28, 1.2, .42)}
    ${nuageVolumetrique(398, CIEL*.15, .95, .34)}
    ${nuageVolumetrique(250, CIEL*.07, .8,  .26)}
  </g>
  <!-- plan médian -->
  <g class="nuageA" opacity="${phase==="nuit"?.18:.62}">
    ${nuageVolumetrique(120, CIEL*.47, 1.02,.66)}
    ${nuageVolumetrique(380, CIEL*.58, .78, .52)}
  </g>
  <!-- plan proche, plus contrasté -->
  <g class="nuageB" opacity="${phase==="nuit"?.14:.5}">
    ${nuageVolumetrique(332, CIEL*.33, 1.18,.62)}
    ${nuageVolumetrique(44,  CIEL*.63, .88, .45)}
  </g>
</g>

<g transform="translate(0 ${DY})">
<!-- ═══ VILLE ═══ -->
<g opacity=".55">
  <path d="M0 208 L28 208 L28 176 L56 176 L56 196 L92 196 L92 164 L124 164 L124 200
           L166 200 L166 182 L200 182 L200 206 L246 206 L246 172 L282 172 L282 198
           L324 198 L324 178 L360 178 L360 202 L410 202 L410 186 L452 186 L452 204
           L480 204 L480 260 L0 260 Z" fill="${P.immeubles[2]}"/>
</g>
<g opacity=".78">
  <path d="M0 230 L44 230 L44 202 L88 202 L88 222 L132 222 L132 194 L182 194 L182 226
           L232 226 L232 208 L286 208 L286 232 L340 232 L340 200 L392 200 L392 228
           L446 228 L446 214 L480 214 L480 280 L0 280 Z" fill="${P.immeubles[1]}"/>
  ${lum ? [...Array(26)].map(()=>fenetreVoisin((Math.random()*470).toFixed(0),
    (212+Math.random()*54).toFixed(0), 3, 4, P, Math.random()<.6)).join("") : ""}
</g>
<g>
  ${immeubleVoisin(0, 188, 72, 196, P, "g", lum)}
  ${[0,1,2,3].map(r=>[0,1,2].map(c=>
    fenetreVoisin(9 + c*22, 204 + r*40, 13, 22, P, lum && Math.random()<.62)).join("")).join("")}
  ${[0,1,2,3].map(r=>[0,1,2].map(c=>
    `<rect x="${7 + c*22}" y="${202 + r*40}" width="17" height="2" fill="${P.toit}" opacity=".45"/>
     <rect x="${7 + c*22}" y="${226 + r*40}" width="17" height="2.4" fill="${P.toit}" opacity=".55"/>`
    ).join("")).join("")}
  ${immeubleVoisin(408, 176, 72, 208, P, "d", lum)}
  ${[0,1,2,3,4].map(r=>[0,1].map(c=>
    fenetreVoisin(422 + c*26, 192 + r*38, 15, 22, P, lum && Math.random()<.55)).join("")).join("")}
  ${[0,1,2,3,4].map(r=>[0,1].map(c=>
    `<rect x="${420 + c*26}" y="${190 + r*38}" width="19" height="2" fill="${P.toit}" opacity=".45"/>
     <rect x="${420 + c*26}" y="${214 + r*38}" width="19" height="2.4" fill="${P.toit}" opacity=".55"/>`
    ).join("")).join("")}
  <rect x="404" y="176" width="4" height="208" fill="${P.toit}" opacity=".7"/>
</g>

<!-- ═══ MITOYENNETÉ ═══
     Le cinéma va de x=86 à x=394, les voisins s'arrêtent à 72 et
     reprennent à 408 : il restait quatorze unités de ciel de chaque
     côté, visibles du toit jusqu'au trottoir. Le bâtiment paraissait
     posé dans le vide au lieu d'être encastré dans sa rue.

     On comble par le mur pignon du voisin, celui qu'on voit de biais
     quand deux immeubles se touchent : même pierre, mais dans l'ombre
     puisqu'il ne prend jamais le jour de face. -->
<g>
  <rect x="66" y="182" width="24" height="202" fill="${P.immeubles[1]}"/>
  <rect x="66" y="182" width="24" height="202" fill="#000" opacity=".3"/>
  <rect x="86" y="182" width="4" height="202" fill="#000" opacity=".22"/>
  <rect x="390" y="170" width="24" height="214" fill="${P.immeubles[1]}"/>
  <rect x="390" y="170" width="24" height="214" fill="#000" opacity=".3"/>
  <rect x="390" y="170" width="4" height="214" fill="#000" opacity=".22"/>
</g>
<rect x="0" y="150" width="480" height="150" fill="${P.brume}" opacity="${P.brumeOpac}"/>
<rect x="0" y="120" width="480" height="90" fill="${P.brume}" opacity="${(P.brumeOpac*.55).toFixed(3)}"/>

<!-- ═══ LE CINÉMA ═══ -->
<g>
  <!-- couronnement : un gradin de plus par âge -->
  ${E.couronnement >= 1 ? `<rect x="86" y="118" width="308" height="14" fill="url(#pierreG)"/>` : ""}
  ${E.couronnement >= 2 ? `<rect x="98" y="104" width="284" height="16" fill="url(#pierreG)"/>` : ""}
  ${E.couronnement >= 3 ? `<rect x="118" y="88" width="244" height="18" fill="url(#pierreG)"/>` : ""}
  ${E.couronnement >= 4 ? `<rect x="152" y="72" width="176" height="18" fill="url(#pierreG)"/>` : ""}
  ${E.couronnement >= 5 ? `<rect x="196" y="58" width="88" height="16" fill="url(#pierreG)"/>` : ""}
  ${E.filetsDores ? `<g fill="url(#orG)">
    <rect x="86" y="130" width="308" height="3"/>
    ${E.couronnement>=2?`<rect x="98" y="118" width="284" height="2"/>`:""}
    ${E.couronnement>=3?`<rect x="118" y="104" width="244" height="2"/>`:""}
    ${E.couronnement>=4?`<rect x="152" y="88" width="176" height="2"/>`:""}
    ${E.couronnement>=5?`<rect x="196" y="72" width="88" height="2"/>`:""}
  </g>` : ""}
  ${E.eventail ? `<g transform="translate(240 58)">
    ${[...Array(7)].map((_,i)=>{
      const a = -90 + (i-3)*15;
      return `<path d="M0 0 L${(Math.cos(a*Math.PI/180)*30).toFixed(1)}
        ${(Math.sin(a*Math.PI/180)*30).toFixed(1)}" stroke="url(#orG)" stroke-width="2.4"
        stroke-linecap="round" opacity=".8"/>`;}).join("")}
    <circle cx="0" cy="0" r="5" fill="url(#orG)"/>
  </g>` : ""}

  <!-- corps -->
  <!-- le corps descend jusqu'au trottoir (384) : il s'arrêtait à 380,
       laissant une fente de ciel au ras du sol -->
  <rect x="86" y="132" width="308" height="252" fill="url(#murG)"/>
  <!-- gradient très doux du haut vers le bas : le mur reçoit plus de
       lumière près de la corniche que près du trottoir. Effet subtil,
       mais c'est lui qui empêche le mur de lire comme du carton. -->
  <rect x="86" y="132" width="308" height="120" fill="url(#solHaloG)" opacity=".08"
    transform="translate(0 0)" pointer-events="none"/>
  ${appareilPierre(86, 132, 308, 248, M, P, E.usure, 11)}
  ${E.usure > .05 ? `<rect x="86" y="132" width="308" height="248" fill="url(#salissure)"
    opacity="${(E.usure).toFixed(2)}"/>` : ""}
  <!-- l'ombre projetée par la corniche sur le haut du mur : c'est ce
       liseré sombre qui donne au bâtiment son épaisseur -->
  <rect x="86" y="132" width="308" height="10" fill="#000" opacity=".28"/>
  <rect x="86" y="132" width="308" height="18" fill="#000" opacity=".14"/>
  ${ecaillure(120, 200, 40, 30)}${ecaillure(300, 250, 46, 34)}${ecaillure(180, 320, 34, 26)}
  ${coulure(96, 148, 60)}${coulure(384, 148, 74)}${coulure(240, 210, 40)}

  <!-- pilastres -->
  ${E.pilastres ? `
    ${pilastre(92, 148, 340, 20, {pierre:M.pierre, murOmbre:P.murOmbre})}
    ${pilastre(368, 148, 340, 20, {pierre:M.pierre, murOmbre:P.murOmbre})}
    ${pilastre(150, 152, 214, 12, {pierre:M.pierre, murOmbre:P.murOmbre})}
    ${pilastre(318, 152, 214, 12, {pierre:M.pierre, murOmbre:P.murOmbre})}`
  : `<g opacity=".5">
      <rect x="92" y="148" width="20" height="192" fill="url(#pierreG)"/>
      <rect x="368" y="148" width="20" height="192" fill="url(#pierreG)"/>
    </g>`}
  ${E.basReliefs ? `<g opacity=".35" fill="${M.pierre}">
    <path d="M176 168 l14 -12 l14 12 l-14 12 Z"/>
    <path d="M276 168 l14 -12 l14 12 l-14 12 Z"/>
  </g>` : ""}

  <!-- ═══ ENSEIGNE ═══ -->
  <g>
    <rect x="118" y="150" width="244" height="52" rx="3"
      fill="#1a1218" opacity="${E.enseigneComplete ? .85 : .6}"/>
    <rect x="118" y="150" width="244" height="52" rx="3" fill="none"
      stroke="url(#orG)" stroke-width="2" opacity="${E.enseigneComplete ? 1 : .5}"/>
    ${enseigneVive ? `<rect x="122" y="154" width="236" height="44" rx="2"
      fill="url(#haloG)" filter="url(#flouLeger)"/>` : ""}
    <text x="240" y="186" text-anchor="middle" font-family="Marcellus, Georgia"
      font-size="${tailleNom}" letter-spacing="4"
      fill="${enseigneVive ? "#ffe9b0" : E.enseigneComplete ? "#e8dcc4" : "#7a6e60"}"
      class="${E.enseigneGresille && lum ? "neonFatigue" : enseigneVive ? "neonVivant" : ""}"
      ${enseigneVive ? 'style="filter:drop-shadow(0 0 8px rgba(255,200,110,.85))"' : ""}>${logo} ${nom}</text>
    ${E.ampouleMorte ? `<circle cx="196" cy="150" r="2" fill="#4a4238" opacity=".8"/>
      <circle cx="301" cy="202" r="2" fill="#4a4238" opacity=".8"/>` : ""}
    ${E.ampoulesEnseigne ? ampoules(126, 354, 150, 14, 2.2) + ampoules(126, 354, 202, 14, 2.2)
      : `<g fill="#4a4238" opacity=".6">
          ${[...Array(14)].map((_,i)=>`<circle cx="${126 + i*17.5}" cy="150" r="2"/>`).join("")}
        </g>`}
  </g>

  <!-- ═══ MARQUEE ═══ -->
  ${E.marquee ? `<g>
    ${E.marqueeVolume ? `
      <path d="M96 262 L384 262 L360 284 L120 284 Z"
        fill="${enseigneVive ? "#4a3418" : "#2a2018"}"/>
      ${enseigneVive ? `<path d="M96 262 L384 262 L360 284 L120 284 Z" fill="url(#haloG)"/>` : ""}
      ${E.ampoulesMarquee ? (E.chenillard
        ? ampoulesChenillard(132, 348, 274, 12, 2.8) : ampoules(132, 348, 274, 12, 2.8)) : ""}
      <path d="M92 232 L388 232 L384 262 L96 262 Z" fill="url(#pierreG)"/>
      <rect x="92" y="228" width="296" height="6" rx="2" fill="url(#orG)"/>
      <path d="M92 232 L96 262 L120 284 L112 284 L88 258 Z" fill="#000" opacity=".22"/>`
    : `<!-- auvent simple, encore de guingois -->
      <path d="M96 236 L384 232 L380 258 L100 262 Z" fill="url(#pierreG)" opacity=".92"/>
      <path d="M96 236 L384 232 L384 236 L96 240 Z" fill="url(#orG)" opacity=".5"/>
      ${coulure(140, 258, 22)}${coulure(320, 256, 26)}`}
    ${E.texteMarquee ? `<text x="240" y="252" text-anchor="middle" font-family="Courier New"
      font-size="11" letter-spacing="2.5" font-weight="bold"
      fill="${enseigneVive ? "#241a12" : "#3a2c22"}">${seances.length
        ? "CE SOIR " + (seances[0].heure || "").replace("h","H") : "PROCHAINEMENT"}</text>` : ""}
  </g>` : ""}

  <!-- ═══ VITRINES ═══ -->
  <!-- L'ombre portée de l'auvent : c'est elle qui donne au marquee
       son épaisseur. Sans elle, la façade reste plate. -->
  ${E.marquee ? `<g pointer-events="none">
    <!-- la pénombre principale : le marquee éclipse la lumière du jour -->
    <path d="M96 284 L384 284 L384 322 L96 322 Z" fill="url(#ombreAuventG)"/>
    <!-- l'ombre projetée juste sous la corniche : plus dense -->
    <path d="M120 284 L360 284 L352 302 L128 302 Z" fill="#000" opacity=".26"/>
    <!-- une seconde ombre plus douce qui descend sur les vitrines -->
    <rect x="96" y="284" width="288" height="28" fill="#000" opacity=".12"/>
    <!-- les deux caissons latéraux reçoivent moins de lumière -->
    <rect x="96" y="284" width="24" height="106" fill="#000" opacity=".14"/>
    <rect x="360" y="284" width="24" height="106" fill="#000" opacity=".14"/>
  </g>` : ""}
  ${vitrineEtat(104, 296, 62, 92, seances[0], enseigneVive, E)}
  ${vitrineEtat(314, 296, 62, 92, seances[1], enseigneVive, E)}
  ${E.verriere ? `<g>
    <path d="M170 286 L310 286 L322 272 L158 272 Z" fill="#9fc4d8" opacity=".22"/>
    <path d="M170 286 L310 286 L322 272 L158 272 Z" fill="none" stroke="url(#orG)" stroke-width="2"/>
    <g stroke="url(#orG)" stroke-width="1.2" opacity=".7">
      <path d="M198 286 L192 272"/><path d="M240 286 L240 272"/><path d="M282 286 L288 272"/>
    </g>
    ${enseigneVive ? `<path d="M170 286 L310 286 L322 272 L158 272 Z" fill="#ffdf9a" opacity=".1"/>` : ""}
  </g>` : ""}

  <!-- ═══ ENTRÉE ═══ -->
  <g>
    <path d="M178 288 L302 288 L292 300 L188 300 Z" fill="#000" opacity=".3"/>
    <rect x="180" y="296" width="120" height="92" fill="#100a10"/>
    ${enseigneVive ? `<rect x="184" y="300" width="112" height="84" fill="#ffdf9a" opacity=".1"/>` : ""}
    ${[184, 242].map(bx=>`
      <!-- le châssis, laiton ou or selon le niveau -->
      <rect x="${bx}" y="300" width="54" height="84" rx="2" fill="url(#vitreG)"
        stroke="${E.portesDorees ? "url(#orG)" : "url(#laitonG)"}" stroke-width="${E.portesDorees ? 3 : 2}"/>

      <!-- couche 1 : le monde d'en face que la vitre renvoie -->
      <rect x="${bx+2}" y="302" width="50" height="80" fill="url(#refletCielG)"/>

      <!-- couche 2 : la silhouette des immeubles d'en face, réfléchie
           à la ligne d'horizon (le trottoir opposé), en teinte de mur -->
      <path d="M${bx+2} 338
               l6 -4 l4 3 l3 -8 l5 6 l7 -5 l4 4 l6 -3 l5 5 l4 -2 l6 4
               l0 12 l-50 0 Z"
        fill="${P.immeubles[0]}" opacity=".28"/>
      <!-- une fenêtre allumée dans l'immeuble d'en face, le soir -->
      ${lum ? `<rect x="${bx+12}" y="336" width="3.4" height="4.2" fill="${P.fenetres}" opacity=".55"/>
        <rect x="${bx+34}" y="340" width="3" height="3.6" fill="${P.fenetres}" opacity=".45"/>` : ""}

      <!-- couche 3 : le halo de l'enseigne qui frappe le verre -->
      ${enseigneVive ? `<rect x="${bx+2}" y="302" width="50" height="46"
        fill="url(#refletEnseigneG)"/>` : ""}

      <!-- couche 4 : les barres de lumière rasante -->
      <path d="M${bx+6} 382 L${bx+32} 302 L${bx+42} 302 L${bx+16} 382 Z" fill="#fff" opacity=".14"/>
      <path d="M${bx+38} 382 L${bx+52} 340 L${bx+52} 356 L${bx+46} 382 Z" fill="#fff" opacity=".07"/>

      <!-- couche 5 : le liseré du haut, réflexion du châssis -->
      <rect x="${bx+2}" y="302" width="50" height="14" fill="url(#liseréHautG)"/>

      <!-- couche 6 : la poussière discrète dans les coins bas -->
      <path d="M${bx+2} 376 L${bx+10} 376 L${bx+2} 382 Z" fill="#000" opacity=".18"/>
      <path d="M${bx+52} 376 L${bx+44} 376 L${bx+52} 382 Z" fill="#000" opacity=".18"/>`).join("")}
    <rect x="228" y="332" width="4" height="24" rx="2"
      fill="${E.portesDorees ? "url(#orG)" : "url(#laitonG)"}"/>
    <rect x="248" y="332" width="4" height="24" rx="2"
      fill="${E.portesDorees ? "url(#orG)" : "url(#laitonG)"}"/>
    ${E.portesDorees ? `<g opacity=".55">
      <path d="M196 314 l10 -8 l10 8 l-10 8 Z M264 314 l10 -8 l10 8 l-10 8 Z" fill="url(#orG)"/>
    </g>` : ""}
    ${E.imposte ? `<rect x="184" y="290" width="112" height="8" fill="url(#laitonG)" opacity=".8"/>` : ""}
    ${E.appliques ? [168, 306].map(x=>`<g transform="translate(${x} 312)">
      <path d="M0 0 l7 -9 l7 9 l-3 14 l-8 0 Z" fill="url(#laitonG)"/>
      ${lum ? `<circle cx="7" cy="6" r="9" fill="url(#haloG)"/>
        <circle cx="7" cy="4" r="3" fill="#fff4d0" class="amp"/>` : ""}
    </g>`).join("") : ""}
  </g>

  ${E.plaque ? `<g transform="translate(322 356)">
    <rect x="0" y="0" width="52" height="17" rx="2" fill="url(#laitonG)"/>
    <rect x="1.5" y="1.5" width="49" height="14" rx="1.5" fill="none"
      stroke="#6a5220" stroke-width=".8"/>
    <text x="26" y="11.5" text-anchor="middle" font-family="Courier New" font-size="5.4"
      letter-spacing=".3" fill="#3a2408">CINEMA DU QUARTIER</text>
  </g>` : ""}


  <!-- ═══ ENSEIGNE VERTICALE ═══ -->
  ${E.enseigneVerticale ? `<g>
    <rect x="60" y="126" width="34" height="196" rx="4" fill="#1a1218"
      stroke="url(#orG)" stroke-width="2.4"/>
    <rect x="60" y="126" width="34" height="196" rx="4" fill="none"
      stroke="url(#orG)" stroke-width="1" opacity=".5" transform="translate(2 2)"/>
    ${lum ? `<rect x="63" y="129" width="28" height="190" rx="3" fill="url(#haloG)"
      filter="url(#flouLeger)"/>` : ""}
    ${(opts.nom || "CINE").toUpperCase().replace(/[^A-Z]/g,"").slice(0,8).split("").map((c,k)=>
      `<text x="77" y="${152 + k*23}" text-anchor="middle" font-family="Marcellus, Georgia"
        font-size="17" fill="${lum ? "#ffe9b0" : "#c8bca4"}"
        ${lum ? 'style="filter:drop-shadow(0 0 6px rgba(255,200,110,.8))"' : ""}
        class="${lum ? "lettreBlade" : ""}" style="animation-delay:${(k*.22).toFixed(2)}s">${c}</text>`
      ).join("")}
    <path d="M60 126 l17 -16 l17 16 Z" fill="url(#orG)"/>
    ${[...Array(9)].map((_,k)=>`<circle cx="56" cy="${140 + k*21}" r="2"
      fill="url(#ampouleG)" class="amp a${k%4}"/>
      <circle cx="98" cy="${140 + k*21}" r="2" fill="url(#ampouleG)" class="amp a${(k+2)%4}"/>`).join("")}
  </g>` : ""}

  <!-- ═══ HORLOGE DE FRONTON ═══ -->
  ${E.horloge ? `<g transform="translate(240 106)">
    <circle cx="0" cy="0" r="21" fill="#1a1218" stroke="url(#orG)" stroke-width="2.6"/>
    <circle cx="0" cy="0" r="17" fill="${lum ? "#3a2a18" : "#2a2620"}"/>
    ${[...Array(12)].map((_,k)=>{
      const a = k*30*Math.PI/180;
      return `<line x1="${(Math.sin(a)*14).toFixed(1)}" y1="${(-Math.cos(a)*14).toFixed(1)}"
        x2="${(Math.sin(a)*16).toFixed(1)}" y2="${(-Math.cos(a)*16).toFixed(1)}"
        stroke="url(#orG)" stroke-width="1.4"/>`;}).join("")}
    <line x1="0" y1="0" x2="0" y2="-9" stroke="#e8dcc4" stroke-width="2" stroke-linecap="round"
      class="aiguilleH"/>
    <line x1="0" y1="0" x2="9" y2="2" stroke="#e8dcc4" stroke-width="1.4" stroke-linecap="round"
      class="aiguilleM"/>
    <circle cx="0" cy="0" r="2" fill="url(#orG)"/>
  </g>` : ""}

  <!-- ═══ FENÊTRES D'ÉTAGE ═══ -->
  ${E.fenetresEtage ? `<g>
    ${[126, 186, 246, 306].map(x=>`<g>
      <rect x="${x}" y="206" width="28" height="18" rx="2" fill="${lum ? "#ffcf8a" : "#4a5058"}"
        opacity="${lum ? .85 : .6}"/>
      <rect x="${x-2}" y="204" width="32" height="3" fill="url(#pierreG)"/>
      <rect x="${x-2}" y="224" width="32" height="3" fill="url(#pierreG)"/>
      <line x1="${x+14}" y1="206" x2="${x+14}" y2="224" stroke="#2a2620" stroke-width="1.2"/>
    </g>`).join("")}
  </g>` : ""}

  ${E.echafaudage ? `<g opacity=".85">
    <g stroke="#6a6258" stroke-width="2.6" fill="none">
      <path d="M96 380 L96 210 M136 380 L136 210 M344 380 L344 210 M384 380 L384 210"/>
      <path d="M92 300 L140 300 M340 300 L388 300"/>
      <path d="M92 244 L140 244 M340 244 L388 244"/>
      <path d="M96 300 L136 244 M344 300 L384 244"/>
    </g>
    <rect x="92" y="294" width="48" height="6" fill="#8a6c48"/>
    <rect x="340" y="294" width="48" height="6" fill="#8a6c48"/>
    <rect x="92" y="238" width="48" height="6" fill="#8a6c48"/>
    <rect x="340" y="238" width="48" height="6" fill="#8a6c48"/>
  </g>` : ""}
</g>

<!-- ═══ TROTTOIR ═══ -->
<!-- ombre de contact : ce qui pose vraiment le bâtiment au sol -->
<g>
  <path d="M0 384 L480 384 L480 452 L0 452 Z" fill="url(#trottoirG)"/>
  <rect x="0" y="384" width="480" height="7" fill="#000" opacity=".2"/>
  <rect x="86" y="384" width="308" height="4" fill="#000" opacity=".22"/>
  <g stroke="#000" stroke-opacity=".12" stroke-width="1.2">
    ${[...Array(11)].map((_,i)=>{
      const xh = i*48, xb = (i - 5.5)*72 + 240;
      return `<path d="M${xh} 384 L${xb.toFixed(0)} 452"/>`;}).join("")}
    <path d="M0 404 L480 404"/><path d="M0 426 L480 426"/>
  </g>
  ${E.trottoirFissure ? `<g stroke="#000" stroke-opacity=".26" stroke-width="1.6" fill="none">
    <path d="M42 392 l18 14 l-8 12 l22 16"/>
    <path d="M396 400 l-16 12 l12 14 l-18 14"/>
    <path d="M150 436 l24 8 l-10 8"/>
  </g>` : ""}
  ${E.herbes ? `<g opacity="${(.55 + E.usure*.35).toFixed(2)}">
    ${[70, 196, 268, 366, 430].map(x=>`<g transform="translate(${x} 388)">
      <path d="M0 0 q-3 -9 -1 -14 M2 0 q2 -11 5 -15 M-3 0 q-5 -7 -8 -10"
        stroke="#5a7a3a" stroke-width="1.4" fill="none" stroke-linecap="round"/>
    </g>`).join("")}
    <path d="M86 384 q10 -8 22 -2 q-8 4 -22 2" fill="#4a6b32" opacity=".7"/>
    <path d="M372 384 q12 -9 24 -3 q-10 5 -24 3" fill="#4a6b32" opacity=".6"/>
  </g>` : ""}
  <path d="M0 452 L480 452 L480 462 L0 462 Z" fill="${P.trottoir[1]}"/>
  <path d="M0 462 L480 462 L480 466 L0 466 Z" fill="#000" opacity=".28"/>
</g>

<!-- ═══ ÉTOILES DU TROTTOIR ═══ -->
${E.etoilesSol ? `<g opacity=".8">
  ${[[112,412],[152,432],[352,414],[392,436],[72,428]].map(([x,y],k)=>`<g transform="translate(${x} ${y})">
    <circle cx="0" cy="0" r="13" fill="#2a2620" opacity=".55"/>
    <path d="M0 -10 L2.8 -3 L10 -3 L4.4 1.4 L6.6 8.6 L0 4.4 L-6.6 8.6 L-4.4 1.4 L-10 -3 L-2.8 -3 Z"
      fill="url(#orG)"/>
  </g>`).join("")}
</g>` : ""}

<!-- ═══ GUICHET ═══ -->
${E.guichet ? `<g transform="translate(206 372)">
  <ellipse cx="34" cy="46" rx="42" ry="7" fill="#000" opacity=".3"/>
  <path d="M0 8 L68 8 L62 46 L6 46 Z" fill="url(#pierreG)"/>
  <path d="M-4 0 L72 0 L68 10 L0 10 Z" fill="url(#orG)"/>
  <path d="M10 16 L58 16 L54 38 L14 38 Z" fill="${lum ? "#5a4020" : "#2a3038"}"
    stroke="url(#laitonG)" stroke-width="1.6"/>
  ${lum ? `<path d="M10 16 L58 16 L54 38 L14 38 Z" fill="#ffdf9a" opacity=".22"/>
    <circle cx="34" cy="4" r="12" fill="url(#haloG)"/>` : ""}
  <path d="M22 38 L46 38 L45 42 L23 42 Z" fill="url(#laitonG)"/>
  <text x="34" y="30" text-anchor="middle" font-family="Courier New" font-size="6.5"
    letter-spacing=".8" fill="${lum ? "#f7dd9a" : "#8a8278"}">CAISSE</text>
</g>` : ""}

${E.tapis ? `<g>
  <path d="M186 388 L294 388 L${E.tapisLong ? 340 : 322} 452 L${E.tapisLong ? 140 : 158} 452 Z"
    fill="url(#tapisG)"/>
  <path d="M190 388 L${E.tapisLong ? 144 : 162} 452 M290 388 L${E.tapisLong ? 336 : 318} 452"
    stroke="#e8b84b" stroke-width="2.4" opacity=".7"/>
  <path d="M186 388 L294 388 L292 394 L188 394 Z" fill="#fff" opacity=".08"/>
</g>` : ""}

<!-- ═══ ROUTE ═══ -->
<g>
  <path d="M0 466 L480 466 L480 ${BASROUTE} L0 ${BASROUTE} Z" fill="url(#routeG)"/>
  <!-- UN SEUL AXE MÉDIAN

       Il y avait deux rangées de pointillés : une à 30 % de la
       hauteur de chaussée, une seconde à 72 % sur les grands
       écrans. Deux lignes parallèles se lisent comme deux
       chaussées séparées — d'où l'impression tenace d'une double
       route alors qu'un seul bitume est dessiné.

       On garde la ligne médiane, au milieu de la chaussée. -->
  <g stroke="#c8c0a8" stroke-opacity="${E.usure > .6 ? ".14" : ".3"}" stroke-width="3"
     stroke-dasharray="26 22"><path d="M0 ${Math.round(466 + HROUTE*.5)} L480 ${Math.round(466 + HROUTE*.5)}"/></g>
  <g opacity=".18">
    <ellipse cx="150" cy="${Math.round(466 + HROUTE*.52)}" rx="60" ry="7" fill="#000"/>
    ${HROUTE > 110 ? `<ellipse cx="370" cy="${Math.round(466 + HROUTE*.86)}" rx="72" ry="8" fill="#000"/>` : ""}
  </g>
  <ellipse cx="72" cy="478" rx="15" ry="5" fill="#000" opacity=".3"/>
  <ellipse cx="72" cy="477" rx="13" ry="4" fill="${P.route[0]}"/>
</g>

<!-- ═══ MOBILIER ═══ -->
<g>
  <!-- lampadaire gauche : cassé au premier âge -->
  <g transform="translate(56 384)">
    <ellipse cx="0" cy="4" rx="11" ry="3.5" fill="#000" opacity=".26"/>
    <rect x="-4" y="-2" width="8" height="6" rx="1.5" fill="#2a2620"/>
    <rect x="-2" y="-96" width="4" height="96" fill="#2e2a22"/>
    <rect x="-2" y="-96" width="1.4" height="96" fill="#fff" opacity=".12"/>
    <path d="M0 -96 q0 -12 14 -12" stroke="#2e2a22" stroke-width="4" fill="none"/>
    <path d="M8 -108 l14 0 l4 12 l-22 0 Z" fill="#2e2a22"/>
    ${lum && !E.lampadaireCasse ? `<circle cx="15" cy="-98" r="26" fill="url(#haloG)"/>
      <path d="M6 -95 L24 -95 L44 -6 L-14 -6 Z" fill="url(#coneG)"/>
      <ellipse cx="15" cy="-2" rx="34" ry="9" fill="url(#solHaloG)"/>
      <circle cx="15" cy="-97" r="4" fill="#fff4d0"/>` : ""}
    ${lum && E.lampadaireCasse ? `<circle cx="15" cy="-98" r="14" fill="url(#haloG)" class="vacille"/>
      <circle cx="15" cy="-97" r="2.6" fill="#fff4d0" class="vacille"/>
      <path d="M9 -104 l5 5 M20 -103 l-5 5" stroke="#1a1a1a" stroke-width="1"/>` : ""}
  </g>
  ${E.lampadaires >= 2 ? `<g transform="translate(424 384)">
    <ellipse cx="0" cy="4" rx="11" ry="3.5" fill="#000" opacity=".26"/>
    <rect x="-4" y="-2" width="8" height="6" rx="1.5" fill="#2a2620"/>
    <rect x="-2" y="-88" width="4" height="88" fill="#2e2a22"/>
    <path d="M0 -88 q0 -12 -14 -12" stroke="#2e2a22" stroke-width="4" fill="none"/>
    <path d="M-8 -100 l-14 0 l-4 12 l22 0 Z" fill="#2e2a22"/>
    ${lum ? `<circle cx="-15" cy="-90" r="24" fill="url(#haloG)"/>
      <path d="M-6 -87 L-24 -87 L-42 -6 L14 -6 Z" fill="url(#coneG)"/>
      <ellipse cx="-15" cy="-2" rx="30" ry="8" fill="url(#solHaloG)"/>
      <circle cx="-15" cy="-89" r="3.6" fill="#fff4d0"/>` : ""}
  </g>` : ""}

  ${E.banc ? `<g transform="translate(374 410)">
    <ellipse cx="20" cy="22" rx="26" ry="4" fill="#000" opacity=".24"/>
    <rect x="0" y="0" width="40" height="4" rx="2" fill="#7a5a3a"/>
    <rect x="0" y="6" width="40" height="4" rx="2" fill="#8a6642"/>
    <rect x="2" y="10" width="4" height="12" fill="#3a3630"/>
    <rect x="34" y="10" width="4" height="12" fill="#3a3630"/>
    <rect x="0" y="-10" width="40" height="3.4" rx="1.7" fill="#7a5a3a"/>
    <rect x="1" y="-10" width="3" height="12" fill="#3a3630"/>
    <rect x="36" y="-10" width="3" height="12" fill="#3a3630"/>
  </g>` : ""}
  ${E.jardiniere ? `<g transform="translate(86 402)">
    <ellipse cx="14" cy="30" rx="18" ry="4" fill="#000" opacity=".24"/>
    <path d="M2 12 L26 12 L23 30 L5 30 Z" fill="#8a6a4a"/>
    <rect x="0" y="9" width="28" height="5" rx="1.5" fill="#9a7a58"/>
    <path d="M14 12 q-13 -14 -4 -26 q9 9 4 26" fill="#3d6b3a"/>
    <path d="M14 12 q13 -16 5 -30 q-11 11 -5 30" fill="#4a7d46"/>
    <path d="M14 12 q-18 -6 -18 -20 q15 6 18 20" fill="#35603a"/>
  </g>` : ""}
  ${E.potelets ? `<g>
    ${[152, 200, 280, 328].map(x=>`<g transform="translate(${x} 400)">
      <ellipse cx="0" cy="30" rx="6" ry="2.4" fill="#000" opacity=".24"/>
      <rect x="-2.6" y="0" width="5.2" height="30" rx="2.6" fill="url(#laitonG)"/>
      <circle cx="0" cy="-2" r="4" fill="url(#laitonG)"/>
    </g>`).join("")}
    <path d="M152 398 q24 12 48 0 M280 398 q24 12 48 0" stroke="#8c1f2e"
      stroke-width="3" fill="none" opacity=".85"/>
  </g>` : ""}
  ${E.corbeille ? `<g transform="translate(444 416)">
    <ellipse cx="8" cy="24" rx="11" ry="3" fill="#000" opacity=".22"/>
    <path d="M0 0 L16 0 L14 24 L2 24 Z" fill="#3a3630"/>
    <rect x="-1" y="-2" width="18" height="3.4" rx="1.7" fill="#4a4640"/>
  </g>` : ""}
  ${E.pigeons ? `<g class="pigeons">
    ${[[142,382],[168,381],[402,383]].map(([x,y],i)=>`<g transform="translate(${x} ${y})"
      style="animation-delay:${(i*1.7).toFixed(1)}s">
      <ellipse cx="0" cy="-3" rx="5" ry="3.4" fill="#6a6a72"/>
      <circle cx="4.4" cy="-6" r="2.4" fill="#5a5a64"/>
      <path d="M6.6 -6.2 l2.4 .8 l-2.4 .8 Z" fill="#c08a3a"/>
      <path d="M-5 -3 l-3.4 1.4 l3 1.4 Z" fill="#5a5a64"/>
      <path d="M-1 0 l0 3 M2 0 l0 3" stroke="#c08a3a" stroke-width=".9"/>
    </g>`).join("")}
  </g>` : ""}
</g>

${enseigneVive ? `<g>
  <ellipse cx="240" cy="424" rx="180" ry="52" fill="url(#solHaloG)" opacity=".7"/>
  <ellipse cx="240" cy="392" rx="80" ry="18" fill="url(#solHaloG)" opacity=".5"/>
</g>` : ""}

<!-- ═══ PROJECTEURS DE PREMIÈRE ═══ -->
${E.projecteursCiel && lum ? `<g class="projecteurs" opacity=".5">
  <path d="M112 452 L46 0 L106 0 Z" fill="url(#coneG)" class="faisceauA"/>
  <path d="M368 452 L410 0 L470 0 Z" fill="url(#coneG)" class="faisceauB"/>
  <g transform="translate(104 434)">
    <ellipse cx="8" cy="12" rx="16" ry="4" fill="#000" opacity=".3"/>
    <path d="M0 12 L16 12 L13 2 L3 2 Z" fill="#3a3630"/>
    <ellipse cx="8" cy="2" rx="9" ry="3.4" fill="#fff4d0"/>
  </g>
  <g transform="translate(360 434)">
    <ellipse cx="8" cy="12" rx="16" ry="4" fill="#000" opacity=".3"/>
    <path d="M0 12 L16 12 L13 2 L3 2 Z" fill="#3a3630"/>
    <ellipse cx="8" cy="2" rx="9" ry="3.4" fill="#fff4d0"/>
  </g>
</g>` : ""}

</g>
<g transform="translate(0 ${DY})">
  <g id="planLoin"></g><g id="planMilieu"></g><g id="planProche"></g>
</g>

<rect width="480" height="${H}" fill="url(#grain)" opacity=".5" pointer-events="none"/>
<rect width="480" height="${H}" fill="url(#vignetteG)" pointer-events="none"/>
</svg>`;
}


/* ============================================================
   NUAGE VOLUMÉTRIQUE — sans flou

   Le flou gaussien étalait le nuage et le rendait laiteux. Ici le
   volume vient uniquement de la géométrie : une masse pleine et
   opaque, un ventre d'ombre plaqué dessous, une crête éclairée sur
   le dessus, et une couronne de bulbes arrondis sur le pourtour.
   Chaque bulbe de bord a son propre petit dégradé radial pour
   fondre proprement dans le ciel, ce qui donne un contour net mais
   pas dur — sans aucun filtre.
   ============================================================ */
function nuageVolumetrique(cx, cy, echelle = 1, densite = .7){
  const e = echelle;

  /* les bulbes de contour : ils dessinent la silhouette bombée.
     Chaque valeur r est le rayon ; ils se chevauchent largement. */
  const couronne = [
    {dx:-52, dy:  8, r:20}, {dx:-34, dy: -4, r:28}, {dx:-14, dy:-12, r:33},
    {dx:  8, dy:-16, r:35}, {dx: 30, dy:-11, r:30}, {dx: 50, dy: -2, r:24},
    {dx: 64, dy:  9, r:17}, {dx: 40, dy: 12, r:22}, {dx: 14, dy: 14, r:24},
    {dx:-14, dy: 13, r:23}, {dx:-38, dy: 12, r:18}
  ];

  /* la masse pleine centrale : un socle qui remplit l'intérieur,
     pour qu'aucun jour ne se voie entre les bulbes */
  const masse = `<path d="
    M${(cx-58*e).toFixed(1)} ${(cy+10*e).toFixed(1)}
    Q${(cx-52*e).toFixed(1)} ${(cy-14*e).toFixed(1)} ${(cx-28*e).toFixed(1)} ${(cy-16*e).toFixed(1)}
    Q${(cx-8*e).toFixed(1)} ${(cy-24*e).toFixed(1)} ${(cx+14*e).toFixed(1)} ${(cy-20*e).toFixed(1)}
    Q${(cx+42*e).toFixed(1)} ${(cy-20*e).toFixed(1)} ${(cx+52*e).toFixed(1)} ${(cy-2*e).toFixed(1)}
    Q${(cx+72*e).toFixed(1)} ${(cy+2*e).toFixed(1)} ${(cx+66*e).toFixed(1)} ${(cy+16*e).toFixed(1)}
    Q${(cx+40*e).toFixed(1)} ${(cy+22*e).toFixed(1)} ${(cx+10*e).toFixed(1)} ${(cy+20*e).toFixed(1)}
    Q${(cx-30*e).toFixed(1)} ${(cy+22*e).toFixed(1)} ${(cx-58*e).toFixed(1)} ${(cy+10*e).toFixed(1)} Z"
    fill="#ffffff"/>`;

  /* le socle plat du dessous : la ligne d'horizon du nuage */
  const socle = `<ellipse cx="${cx}" cy="${(cy + 15*e).toFixed(1)}"
    rx="${(66*e).toFixed(1)}" ry="${(11*e).toFixed(1)}" fill="#ffffff"/>`;

  /* les bulbes opaques : le blanc plein qui donne le relief */
  const bulbes = couronne.map(b =>
    `<circle cx="${(cx + b.dx*e).toFixed(1)}" cy="${(cy + b.dy*e).toFixed(1)}"
      r="${(b.r*e).toFixed(1)}" fill="#ffffff"/>`).join("");

  /* un fin liseré fondu sur le pourtour : les mêmes bulbes en
     dégradé radial, décalés d'un cheveu vers l'extérieur, pour un
     bord qui respire au lieu de trancher */
  const ourlet = couronne.map(b =>
    `<circle cx="${(cx + b.dx*e*1.03).toFixed(1)}" cy="${(cy + b.dy*e*1.03).toFixed(1)}"
      r="${(b.r*e*1.12).toFixed(1)}" fill="url(#nuageBordG)"/>`).join("");

  /* le ventre d'ombre : plaqué sous la masse, teinte froide */
  const ventre = `<ellipse cx="${(cx + 4*e).toFixed(1)}" cy="${(cy + 12*e).toFixed(1)}"
    rx="${(54*e).toFixed(1)}" ry="${(13*e).toFixed(1)}" fill="url(#nuageVentreG)"/>`;

  /* la crête éclairée : deux bosses claires sur le dessus */
  const crete = `
    <ellipse cx="${(cx - 6*e).toFixed(1)}" cy="${(cy - 13*e).toFixed(1)}"
      rx="${(30*e).toFixed(1)}" ry="${(12*e).toFixed(1)}" fill="url(#nuageCreteG)"/>
    <ellipse cx="${(cx + 26*e).toFixed(1)}" cy="${(cy - 9*e).toFixed(1)}"
      rx="${(18*e).toFixed(1)}" ry="${(8*e).toFixed(1)}" fill="url(#nuageCreteG)"/>`;

  return `<g opacity="${densite.toFixed(2)}">
    ${ourlet}
    ${masse}${socle}${bulbes}
    ${ventre}
    ${crete}
  </g>`;
}

/* vitrine : toujours vitrée, le caisson s'anoblit avec les niveaux */
function vitrineEtat(x, y, l, h, seance, lum, E){
  const COUL = {"Drame":"#1f3a5c","Aventure":"#1d5c52","Animation":"#4a3f8c",
    "Documentaire":"#2a6b6b","Thriller familial":"#3a2a52","Comédie":"#c07a1f",
    "Romance":"#a83a5c","défaut":"#5a2a34"};
  const c = COUL[(seance && seance.genre)] || COUL["défaut"];
  const lignes = seance ? decoupe(String(seance.titre).toUpperCase(), 12).slice(0,3) : [];

  return `<g>
    <rect x="${x-4}" y="${y-4}" width="${l+8}" height="${h+8}" rx="2"
      fill="${E.vitrinesLaiton ? "url(#laitonG)" : "#5a5044"}"/>
    <rect x="${x-2}" y="${y-2}" width="${l+4}" height="${h+4}" rx="1" fill="#1a1218"/>
    ${seance ? `
      <rect x="${x}" y="${y}" width="${l}" height="${h}" fill="${c}"/>
      <rect x="${x}" y="${y}" width="${l}" height="${h}" fill="url(#afficheG)"/>
      <circle cx="${x + l/2}" cy="${y + h*.3}" r="${l*.22}" fill="#fff" opacity=".16"/>
      ${lignes.map((ln,i)=>`<text x="${x + l/2}" y="${y + h*.62 + i*9}" text-anchor="middle"
        font-family="Georgia" font-size="7" font-weight="bold" fill="#fdf3d2"
        letter-spacing=".4">${ln}</text>`).join("")}
      <text x="${x + l/2}" y="${y + h - 7}" text-anchor="middle" font-family="Courier New"
        font-size="6.5" fill="#fdf3d2" opacity=".75" letter-spacing="1">${seance.heure || ""}</text>`
    : `<rect x="${x}" y="${y}" width="${l}" height="${h}" fill="#2a241f"/>
      <text x="${x + l/2}" y="${y + h/2}" text-anchor="middle" font-family="Courier New"
        font-size="8" fill="#8a7e70" opacity=".5" letter-spacing="1.5">PROCHAINEMENT</text>`}
    <rect x="${x}" y="${y}" width="${l}" height="${h*.4}" fill="url(#refletCielG)" opacity=".5"/>
    <path d="M${x} ${y+h} L${x + l*.55} ${y} L${x + l*.85} ${y} L${x + l*.3} ${y+h} Z"
      fill="#fff" opacity="${E.vitrinesLaiton ? ".085" : ".055"}"/>
    <path d="M${x + l*.78} ${y+h} L${x+l} ${y + h*.52} L${x+l} ${y + h*.7} L${x + l*.9} ${y+h} Z"
      fill="#fff" opacity=".04"/>
    ${lum ? `<rect x="${x}" y="${y}" width="${l}" height="${h}" fill="#ffdf9a" opacity=".07"/>` : ""}
  </g>`;
}

/* ampoules qui défilent, pour les soirs de première */
function ampoulesChenillard(x1, x2, y, n, r = 2.4){
  const pas = (x2 - x1) / (n - 1);
  return [...Array(n)].map((_,i)=>
    `<circle cx="${(x1 + i*pas).toFixed(1)}" cy="${y}" r="${r}"
      fill="url(#ampouleG)" class="chenille" style="animation-delay:${(i*.09).toFixed(2)}s"/>`).join("");
}

/* ---- exports ---- */
export {
  ampoulesChenillard,
  appareilPierre,
  immeubleVoisin,
  geometrieSelonEcran,
  dessineFacadeEvolutive,
  nuageVolumetrique,
  vitrineEtat
};








