/* Icônes SVG monochromes (courant: currentColor). Usage : icone("billet") */
const ICONES = {
  batiment:`<path d="M3 20 L3 8 L12 3 L21 8 L21 20 Z M8 20 L8 13 L16 13 L16 20 M6 9.5 L18 9.5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>`,
  pellicule:`<rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M7 5 L7 19 M17 5 L17 19" stroke="currentColor" stroke-width="1.4"/><path d="M4.2 8 h1.6 M4.2 12 h1.6 M4.2 16 h1.6 M18.2 8 h1.6 M18.2 12 h1.6 M18.2 16 h1.6" stroke="currentColor" stroke-width="1.4"/>`,
  fauteuil:`<path d="M5 11 L5 6 Q5 4.5 6.5 4.5 L17.5 4.5 Q19 4.5 19 6 L19 11 M3.5 11.5 Q3.5 10 5 10 L19 10 Q20.5 10 20.5 11.5 L20.5 15 Q20.5 16.5 19 16.5 L5 16.5 Q3.5 16.5 3.5 15 Z M6 16.5 L6 19.5 M18 16.5 L18 19.5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>`,
  camera:`<rect x="2.5" y="8" width="12" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M14.5 12 L21 8.5 L21 17.5 L14.5 14" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><circle cx="7" cy="5" r="2.6" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="12.5" cy="5.4" r="2" fill="none" stroke="currentColor" stroke-width="1.7"/>`,
  etoile:`<path d="M12 3.5 L14.4 9 L20.5 9.6 L15.9 13.6 L17.3 19.5 L12 16.4 L6.7 19.5 L8.1 13.6 L3.5 9.6 L9.6 9 Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>`,
  piece:`<circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M12 7.5 Q9 7.5 9 9.6 Q9 11.4 12 11.9 Q15 12.4 15 14.3 Q15 16.5 12 16.5 M12 6.2 L12 7.5 M12 16.5 L12 17.8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>`,
  billet:`<path d="M3 8 Q3 7 4 7 L20 7 Q21 7 21 8 L21 10.2 Q19.4 10.6 19.4 12 Q19.4 13.4 21 13.8 L21 16 Q21 17 20 17 L4 17 Q3 17 3 16 L3 13.8 Q4.6 13.4 4.6 12 Q4.6 10.6 3 10.2 Z" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M9.5 7 L9.5 17" stroke="currentColor" stroke-width="1.4" stroke-dasharray="2 2.2"/>`,
  horloge:`<circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M12 7 L12 12 L15.5 14" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>`,
  spectateurs:`<circle cx="8.5" cy="8" r="3" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M3 19 Q3 13.5 8.5 13.5 Q14 13.5 14 19" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><circle cx="16.5" cy="8.6" r="2.4" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M15.5 13.9 Q21 14.3 21 19" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>`,
  journal:`<rect x="3.5" y="5" width="14" height="14" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M17.5 8 L19.5 8 Q20.5 8 20.5 9 L20.5 17 Q20.5 19 18.5 19 L5 19" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M6.5 8.5 L14.5 8.5 M6.5 11.5 L14.5 11.5 M6.5 14.5 L11 14.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>`,
  cloche:`<path d="M12 4 Q6.5 4 6.5 10 L6.5 14 L4.8 16.5 L19.2 16.5 L17.5 14 L17.5 10 Q17.5 4 12 4 Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M10 19 Q12 20.6 14 19" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>`,
  maison:`<path d="M4 11 L12 4 L20 11 M6 9.5 L6 20 L18 20 L18 9.5 M10 20 L10 14.5 L14 14.5 L14 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>`,
  outil:`<path d="M14.5 6.5 Q14.5 4 17 3.5 L15.5 6 L18 8.5 L20.5 7 Q20 9.5 17.5 9.5 Q16.8 9.5 16.2 9.2 L7 18.4 Q6 19.4 5 18.4 L5.6 19 Q4.6 18 5.6 17 L14.8 7.8 Q14.5 7.2 14.5 6.5 Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>`,
  porte:`<rect x="6" y="4" width="12" height="17" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="15" cy="12.5" r="1" fill="currentColor"/><path d="M3.5 21 L20.5 21" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>`
};
function icone(nom, cls=""){
  return `<svg class="ico ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONES[nom]||""}</svg>`;
}
/* ============================================================
   BOB — l'ouvreur du Club

   L'ancien portrait était une tête plate, sans corps ni caractère.
   Celui-ci a ses épaules, sa veste d'ouvreur à galons, son nœud
   papillon, sa moustache et sa casquette. Il cligne des yeux et
   respire — très lentement, pour qu'on le remarque sans être
   dérangé.
   ============================================================ */
