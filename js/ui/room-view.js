import { couleurSiegesCle } from "../data/customization.js?v=2ab9afab";
import { bulleSalles, ouvrePanneauEquipement } from "../rooms.js?v=2ab9afab";
import { A } from "./genre-posters.js?v=2ab9afab";

/* ============================================================
   LES QUATRE SALLES

   Une seule fonction, quatre profils. Ce qui change n'est pas
   la décoration : c'est la géométrie. Une salle de quartier a le
   sol plat et les rangs droits ; une grande salle a des gradins
   incurvés ; une salle 4DX a des fauteuils sur vérins, montés par
   blocs de quatre, avec les buses et les ventilateurs autour.
   ============================================================ */

/* ------------------------------------------------------------
   LA GÉOMÉTRIE DÉCOULE DE LA CAPACITÉ

   Les salles du jeu vont de 40 places (salle 2) à 125 (salle 1
   entièrement agrandie). Le dessin doit compter exactement le bon
   nombre de fauteuils : un joueur qui lit « 80 places » et en
   compte 74 à l'écran perd confiance dans tout le reste.

   On répartit donc la capacité sur des rangs qui s'élargissent
   vers le fond, et on ajuste le reste sur les derniers rangs.
   ------------------------------------------------------------ */
function repartitionSalle(capacite, allee){
  const cap = Math.max(8, Math.round(capacite));
  /* le nombre de rangs suit la racine : une salle deux fois plus
     grande n'est pas deux fois plus longue, elle est aussi plus large */
  const rangs = Math.max(4, Math.min(13, Math.round(Math.sqrt(cap / 1.55))));
  const rows = [];
  /* progression linéaire du premier au dernier rang, de 0,78 à 1,22 fois la moyenne */
  let total = 0;
  for(let k = 0; k < rangs; k++){
    const t = rangs === 1 ? .5 : k / (rangs - 1);
    const part = 0.78 + t * 0.44;
    rows.push(part);
    total += part;
  }
  const brut = rows.map(r => Math.max(3, Math.round(cap * r / total)));
  /* on corrige l'arrondi sur les rangs du fond, les plus longs */
  let reste = cap - brut.reduce((a, b) => a + b, 0);
  for(let k = rangs - 1; reste !== 0 && k >= 0; k--){
    const d = reste > 0 ? 1 : -1;
    if(brut[k] + d >= 3){ brut[k] += d; reste -= d; }
    if(k === 0) k = rangs;          /* on repasse si nécessaire */
  }
  return brut;
}

/* les profils ne portent plus que le style : la taille vient des données */
const PROFILS = {
  quartier: {
    nom:"Salle de quartier", seuil:0,
    largeur:[178,244], courbe:[0,4], taille:[.62,.92], pente:1.3, allee:false,
    ecran:{h:74, courbe:0, or:false, rideaux:"simples", lambrequin:false},
    murs:"papier", plafond:"plat", veilleuses:false, gradins:false
  },
  standard: {
    nom:"Salle", seuil:70,
    largeur:[176,278], courbe:[4,10], taille:[.56,.86], pente:1.2, allee:false,
    ecran:{h:92, courbe:3, or:true, rideaux:"velours", lambrequin:false},
    murs:"tentures", plafond:"corniche", veilleuses:true, gradins:true
  },
  grande: {
    nom:"Grande salle", seuil:105,
    largeur:[178,320], courbe:[7,16], taille:[.52,.84], pente:1.14, allee:true,
    ecran:{h:108, courbe:5, or:true, rideaux:"velours", lambrequin:true},
    murs:"acoustique", plafond:"baffles", veilleuses:true, gradins:true
  },
  quatred: {
    nom:"Salle 4DX", seuil:null,
    largeur:[196,306], courbe:[6,13], taille:[.62,.94], pente:1.18, allee:true,
    ecran:{h:100, courbe:8, or:false, rideaux:"aucun", lambrequin:false},
    murs:"technique", plafond:"technique", veilleuses:true, gradins:true,
    verins:true, buses:true, ventilateurs:true
  }
};

