import { etatBatiment, murSelonEtat } from "./ages.js?v=2ab9afab";
import { ampoules, pilastre } from "./palettes.js?v=2ab9afab";
import { salles } from "../rooms.js?v=2ab9afab";

/* ============================================================
   LE HALL ÉVOLUTIF — même langage graphique que la façade

   Repris de facade-evo.js, sans rien réinventer :
     · les mêmes dégradés — pierreG, orG, laitonG, tapisG,
       ampouleG, haloG, coneG, vignetteG, grain
     · les mêmes gestes — gradins art déco, pilastres cannelés
       avec chapiteau et base, filets dorés, rangées d'ampoules,
       rideaux de velours, caissons en laiton
     · le même vieillissement — usure, salissure, écaillures,
       coulures, éclat de l'or qui dépend de l'âge
     · la même atmosphère — grain de film et vignettage par-dessus

   Le format 480 × 380 reprend la largeur de la façade pour que
   les deux vues se succèdent sans changement d'échelle.
   ============================================================ */

const PALETTES_HALL = {
  matin:      {mur:["#c9a882","#a8875f"], murOmbre:"#8a6c48", pierre:"#d8c0a0",
               sol:["#b8a488","#8a7a62"], plafond:"#7a6a58", vignette:.22, chaud:.10},
  aprem:      {mur:["#d8b48c","#b8926a"], murOmbre:"#967452", pierre:"#e8d4b4",
               sol:["#c8b494","#98866c"], plafond:"#8a7a66", vignette:.18, chaud:.08},
  crepuscule: {mur:["#8a6a5a","#6a4a44"], murOmbre:"#4a3230", pierre:"#a08472",
               sol:["#8a7060","#5e4c42"], plafond:"#4a3a36", vignette:.34, chaud:.26},
  nuit:       {mur:["#3a2e34","#2a2028"], murOmbre:"#1e1620", pierre:"#4a3c40",
               sol:["#4a3e3a","#2e2622"], plafond:"#241c22", vignette:.5,  chaud:.34}
};