function bobPortrait(taille){
  const t = taille || 96;
  return `<svg viewBox="0 0 120 120" width="${t}" height="${t}" class="bobSvg"
    role="img" aria-label="Bob, l'ouvreur">
  <defs>
    <linearGradient id="bVeste" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#a02a3c"/><stop offset=".55" stop-color="#7c1424"/>
      <stop offset="1" stop-color="#5a0e1a"/></linearGradient>
    <linearGradient id="bPeau" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f6d3ac"/><stop offset="1" stop-color="#e0b085"/></linearGradient>
    <linearGradient id="bCasq" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#8c2331"/><stop offset="1" stop-color="#4a0c16"/></linearGradient>
    <radialGradient id="bHalo" cx=".5" cy=".42" r=".5">
      <stop offset="0" stop-color="#ffdf9a" stop-opacity=".35"/>
      <stop offset="1" stop-color="#ffdf9a" stop-opacity="0"/></radialGradient>
  </defs>

  <circle cx="60" cy="56" r="52" fill="url(#bHalo)"/>

  <g class="bobBuste">
    <!-- épaules et veste -->
    <path d="M18 120 q2 -32 20 -40 q10 -5 22 -5 q12 0 22 5 q18 8 20 40 Z" fill="url(#bVeste)"/>
    <path d="M46 78 q14 12 28 0 l6 4 q-20 18 -40 0 Z" fill="#f2e4cc" opacity=".95"/>
    <!-- revers -->
    <path d="M46 78 L60 96 L52 100 L40 84 Z" fill="#5a0e1a" opacity=".55"/>
    <path d="M74 78 L60 96 L68 100 L80 84 Z" fill="#5a0e1a" opacity=".55"/>
    <!-- nœud papillon -->
    <path d="M60 92 L48 86 L48 100 Z" fill="#caa24a"/>
    <path d="M60 92 L72 86 L72 100 Z" fill="#caa24a"/>
    <circle cx="60" cy="93" r="3.4" fill="#e8c86a"/>
    <!-- galons -->
    <g fill="#e8c86a" opacity=".9">
      <circle cx="38" cy="104" r="2.4"/><circle cx="38" cy="113" r="2.4"/>
      <rect x="76" y="98" width="14" height="3" rx="1.5"/>
      <rect x="76" y="105" width="14" height="3" rx="1.5"/></g>

    <!-- cou -->
    <path d="M50 66 h20 v14 q-10 6 -20 0 Z" fill="#e0b085"/>

    <!-- tête -->
    <ellipse cx="60" cy="46" rx="25" ry="26" fill="url(#bPeau)"/>
    <!-- oreilles -->
    <ellipse cx="35" cy="48" rx="4.5" ry="6" fill="#e8bd93"/>
    <ellipse cx="85" cy="48" rx="4.5" ry="6" fill="#e8bd93"/>
    <!-- sourcils -->
    <path d="M45 36 q7 -4 13 0" stroke="#4a3527" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M62 36 q7 -4 13 0" stroke="#4a3527" stroke-width="3" fill="none" stroke-linecap="round"/>
    <!-- yeux -->
    <g class="bobYeux">
      <ellipse cx="51" cy="45" rx="4.2" ry="4.6" fill="#fff"/>
      <ellipse cx="69" cy="45" rx="4.2" ry="4.6" fill="#fff"/>
      <circle cx="52" cy="45.6" r="2.4" fill="#3a2416"/>
      <circle cx="70" cy="45.6" r="2.4" fill="#3a2416"/>
      <circle cx="53" cy="44.4" r=".9" fill="#fff"/>
      <circle cx="71" cy="44.4" r=".9" fill="#fff"/></g>
    <!-- nez -->
    <path d="M60 47 q-3 7 1 9" stroke="#c99a72" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    <!-- moustache -->
    <path d="M60 59 q-11 -5 -15 2 q8 3 15 -1 q7 4 15 1 q-4 -7 -15 -2 Z" fill="#4a3527"/>
    <!-- sourire -->
    <path d="M52 64 q8 5 16 0" stroke="#8a5a3a" stroke-width="2" fill="none" stroke-linecap="round"/>
    <!-- casquette -->
    <path d="M32 34 q28 -24 56 0 l0 -5 q-28 -22 -56 0 Z" fill="url(#bCasq)"/>
    <path d="M31 33 q29 -22 58 0 q-4 5 -29 5 q-25 0 -29 -5 Z" fill="url(#bCasq)"/>
    <rect x="50" y="20" width="20" height="8" rx="2.5" fill="#e8c86a"/>
    <path d="M50 24 h20" stroke="#8a6c2a" stroke-width="1.2"/>
    <path d="M28 34 q32 8 64 0 l0 4 q-32 8 -64 0 Z" fill="#4a0c16"/>
  </g>
</svg>`;
}

/* ---- exports ---- */
export {
  ICONES,
  bobPortrait,
  icone
};