/* le style se déduit de la capacité, sauf si la salle a un type propre */
function profilSalle(salle){
  if((salle.type || "") === "4dx") return "quatred";
  const c = Number(salle.capacite) || 40;
  if(c >= PROFILS.grande.seuil) return "grande";
  if(c >= PROFILS.standard.seuil) return "standard";
  return "quartier";
}

const TEINTES = {
  rouge:   {clair:"#c4404f", base:"#a82b3d", sombre:"#6e1424", dossier:"#8c2331"},
  bordeaux:{clair:"#8c2438", base:"#6e1424", sombre:"#480d18", dossier:"#5a1020"},
  bleu:    {clair:"#3c5090", base:"#2a3a6b", sombre:"#1a2648", dossier:"#243358"},
  vert:    {clair:"#3a7a5c", base:"#2a5a42", sombre:"#1a3a2a", dossier:"#224a36"},
  cuir:    {clair:"#4a4650", base:"#33303a", sombre:"#1e1c24", dossier:"#3d3a46"}
};

const AMBIANCES_S = {
  salle:      {fond:"#3a2a30", mur:"#4a3238", sol:"#5a2028", ecranOp:.55, faisceau:".05"},
  tamise:     {fond:"#241820", mur:"#2e1e26", sol:"#3e1620", ecranOp:.78, faisceau:".11"},
  projection: {fond:"#140c12", mur:"#1a1018", sol:"#240c14", ecranOp:1,   faisceau:".2"}
};