function dessineHallEvolutif(o = {}){
  const phase = o.phase || "nuit";
  const P = PALETTES_HALL[phase];
  const E = etatBatiment(o.niveau || 1);
  const M = murSelonEtat({mur:P.mur, pierre:P.pierre}, E);
  const lum = phase === "nuit" || phase === "crepuscule";

  const salles = Math.max(1, Math.min(3, o.salles || 1));
  const conf = !!o.confiserie;
  const rep = Number(o.reputation ?? 50);
  const monde = rep >= 70 ? 3 : rep >= 40 ? 2 : rep >= 15 ? 1 : 0;
  const seances = o.seances || [];

  const SOL = 268;                       /* ligne de sol */
  const ecaille = (x,y,l,h) => E.peintureEcaillee
    ? `<path d="M${x} ${y} l${l*.3} ${-h*.4} l${l*.5} ${h*.2} l${l*.2} ${h*.5} l${-l*.4} ${h*.3} Z"
        fill="#000" opacity="${(.10 + E.usure*.10).toFixed(2)}"/>` : "";
  const coulure = (x,y,h) => E.rouille
    ? `<path d="M${x} ${y} q1.5 ${h*.5} 0 ${h}" stroke="#6a4a2a"
        stroke-width="${(1 + E.usure).toFixed(1)}" fill="none"
        opacity="${(.18 + E.usure*.22).toFixed(2)}"/>` : "";

  /* rangée d'ampoules, exactement comme sur la façade */
  const ampoules = (x1,x2,y,n,r=2.4) => {
    const pas = (x2-x1)/(n-1);
    return [...Array(n)].map((_,k)=>
      `<circle cx="${(x1+k*pas).toFixed(1)}" cy="${y}" r="${r}"
        fill="url(#ampouleG)" class="amp a${k%4}"/>`).join("");
  };

  /* pilastre cannelé, repris tel quel de la façade */
  const pilastre = (x,yH,yB,l) => {
    const n = 4, pas = l/(n+1);
    return `<g>
      <rect x="${x}" y="${yH}" width="${l}" height="${yB-yH}" fill="url(#pierreG)"/>
      <rect x="${x}" y="${yH}" width="${l*.3}" height="${yB-yH}" fill="#fff" opacity=".08"/>
      <rect x="${x+l*.78}" y="${yH}" width="${l*.22}" height="${yB-yH}" fill="#000" opacity=".14"/>
      ${[...Array(n)].map((_,k)=>
        `<rect x="${(x+pas*(k+1)-.6).toFixed(1)}" y="${yH+8}" width="1.2"
          height="${yB-yH-16}" fill="#000" opacity=".16"/>`).join("")}
      <rect x="${x-2}" y="${yH-6}" width="${l+4}" height="6" fill="url(#pierreG)"/>
      <rect x="${x-3}" y="${yH-9}" width="${l+6}" height="3.5" fill="url(#orG)"/>
      <rect x="${x-2}" y="${yB}" width="${l+4}" height="7" fill="url(#pierreG)"/>
      <rect x="${x-2}" y="${yB+7}" width="${l+4}" height="2" fill="#000" opacity=".2"/>
    </g>`;
  };

  /* une personne, silhouette sobre posée au sol */
  const PEAUX = ["#f0cba4","#dcb187","#c2926a","#9d744e","#7d5638"];
  const TENUES = ["#3f5a7a","#5a7a5f","#7a4a5f","#6a5a3f","#4a4a6a","#7a5540"];
  const personne = (x, y, h, k, pose) => {
    const s = h/100, peau = PEAUX[k%5], ten = TENUES[(k*3)%6];
    const chev = ["#2a1c14","#4a3527","#6a4a30","#1c1410","#8a8a8a"][(k*5)%5];
    const brasD = pose === "leve"
      ? `<path d="M13 34 q9 -8 8 -20" stroke="${ten}" stroke-width="8" fill="none" stroke-linecap="round"/>`
      : pose === "tend"
      ? `<path d="M13 34 q12 4 16 12" stroke="${ten}" stroke-width="8" fill="none" stroke-linecap="round"/>`
      : `<path d="M13 34 l3 26" stroke="${ten}" stroke-width="8" stroke-linecap="round"/>`;
    return `<g transform="translate(${x} ${y}) scale(${s.toFixed(3)})" class="pH">
      <ellipse cx="0" cy="102" rx="16" ry="4" fill="#000" opacity=".24"/>
      <path d="M-13 34 l-3 26" stroke="${ten}" stroke-width="8" stroke-linecap="round"/>
      ${brasD}
      <path d="M-9 62 l-1 38 l8 0 l2 -38 Z" fill="#26212a"/>
      <path d="M1 62 l2 38 l8 0 l-1 -38 Z" fill="#26212a"/>
      <path d="M-14 30 q14 -6 28 0 l3 36 l-34 0 Z" fill="${ten}"/>
      <path d="M-14 30 q14 -6 28 0 l.6 6 l-29 0 Z" fill="#000" opacity=".13"/>
      <path d="M-3 22 l6 0 l0 8 l-6 0 Z" fill="${peau}"/>
      <circle cx="0" cy="12" r="11" fill="${peau}"/>
      <path d="M-11 10 q11 -15 22 0 q-4 -6 -11 -6 q-7 0 -11 6 Z" fill="${chev}"/>
    </g>`;
  };

  return `
<svg viewBox="0 0 480 380" class="hallEvo" xmlns="http://www.w3.org/2000/svg"
  role="img" aria-label="Le hall du cinéma">
<defs>
  <linearGradient id="murHG" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="${M.fonce}"/><stop offset=".35" stop-color="${M.clair}"/>
    <stop offset="1" stop-color="${M.fonce}"/></linearGradient>
  <linearGradient id="pierreG" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="${M.pierre}" stop-opacity=".55"/>
    <stop offset=".4" stop-color="${M.pierre}"/>
    <stop offset="1" stop-color="${P.murOmbre}"/></linearGradient>
  <linearGradient id="orG" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${E.usure > .5 ? "#8a7a5a" : "#f7dd9a"}"/>
    <stop offset=".5" stop-color="${E.usure > .5 ? "#6a5a3a" : "#caa24a"}"/>
    <stop offset="1" stop-color="${E.usure > .5 ? "#4a3e28" : "#8a6c2a"}"/></linearGradient>
  <linearGradient id="laitonG" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${E.rouille ? "#8a7a52" : "#e8cf8a"}"/>
    <stop offset=".5" stop-color="${E.rouille ? "#5a4a2a" : "#a8862f"}"/>
    <stop offset="1" stop-color="${E.rouille ? "#7a6a48" : "#d8bd76"}"/></linearGradient>
  <linearGradient id="solHG" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${P.sol[0]}"/><stop offset="1" stop-color="${P.sol[1]}"/></linearGradient>
  <linearGradient id="tapisG" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#a82b3d"/><stop offset="1" stop-color="#6e1424"/></linearGradient>
  <radialGradient id="ampouleG" cx=".4" cy=".35" r=".7">
    <stop offset="0" stop-color="#fffdf0"/><stop offset=".5" stop-color="#ffdf9a"/>
    <stop offset="1" stop-color="#e8a83a"/></radialGradient>
  <radialGradient id="haloG" cx=".5" cy=".5" r=".5">
    <stop offset="0" stop-color="#ffdf9a" stop-opacity=".55"/>
    <stop offset=".45" stop-color="#ffc76a" stop-opacity=".18"/>
    <stop offset="1" stop-color="#ffc76a" stop-opacity="0"/></radialGradient>
  <radialGradient id="solHaloG" cx=".5" cy=".5" r=".5">
    <stop offset="0" stop-color="#ffdf9a" stop-opacity=".4"/>
    <stop offset="1" stop-color="#ffdf9a" stop-opacity="0"/></radialGradient>
  <linearGradient id="coneG" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#ffe9b0" stop-opacity=".3"/>
    <stop offset="1" stop-color="#ffe9b0" stop-opacity="0"/></linearGradient>
  <linearGradient id="vitreG" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${lum ? "#4a3a28" : "#2a3038"}"/>
    <stop offset=".5" stop-color="${lum ? "#7a5a30" : "#3a4048"}"/>
    <stop offset="1" stop-color="${lum ? "#3a2a1c" : "#22282e"}"/></linearGradient>
  <radialGradient id="vignetteG" cx=".5" cy=".45" r=".72">
    <stop offset=".55" stop-color="#000" stop-opacity="0"/>
    <stop offset="1" stop-color="#000" stop-opacity="${P.vignette}"/></radialGradient>
  <filter id="flouLeger" x="-20%" y="-20%" width="140%" height="140%">
    <feGaussianBlur stdDeviation="1.6"/></filter>
  <pattern id="grain" width="60" height="60" patternUnits="userSpaceOnUse">
    ${[...Array(48)].map(()=>`<circle cx="${(Math.random()*60).toFixed(1)}"
      cy="${(Math.random()*60).toFixed(1)}" r=".45" fill="#fff" opacity=".05"/>`).join("")}</pattern>
  <pattern id="salissure" width="80" height="80" patternUnits="userSpaceOnUse">
    ${[...Array(10)].map(()=>`<ellipse cx="${(Math.random()*80).toFixed(0)}"
      cy="${(Math.random()*80).toFixed(0)}" rx="${(6+Math.random()*14).toFixed(0)}"
      ry="${(4+Math.random()*9).toFixed(0)}" fill="#2a2418"
      opacity="${(.05+Math.random()*.06).toFixed(3)}"/>`).join("")}</pattern>
</defs>

<!-- ═══ LE MUR ═══ -->
<rect width="480" height="${SOL}" fill="url(#murHG)"/>
<rect width="480" height="${SOL}" fill="url(#salissure)" opacity="${E.usure.toFixed(2)}"/>
<g stroke="#000" stroke-opacity=".07" stroke-width="1">
  ${[...Array(8)].map((_,k)=>`<path d="M0 ${34+k*26} L480 ${34+k*26}"/>`).join("")}
</g>
${ecaille(60,150,40,30)}${ecaille(392,190,46,34)}${coulure(96,40,60)}${coulure(384,40,74)}

<!-- ═══ LE PLAFOND À GRADINS, comme le couronnement de la façade ═══ -->
<rect width="480" height="30" fill="${P.plafond}"/>
${E.couronnement >= 1 ? `<rect x="0" y="30" width="480" height="12" fill="url(#pierreG)"/>` : ""}
${E.couronnement >= 3 ? `<rect x="34" y="42" width="412" height="10" fill="url(#pierreG)"/>` : ""}
${E.couronnement >= 5 ? `<rect x="76" y="52" width="328" height="8" fill="url(#pierreG)"/>` : ""}
${E.filetsDores ? `<g fill="url(#orG)">
  <rect x="0" y="40" width="480" height="3"/>
  ${E.couronnement>=3?`<rect x="34" y="50" width="412" height="2"/>`:""}
  ${E.couronnement>=5?`<rect x="76" y="58" width="328" height="2"/>`:""}</g>` : ""}

<!-- ═══ PILASTRES, les mêmes que dehors ═══ -->
${E.pilastres
  ? pilastre(28, 76, 236, 20) + pilastre(432, 76, 236, 20)
  : `<g opacity=".5"><rect x="28" y="76" width="20" height="160" fill="url(#pierreG)"/>
     <rect x="432" y="76" width="20" height="160" fill="url(#pierreG)"/></g>`}
${E.basReliefs ? `<g opacity=".35" fill="${M.pierre}">
  <path d="M96 116 l14 -12 l14 12 l-14 12 Z"/>
  <path d="M356 116 l14 -12 l14 12 l-14 12 Z"/></g>` : ""}

<!-- ═══ RIDEAUX DE VELOURS aux angles, comme ceux de l'écran ═══ -->
${E.tapis ? `<g>
  <path d="M56 60 q-${18} 90 0 176 l-22 0 l0 -176 Z" fill="#7c1c2e"/>
  <path d="M424 60 q${18} 90 0 176 l22 0 l0 -176 Z" fill="#7c1c2e"/></g>` : ""}

<!-- ═══ LE PANNEAU DES SÉANCES — le marquee, rentré à l'intérieur ═══ -->
<g>
  ${E.marqueeVolume
    ? `<rect x="140" y="86" width="200" height="76" rx="3" fill="#1a1218" opacity=".9"/>
       <rect x="140" y="86" width="200" height="76" rx="3" fill="none"
         stroke="url(#orG)" stroke-width="2.4"/>
       ${lum ? `<rect x="145" y="91" width="190" height="66" rx="2" fill="url(#haloG)"
         filter="url(#flouLeger)"/>` : ""}
       ${E.ampoulesEnseigne ? ampoules(148, 332, 86, 12, 2.4) + ampoules(148, 332, 162, 12, 2.4) : ""}
       ${seances.slice(0,3).map((s,k)=>`
         <text x="240" y="${114+k*20}" text-anchor="middle" font-family="Courier New"
           font-size="13" letter-spacing="2" fill="${lum ? "#ffe9b0" : "#d8ccb4"}">${s}</text>`).join("")}
       ${seances.length === 0 ? `<text x="240" y="128" text-anchor="middle"
         font-family="Courier New" font-size="12" letter-spacing="2"
         fill="#8a7c60">AUCUNE SÉANCE</text>` : ""}`
    : `<rect x="152" y="92" width="176" height="66" rx="2" fill="#2b2f2b"
         stroke="${E.rouille ? "#5a4a38" : "url(#laitonG)"}" stroke-width="2.4"/>
       ${coulure(160, 158, 18)}
       ${seances.slice(0,2).map((s,k)=>`
         <text x="240" y="${120+k*20}" text-anchor="middle" font-family="Georgia"
           font-size="14" fill="#d4cec0" opacity=".9">${s}</text>`).join("")}
       ${seances.length === 0 ? `<text x="240" y="130" text-anchor="middle"
         font-family="Georgia" font-size="13" fill="#7c766a">rien ce soir</text>` : ""}`}
</g>

<!-- ═══ ÉCLAIRAGE ═══ -->
${E.index <= 1
  ? `<g><path d="M240 30 L240 56" stroke="#2e2820" stroke-width="2"/>
     <circle cx="240" cy="62" r="5" fill="url(#ampouleG)" class="ampouleNue"/>
     <circle cx="240" cy="62" r="40" fill="url(#haloG)" class="ampouleNue"/></g>`
  : E.appliques
  ? `<g>
       ${[[74,120],[406,120]].map(([x,y])=>`<g transform="translate(${x} ${y})">
         <path d="M0 0 l7 -9 l7 9 l-3 14 l-8 0 Z" fill="url(#laitonG)"/>
         ${lum ? `<circle cx="7" cy="6" r="26" fill="url(#haloG)"/>
           <circle cx="7" cy="4" r="3" fill="#fff4d0" class="amp"/>` : ""}</g>`).join("")}
       <path d="M196 44 L284 44 L320 ${SOL} L160 ${SOL} Z" fill="url(#coneG)"/>
       <ellipse cx="240" cy="${SOL+22}" rx="150" ry="30" fill="url(#solHaloG)"/>
     </g>`
  : `${[120,240,360].map(x=>`<g>
       <path d="M${x} 30 L${x} 50" stroke="#5a4a38" stroke-width="2"/>
       <circle cx="${x}" cy="58" r="7" fill="url(#ampouleG)"/>
       <circle cx="${x}" cy="58" r="30" fill="url(#haloG)"/></g>`).join("")}`}

<!-- ═══ LES PORTES DE SALLE ═══ -->
${(()=>{
  const l = 62, h = 108, y = SOL - h;
  const pos = salles === 1 ? [240] : salles === 2 ? [128, 352] : [96, 240, 384];
  return pos.map((x,k)=>`<g transform="translate(${x-l/2} ${y})">
    <rect width="${l}" height="${h}" rx="2" fill="#100a10"/>
    <rect width="${l}" height="${h}" rx="2" fill="none"
      stroke="${E.pilastres ? "url(#orG)" : "url(#laitonG)"}" stroke-width="2.6"/>
    <rect x="7" y="9" width="${l-14}" height="${h*0.46}" rx="2" fill="url(#vitreG)"/>
    <path d="M9 ${h*0.55} L${l*0.42} 9 L${l*0.56} 9 L${l*0.24} ${h*0.55} Z"
      fill="#fff" opacity=".07"/>
    ${E.imposte ? `<rect x="4" y="-9" width="${l-8}" height="7" fill="url(#laitonG)" opacity=".85"/>` : ""}
    ${E.plaque ? `<g transform="translate(${l/2-15} -26)">
      <rect width="30" height="14" rx="2" fill="url(#laitonG)"/>
      <text x="15" y="10" text-anchor="middle" font-family="Courier New" font-size="8"
        fill="#3a2408">${k+1}</text></g>` : ""}
    <rect x="${l-16}" y="${h*0.6}" width="4" height="18" rx="2" fill="url(#laitonG)"/>
  </g>`).join("");
})()}

<!-- ═══ LE SOL ═══ -->
<rect y="${SOL}" width="480" height="${380-SOL}" fill="url(#solHG)"/>
<rect y="${SOL}" width="480" height="4" fill="#000" opacity=".24"/>
<g stroke="#000" stroke-opacity=".1" stroke-width="1.2">
  ${[...Array(11)].map((_,k)=>{
    const xh = k*48, xb = (k-5)*72 + 240;
    return `<path d="M${xh} ${SOL} L${xb.toFixed(0)} 380"/>`;}).join("")}
  <path d="M0 ${SOL+34} L480 ${SOL+34}"/><path d="M0 ${SOL+72} L480 ${SOL+72}"/>
</g>
${E.tapis ? `<g>
  <!-- le tapis vient de l'entrée, derrière le spectateur, et s'arrête
       avant le mur : il ne prétend pas mener à une porte précise -->
  <path d="M192 ${SOL+14} L288 ${SOL+14} L322 380 L158 380 Z" fill="url(#tapisG)"/>
  <path d="M196 ${SOL+14} L162 380 M284 ${SOL+14} L318 380" stroke="#e8b84b"
    stroke-width="2.4" opacity=".7"/>
  <path d="M192 ${SOL+14} L288 ${SOL+14} L287 ${SOL+20} L193 ${SOL+20} Z"
    fill="#fff" opacity=".08"/>
</g>` : ""}
${E.herbes ? `<g fill="#000" opacity=".16">
  <ellipse cx="96" cy="${SOL+40}" rx="30" ry="9"/>
  <ellipse cx="392" cy="${SOL+62}" rx="26" ry="8"/></g>` : ""}

<!-- ═══ LE COMPTOIR ═══ -->
${conf ? `<g>
  <rect x="24" y="${SOL-52}" width="152" height="52" rx="3" fill="url(#pierreG)"/>
  <rect x="18" y="${SOL-60}" width="164" height="10" rx="3" fill="url(#laitonG)"/>
  <rect x="34" y="${SOL-40}" width="132" height="30" rx="2" fill="#000" opacity=".15"/>
  <g transform="translate(38 ${SOL-118})">
    <rect width="44" height="58" rx="5" fill="#a8302c" stroke="url(#laitonG)" stroke-width="2.4"/>
    <rect x="7" y="8" width="30" height="26" rx="2.5" fill="#f7ecd6" opacity=".92"/>
    <g fill="#fffaf0">${[...Array(6)].map((_,k)=>
      `<circle cx="${12+(k%3)*10}" cy="${16+Math.floor(k/3)*10}" r="4"/>`).join("")}</g>
    <rect x="8" y="40" width="28" height="10" rx="2" fill="#7a1e1c"/>
    ${lum ? `<circle cx="22" cy="20" r="30" fill="url(#haloG)" opacity=".55"/>` : ""}</g>
  ${(o.boissons||0) >= 1 ? `<g transform="translate(98 ${SOL-102})">
    <rect width="34" height="42" rx="4" fill="#2e6b7a" stroke="url(#laitonG)" stroke-width="2"/>
    <g fill="#f7ecd6" opacity=".85">${[0,1,2].map(k=>
      `<rect x="${5+k*9}" y="8" width="6" height="20" rx="1.6"/>`).join("")}</g></g>` : ""}
  ${E.ampoulesMarquee ? `<g transform="translate(144 ${SOL-92})">
    <rect width="28" height="32" rx="3" fill="#3a2a34" stroke="url(#laitonG)" stroke-width="1.8"/>
    <g>${["#e8443a","#3d9660","#e8b84b","#a83a5c"].map((c,k)=>
      `<circle cx="${8+(k%2)*12}" cy="${9+Math.floor(k/2)*12}" r="4" fill="${c}"/>`).join("")}</g></g>` : ""}
</g>`
: `<g>
  <rect x="28" y="${SOL-48}" width="126" height="48" rx="3" fill="url(#pierreG)"/>
  <rect x="22" y="${SOL-56}" width="138" height="9" rx="3" fill="url(#laitonG)" opacity=".8"/>
  <g transform="translate(48 ${SOL-96})">
    <rect width="84" height="34" rx="3" fill="#1a1014" stroke="url(#laitonG)" stroke-width="2"/>
    <text x="42" y="23" text-anchor="middle" font-family="Courier New" font-size="11"
      letter-spacing="1.4" fill="#c8bca4">CAISSE</text></g>
</g>`}

<!-- ═══ MOBILIER ═══ -->
${E.banc ? `<g transform="translate(346 ${SOL-40})">
  <rect width="100" height="14" rx="4" fill="#7a5a3a"/>
  <rect y="-12" width="100" height="12" rx="4" fill="#8a6642"/>
  <rect x="8" y="14" width="8" height="22" fill="#3a3630"/>
  <rect x="84" y="14" width="8" height="22" fill="#3a3630"/></g>` : ""}
${E.potelets ? `<g>
  <!-- les cordons bordent le passage, ils ne le barrent pas :
       deux files parallèles au tapis, dans le sens de la marche -->
  ${[[168, SOL+14], [146, 348], [312, SOL+14], [334, 348]].map(([x,y])=>`
    <g transform="translate(${x} ${y})">
      <ellipse cy="5" rx="8" ry="2.6" fill="#000" opacity=".24"/>
      <rect x="-3.4" y="-32" width="6.8" height="32" rx="3.4" fill="url(#laitonG)"/>
      <circle cy="-35" r="5" fill="url(#laitonG)"/></g>`).join("")}
  <path d="M168 ${SOL-22} q-8 30 -22 60" stroke="#8c1f2e" stroke-width="3.4"
    fill="none" stroke-linecap="round"/>
  <path d="M312 ${SOL-22} q8 30 22 60" stroke="#8c1f2e" stroke-width="3.4"
    fill="none" stroke-linecap="round"/>
</g>` : ""}

${E.etoilesSol ? `<g opacity=".85">
  ${[[86,320],[400,336]].map(([x,y])=>`<g transform="translate(${x} ${y})">
    <circle r="15" fill="#2a2620" opacity=".45"/>
    <path d="M0 -11 L3.2 -3.3 L11 -3.3 L4.8 1.6 L7.2 9.6 L0 4.8 L-7.2 9.6 L-4.8 1.6 L-11 -3.3 L-3.2 -3.3 Z"
      fill="url(#orG)"/></g>`).join("")}</g>` : ""}

<!-- ═══ LES GENS ═══ -->
<g class="fouleHall">
  ${monde >= 1 ? personne(206, SOL + 10, 90, 1, "leve") : ""}
  ${monde >= 2 ? personne(324, SOL + 2, 80, 3, "cote") : ""}
  ${monde >= 3 ? personne(268, SOL + 40, 104, 5, "cote") : ""}
</g>

<rect width="480" height="380" fill="url(#grain)" opacity=".5" pointer-events="none"/>
<rect width="480" height="380" fill="url(#vignetteG)" pointer-events="none"/>
</svg>`;
}

/* ---- exports ---- */
export {
  PALETTES_HALL,
  dessineHallEvolutif
};