function dessineSalleType(o = {}){
  const salle = o.salle || {capacite: o.capacite || 80, type: o.type};
  const type = o.type && PROFILS[o.type] ? o.type : profilSalle(salle);
  const P = PROFILS[type];
  const rows = repartitionSalle(salle.capacite, P.allee);
  const rangs = rows.length;
  const A = AMBIANCES_S[o.lumiere || "projection"];
  const F = TEINTES[type === "quatred" ? (o.couleur || "cuir") : (o.couleur || "rouge")];
  const allume = o.ecran !== false;
  const remplissage = Number(o.public ?? 0);
  const r1 = n => Math.round(n * 10) / 10;
  const yE = 40 + P.ecran.h;                      /* bas de l'écran */
  const ySol = yE + 22;

  const t01 = k => rangs === 1 ? 0 : k / (rangs - 1);
  const yRang   = k => ySol + 10 + Math.pow(t01(k), P.pente) * (348 - ySol);
  const largeur = k => P.largeur[0] + t01(k) * (P.largeur[1] - P.largeur[0]);
  const courbe  = k => P.courbe[0] + t01(k) * (P.courbe[1] - P.courbe[0]);
  const taille  = k => P.taille[0] + Math.pow(t01(k), 1.1) * (P.taille[1] - P.taille[0]);
  const parRang = k => rows[k];

  /* ---------- un fauteuil ---------- */
  const fauteuil = (e, occupe, k) => {
    const l = r1(13 * e), h = r1(15 * e);
    const peau = ["#f2cfa8","#e4b892","#cb9d72","#ac8156","#8d6242"][(k * 7) % 5];
    const chev = ["#2a1c14","#4a3527","#7a5a3a","#1c1410"][(k * 5) % 4];
    return `<g>`
      + (P.verins
        ? `<path d="M${r1(-l*.34)} ${r1(h*.16)} l${r1(l*.68)} 0 l${r1(-l*.1)} ${r1(h*.3)}`
          + ` l${r1(-l*.48)} 0 Z" fill="#2a2830"/>`
          + `<rect x="${r1(-l*.44)}" y="${r1(h*.04)}" width="${r1(l*.88)}"`
          + ` height="${r1(h*.14)}" rx="${r1(h*.06)}" fill="#4a4854"/>`
        : "")
      + `<path d="M${r1(-l*.46)} ${r1(-h*.7)} q${r1(l*.46)} ${r1(-h*.16)} ${r1(l*.92)} 0`
      + ` l0 ${r1(h*.82)} l${r1(-l*.92)} 0 Z" fill="${F.dossier}"/>`
      + `<path d="M${r1(-l*.46)} ${r1(-h*.7)} q${r1(l*.46)} ${r1(-h*.16)} ${r1(l*.92)} 0`
      + ` l0 ${r1(h*.16)} l${r1(-l*.92)} 0 Z" fill="${F.clair}" opacity=".5"/>`
      + `<rect x="${r1(l*.44)}" y="${r1(-h*.6)}" width="${r1(l*.18)}" height="${r1(h*.7)}"`
      + ` rx="${r1(l*.09)}" fill="${F.sombre}"/>`
      + (P.verins ? `<rect x="${r1(-l*.5)}" y="${r1(-h*.3)}" width="${r1(l*.06)}"`
        + ` height="${r1(h*.4)}" fill="#5cd8e8" opacity=".7"/>` : "")
      + (occupe
        ? `<circle cy="${r1(-h*.88)}" r="${r1(l*.23)}" fill="${peau}"/>`
          + `<path d="M${r1(-l*.23)} ${r1(-h*.96)} q${r1(l*.23)} ${r1(-l*.26)} ${r1(l*.46)} 0`
          + ` l${r1(-l*.06)} ${r1(l*.24)} l${r1(-l*.34)} 0 Z" fill="${chev}"/>`
        : "")
      + `</g>`;
  };

  /* ---------- les rangs ---------- */
  let motifs = "", gradins = "";
  for(let k = rangs - 1; k >= 0; k--){
    const y = yRang(k), L = largeur(k), c = courbe(k), e = taille(k);
    /* l'allée n'ampute pas le rang : elle l'écarte. Le compte reste exact. */
    const n = parRang(k);
    const coupe = P.allee && n >= 12;

    motifs += `<g id="v${k}">${fauteuil(e, false, k)}</g>`;
    for(let v = 0; v < 4; v++)
      motifs += `<g id="o${k}_${v}">${fauteuil(e, true, k * 4 + v * 7)}</g>`;

    if(P.gradins){
      gradins += `<path d="M${(240-L/2).toFixed(0)} ${(y+9*e).toFixed(1)}`
        + ` q${(L/2).toFixed(0)} ${(c*.5).toFixed(1)} ${L.toFixed(0)} 0`
        + ` l0 ${(10*e).toFixed(1)} q${(-L/2).toFixed(0)} ${(-c*.5).toFixed(1)} ${(-L).toFixed(0)} 0 Z"
        fill="#1c1218" opacity=".5"/>`;
      if(P.veilleuses && o.lumiere !== "salle")
        gradins += `<path d="M${(240-L/2).toFixed(0)} ${(y+9*e).toFixed(1)}`
          + ` q${(L/2).toFixed(0)} ${(c*.5).toFixed(1)} ${L.toFixed(0)} 0"
          stroke="${P.verins ? "#5cd8e8" : "#4a7a9a"}" stroke-width="${(1.2*e).toFixed(1)}"
          fill="none" opacity=".45"/>`;
    }

    for(let i = 0; i < n; i++){
      const t = n === 1 ? .5 : i / (n - 1);
      /* l'allée écarte les deux moitiés du rang au lieu de retirer des places */
      const dec = coupe ? (i < n / 2 ? -L * .055 : L * .055) : 0;
      const x = 240 - L/2 + t * L * (coupe ? .89 : 1) + (coupe ? L * .055 : 0) + dec;
      const yy = y - Math.sin(Math.PI * t) * c;
      const occ = Math.random() * 100 < remplissage * (0.6 + 0.8 * (1 - k / rangs));
      gradins += `<use href="#${occ ? "o"+k+"_"+((i*3+k)%4) : "v"+k}"`
        + ` x="${Math.round(x)}" y="${Math.round(yy)}"/>`;
    }
  }

  /* ---------- l'écran et son encadrement ---------- */
  const E = P.ecran, cb = E.courbe;
  const ecran = `
    <path d="M56 34 L424 34 L424 ${yE+10} L56 ${yE+10} Z" fill="#0a0508"/>
    <path d="M70 44 L410 44 q${cb} ${(E.h-14)/2} 0 ${E.h-14} L70 ${yE} q${-cb} ${-(E.h-14)/2} 0 ${-(E.h-14)} Z"
      fill="url(#sEcran)" opacity="${A.ecranOp}"/>
    ${allume
      ? `<path d="M70 44 L410 44 q${cb} ${(E.h-14)/2} 0 ${E.h-14} L70 ${yE} q${-cb} ${-(E.h-14)/2} 0 ${-(E.h-14)} Z"
          fill="#fff" opacity=".1" class="sScint"/>`
      : `<path d="M70 44 L410 44 q${cb} ${(E.h-14)/2} 0 ${E.h-14} L70 ${yE} q${-cb} ${-(E.h-14)/2} 0 ${-(E.h-14)} Z"
          fill="#0a0508" opacity=".82"/>`}
    ${E.or ? `<path d="M70 44 L410 44 q${cb} ${(E.h-14)/2} 0 ${E.h-14} L70 ${yE} q${-cb} ${-(E.h-14)/2} 0 ${-(E.h-14)} Z"
      fill="none" stroke="url(#sOr)" stroke-width="2.4"/>` : ""}
    ${E.rideaux === "velours" ? `
      <path d="M56 34 q-14 ${(E.h+8)/2} 0 ${E.h+8} l-26 0 l0 ${-(E.h+8)} Z" fill="url(#sVelours)"/>
      <path d="M424 34 q14 ${(E.h+8)/2} 0 ${E.h+8} l26 0 l0 ${-(E.h+8)} Z" fill="url(#sVelours)"/>
      <g stroke="#000" stroke-opacity=".22" stroke-width="1.4">
        ${[36,44,52].map(x=>`<path d="M${x} 34 q-4 ${(E.h+8)/2} 0 ${E.h+8}"/>`).join("")}
        ${[428,436,444].map(x=>`<path d="M${x} 34 q4 ${(E.h+8)/2} 0 ${E.h+8}"/>`).join("")}
      </g>`
    : E.rideaux === "simples" ? `
      <path d="M56 34 l0 ${E.h+8} l-24 0 l0 ${-(E.h+8)} Z" fill="#6e1424"/>
      <path d="M424 34 l0 ${E.h+8} l24 0 l0 ${-(E.h+8)} Z" fill="#6e1424"/>`
    : `<g fill="#1a1c22">
      <path d="M30 34 L56 34 L56 ${yE+10} L30 ${yE+10} Z"/>
      <path d="M424 34 L450 34 L450 ${yE+10} L424 ${yE+10} Z"/></g>
      <g fill="#5cd8e8" opacity=".55">
        <rect x="40" y="52" width="3" height="${E.h-30}" rx="1.5"/>
        <rect x="437" y="52" width="3" height="${E.h-30}" rx="1.5"/></g>`}
    ${E.lambrequin ? `
      <path d="M30 28 L450 28 L450 42 q-105 14 -210 0 q-105 -14 -210 0 Z" fill="url(#sVelours)"/>
      <path d="M30 28 L450 28 L450 32 L30 32 Z" fill="url(#sOr)" opacity=".8"/>` : ""}`;

  /* ---------- plafond ---------- */
  const plafond = P.plafond === "baffles"
    ? `<path d="M0 0 L480 0 L480 22 L0 34 Z" fill="#1e1620"/>
       <g fill="#2a2028">${[...Array(7)].map((_,k)=>
         `<path d="M${k*70} ${6+k} l58 -1.2 l0 7 l-58 1.4 Z"/>`).join("")}</g>`
    : P.plafond === "technique"
    ? `<path d="M0 0 L480 0 L480 22 L0 32 Z" fill="#161a20"/>
       <g stroke="#2a3038" stroke-width="2" fill="none">
         ${[...Array(5)].map((_,k)=>`<path d="M${20+k*110} 0 L${20+k*110} 26"/>`).join("")}</g>
       <g fill="#5cd8e8" opacity=".5">${[70,180,290,400].map(x=>
         `<rect x="${x}" y="18" width="26" height="2.4" rx="1.2"/>`).join("")}</g>`
    : P.plafond === "corniche"
    ? `<path d="M0 0 L480 0 L480 20 L0 28 Z" fill="#241a20"/>
       <rect y="24" width="480" height="3" fill="url(#sOr)" opacity=".5"/>`
    : `<path d="M0 0 L480 0 L480 18 L0 24 Z" fill="#2a2028"/>`;

  /* ---------- murs ---------- */
  const murs = P.murs === "acoustique"
    ? `<g opacity=".9">${[0,1,2].map(k=>{const y = ySol + 4 + k*62;
        return `<path d="M0 ${y} L${34-k*4} ${y+14} L${34-k*4} ${y+48} L0 ${y+58} Z" fill="#241820"/>
          <path d="M480 ${y} L${446+k*4} ${y+14} L${446+k*4} ${y+48} L480 ${y+58} Z" fill="#241820"/>`;
      }).join("")}</g>`
    : P.murs === "technique"
    ? `<g fill="#1a1e24">
        <path d="M0 ${ySol} L38 ${ySol+16} L38 348 L0 372 Z"/>
        <path d="M480 ${ySol} L442 ${ySol+16} L442 348 L480 372 Z"/></g>
       <g fill="#5cd8e8" opacity=".45">
        ${[0,1,2,3].map(k=>`<rect x="8" y="${ySol+26+k*54}" width="3" height="30" rx="1.5"/>
          <rect x="469" y="${ySol+26+k*54}" width="3" height="30" rx="1.5"/>`).join("")}</g>`
    : P.murs === "tentures"
    ? `<g fill="#3a1c26">
        <path d="M0 ${ySol} L30 ${ySol+14} L30 350 L0 372 Z"/>
        <path d="M480 ${ySol} L450 ${ySol+14} L450 350 L480 372 Z"/></g>`
    : `<g fill="#43323a" opacity=".5">
        <path d="M0 ${ySol} L26 ${ySol+12} L26 352 L0 374 Z"/>
        <path d="M480 ${ySol} L454 ${ySol+12} L454 352 L480 374 Z"/></g>`;

  /* ---------- les équipements 4DX ---------- */
  const effets4d = !P.buses ? "" : `
    <g class="s4d">
      ${[0,1,2].map(k=>{const y = ySol + 40 + k*82;
        return `<g transform="translate(30 ${y})">
          <rect x="-8" y="-6" width="16" height="12" rx="3" fill="#2a3038"/>
          <circle cx="0" cy="0" r="3" fill="#5cd8e8" class="sBuse b${k}"/>
          <path d="M8 0 q22 -4 40 2" stroke="#5cd8e8" stroke-width="1.4" fill="none"
            opacity=".35" class="sJet j${k}"/></g>
        <g transform="translate(450 ${y})">
          <rect x="-8" y="-6" width="16" height="12" rx="3" fill="#2a3038"/>
          <circle cx="0" cy="0" r="3" fill="#5cd8e8" class="sBuse b${k}"/>
          <path d="M-8 0 q-22 -4 -40 2" stroke="#5cd8e8" stroke-width="1.4" fill="none"
            opacity=".35" class="sJet j${k}"/></g>`;}).join("")}
      ${[[60, ySol+18],[420, ySol+18]].map(([x,y])=>`<g transform="translate(${x} ${y})">
        <circle r="13" fill="#1e232a" stroke="#3a444e" stroke-width="1.6"/>
        <g class="sPale">${[0,1,2,3].map(k=>
          `<path d="M0 0 l7 -4 l0 8 Z" transform="rotate(${k*90})" fill="#5a6672"/>`).join("")}</g>
        <circle r="2.4" fill="#2a3038"/></g>`).join("")}
    </g>`;

  return `
<svg viewBox="0 0 480 380" class="salleType" xmlns="http://www.w3.org/2000/svg"
  role="img" aria-label="${P.nom}">
<defs>
  <linearGradient id="sFond" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${A.mur}"/><stop offset="1" stop-color="${A.fond}"/></linearGradient>
  <linearGradient id="sEcran" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#fffdf2"/><stop offset=".5" stop-color="#f0e4c0"/>
    <stop offset="1" stop-color="#cbbb92"/></linearGradient>
  <linearGradient id="sSol" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${A.sol}"/><stop offset="1" stop-color="#1a0c12"/></linearGradient>
  <linearGradient id="sVelours" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#5a0e1a"/><stop offset=".5" stop-color="#8c2331"/>
    <stop offset="1" stop-color="#5a0e1a"/></linearGradient>
  <linearGradient id="sOr" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#f7dd9a"/><stop offset=".5" stop-color="#caa24a"/>
    <stop offset="1" stop-color="#8a6c2a"/></linearGradient>
  <radialGradient id="sLueur" cx=".5" cy="0" r="1">
    <stop offset="0" stop-color="#fff4d0" stop-opacity="${(A.ecranOp*.5).toFixed(2)}"/>
    <stop offset="1" stop-color="#fff4d0" stop-opacity="0"/></radialGradient>
  <radialGradient id="sSpot" cx=".5" cy=".5" r=".5">
    <stop offset="0" stop-color="#ffdf9a" stop-opacity=".5"/>
    <stop offset="1" stop-color="#ffdf9a" stop-opacity="0"/></radialGradient>
  <linearGradient id="sFaisceau" x1="0" y1="1" x2="0" y2="0">
    <stop offset="0" stop-color="#ffe9b0" stop-opacity="0"/>
    <stop offset="1" stop-color="#ffe9b0" stop-opacity="${A.faisceau}"/></linearGradient>
  <radialGradient id="sVign" cx=".5" cy=".42" r=".76">
    <stop offset=".5" stop-color="#000" stop-opacity="0"/>
    <stop offset="1" stop-color="#000" stop-opacity=".5"/></radialGradient>
  <pattern id="sGrain" width="60" height="60" patternUnits="userSpaceOnUse">
    ${[...Array(36)].map(()=>`<circle cx="${(Math.random()*60).toFixed(1)}"
      cy="${(Math.random()*60).toFixed(1)}" r=".45" fill="#fff" opacity=".05"/>`).join("")}</pattern>
  ${motifs}
</defs>

<rect width="480" height="380" fill="url(#sFond)"/>
${plafond}
${(o.lumiere === "salle") ? `<g>${[80,180,300,400].map((x,k)=>
  `<circle cx="${x}" cy="${16+k*2}" r="3.2" fill="#ffdf9a"/>
   <circle cx="${x}" cy="${16+k*2}" r="20" fill="url(#sSpot)"/>`).join("")}</g>` : ""}

${ecran}

<rect y="${yE}" width="480" height="${380-yE}" fill="url(#sLueur)"/>
<path d="M240 360 L70 ${yE+4} L410 ${yE+4} Z" fill="url(#sFaisceau)"/>

${murs}

<path d="M0 ${ySol} L480 ${ySol} L480 380 L0 380 Z" fill="url(#sSol)"/>
${P.allee ? `<path d="M216 ${ySol+8} L264 ${ySol+8} L292 380 L188 380 Z"
  fill="#1a0c12" opacity=".55"/>` : ""}
${P.veilleuses ? `<g opacity="${o.lumiere === "salle" ? .25 : .6}">
  ${[...Array(5)].map((_,k)=>{const y = ySol + 34 + k*34;
    return `<circle cx="${196-k*3}" cy="${y}" r="1.6" fill="${P.verins ? "#5cd8e8" : "#4a7a9a"}"/>
      <circle cx="${284+k*3}" cy="${y}" r="1.6" fill="${P.verins ? "#5cd8e8" : "#4a7a9a"}"/>`;
  }).join("")}</g>` : ""}

${effets4d}
${gradins}

<g>
  <path d="M186 372 L294 372 L294 380 L186 380 Z" fill="#0d0810"/>
  <rect x="204" y="354" width="72" height="20" rx="3" fill="#160e14"
    stroke="${P.verins ? "#3a444e" : "url(#sOr)"}" stroke-width="1.5"/>
  <rect x="210" y="358" width="26" height="12" rx="2" fill="#0a0508"/>
  <rect x="244" y="358" width="26" height="12" rx="2" fill="#0a0508"/>
  ${allume ? `<circle cx="223" cy="364" r="2.6" fill="#ffe9b0" class="sLent"/>` : ""}
</g>

<g>${[[26, ySol-2],[454, ySol-2]].map(([x,y])=>`<g transform="translate(${x} ${y})">
  <rect x="-16" y="-11" width="32" height="15" rx="2" fill="#0f2a18" stroke="#2f7d4a" stroke-width="1.2"/>
  <text y="0" text-anchor="middle" font-family="Courier New" font-size="7"
    letter-spacing=".6" fill="#5cd88a">SORTIE</text>
  <circle cy="-4" r="14" fill="#2f7d4a" opacity=".16"/></g>`).join("")}</g>

<g transform="translate(${P.verins ? 190 : 196} 14)">
  <rect width="${P.verins ? 100 : 88}" height="18" rx="3" fill="#160e14"
    stroke="${P.verins ? "#5cd8e8" : "url(#sOr)"}" stroke-width="1.4"/>
  <text x="${P.verins ? 50 : 44}" y="12.6" text-anchor="middle" font-family="Courier New"
    font-size="8" letter-spacing="1.4"
    fill="${P.verins ? "#9fe8f2" : "#f7dd9a"}">${(salle.nom || o.nom || P.nom).toUpperCase()}</text>
</g>

<rect width="480" height="380" fill="url(#sGrain)" opacity=".45" pointer-events="none"/>
<rect width="480" height="380" fill="url(#sVign)" pointer-events="none"/>
</svg>`;
}


/* ------------------------------------------------------------
   L'ANCIENNE PORTE D'ENTRÉE
   Le reste du jeu appelle salleEnCoupe(salle). On la conserve :
   elle choisit désormais le profil d'après la capacité réelle.
   ------------------------------------------------------------ */
function salleEnCoupe(salle, opts = {}){
  if(!salle) return "";
  return dessineSalleType({
    salle,
    lumiere: opts.lumiere || "projection",
    public: Number(opts.public ?? 0),
    couleur: opts.couleur || couleurSiegesCle(),
    ecran: opts.ecran !== false
  });
}

function apercuEquipement(cle, niveau){
  const cleC = (typeof couleurSiegesCle === "function") ? couleurSiegesCle() : "rouge";
  const F = COULEURS_FAUTEUIL[cleC] || COULEURS_FAUTEUIL.rouge;
  const N = Math.max(0, Math.min(3, niveau));
  let contenu = "";

  if(cle === "sieges"){
    contenu = `<rect width="120" height="90" fill="#2a1a22"/>
      ${[0,1,2].map(r=>`<g opacity="${.6 + r*.2}">
        ${[0,1,2].map(i=>fauteuil(24 + i*36, 34 + r*20, .9 + r*.16, F, N, 100, i)).join("")}
      </g>`).join("")}`;
  }
  else if(cle === "ecran"){
    const l = 62 + N*12, e = [0.4,0.6,0.8,1][N];
    contenu = `<rect width="120" height="90" fill="#1a1218"/>
      <rect x="${60 - l/2 - 4}" y="20" width="${l + 8}" height="${l*0.42 + 8}" rx="2"
        fill="#0d0508" stroke="#caa24a" stroke-width="1.6"/>
      <rect x="${60 - l/2}" y="24" width="${l}" height="${l*0.42}" fill="#fff8e2" opacity="${e}"/>
      ${N >= 2 ? `<ellipse cx="60" cy="${24 + l*0.21}" rx="${l*0.7}" ry="${l*0.4}"
        fill="#fff8e2" opacity=".12"/>` : ""}`;
  }
  else if(cle === "son"){
    contenu = `<rect width="120" height="90" fill="#1a1218"/>
      ${[[26,28],[94,28]].concat(N>=2?[[26,56],[94,56]]:[]).concat(N>=3?[[60,72]]:[])
        .map(([x,y])=>`<g transform="translate(${x} ${y})">
          <rect x="-9" y="-12" width="18" height="26" rx="2" fill="#241c22" stroke="#5a4a38" stroke-width="1.2"/>
          <circle cx="0" cy="-3" r="5" fill="#2a2028" stroke="#6a5a48" stroke-width="1"/>
          <circle cx="0" cy="8" r="3" fill="#2a2028"/>
          ${N>=1?`<circle cx="0" cy="-3" r="7" fill="none" stroke="#caa24a"
            stroke-width="1" opacity=".4"/>`:""}
        </g>`).join("")}`;
  }
  else if(cle === "decoration"){
    const murs = ["#2e2028","#3a2430","#43202e","#4a1c2c"][N];
    contenu = `<rect width="120" height="90" fill="${murs}"/>
      ${N>=1?`<g stroke="#caa24a" stroke-width="1" opacity=".4" fill="none">
        <path d="M0 26 L120 26"/><path d="M0 31 L120 31"/></g>`:""}
      ${N>=2?`<g fill="#caa24a" opacity=".25">
        <rect x="14" y="36" width="7" height="30" rx="3.5"/>
        <rect x="99" y="36" width="7" height="30" rx="3.5"/></g>`:""}
      ${N>=3?`<path d="M8 34 q8 -14 16 0 l0 34 l-16 0Z" fill="#8c2331" opacity=".55"/>
        <path d="M96 34 q8 -14 16 0 l0 34 l-16 0Z" fill="#8c2331" opacity=".55"/>`:""}
      <path d="M46 40 L74 40 L86 90 L34 90 Z" fill="#8c1f2e" opacity=".75"/>
      ${N>=1?`<path d="M48 40 L37 90 M72 40 L83 90" stroke="#e8b84b"
        stroke-width="1.2" opacity=".5"/>`:""}`;
  }
  else if(cle === "climatisation"){
    contenu = `<rect width="120" height="90" fill="#1f1a24"/>
      <rect x="38" y="22" width="44" height="14" rx="3" fill="#2a2830" stroke="#4a4a52" stroke-width="1.2"/>
      ${N >= 1 ? [...Array(N*2+1)].map((_,i)=>`<line x1="${44+i*7}" y1="36" x2="${40+i*7}" y2="${48+N*6}"
        stroke="#8fb6d8" stroke-width="1.4" opacity=".55"/>`).join("") : ""}
      <text x="60" y="80" text-anchor="middle" font-family="Courier New" font-size="9"
        fill="${N>=2?"#8fb6d8":"#5a5a62"}">${N === 0 ? "aucune" : N === 3 ? "silencieuse" : N + " / 3"}</text>`;
  }
  return `<svg viewBox="0 0 120 90" class="apercuEquip" xmlns="http://www.w3.org/2000/svg"
    role="img" aria-label="Aperçu niveau ${N}">${contenu}</svg>`;
}

function brancheZonesSalle(conteneur, salle){
  conteneur.querySelectorAll(".zoneSalle").forEach(z=>{
    const cle = z.dataset.cle;
    const declenche = ()=>{
      z.classList.add("touchee");
      setTimeout(()=>z.classList.remove("touchee"), 420);
      if(cle === "projecteur"){ bulleSalles(MOTS_ZONES.projecteur); return; }
      ouvrePanneauEquipement(cle, salle);
    };
    z.addEventListener("click", declenche);
    z.addEventListener("keydown", e=>{
      if(e.key === "Enter" || e.key === " "){ e.preventDefault(); declenche(); }
    });
  });
}

/* ---- exports ---- */
export {
  AMBIANCES_S,
  PROFILS,
  TEINTES,
  apercuEquipement,
  brancheZonesSalle,
  dessineSalleType,
  profilSalle,
  repartitionSalle,
  salleEnCoupe
};
