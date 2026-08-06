/* ============================================================
   HALL — rendu SVG unique, utilisé par la visite (et plus tard
   par la personnalisation du hall côté propriétaire).
   ============================================================ */
const OBJETS_HALL = {
  mur: {
    aucun:   "",
    cadres:  `<g fill="none" stroke="#caa24a" stroke-width="2">
      <rect x="72" y="34" width="28" height="36" rx="2"/><rect x="112" y="40" width="24" height="30" rx="2"/>
      <rect x="148" y="34" width="28" height="36" rx="2"/></g>
      <g fill="#3a2a34"><rect x="75" y="37" width="22" height="30"/><rect x="115" y="43" width="18" height="24"/>
      <rect x="151" y="37" width="22" height="30"/></g>`,
    affiches:`<g><rect x="70" y="30" width="32" height="44" rx="2" fill="#7c1c2e" stroke="#caa24a" stroke-width="2"/>
      <rect x="110" y="30" width="32" height="44" rx="2" fill="#1f3a5c" stroke="#caa24a" stroke-width="2"/>
      <rect x="150" y="30" width="32" height="44" rx="2" fill="#4a3f8c" stroke="#caa24a" stroke-width="2"/>
      <g fill="#fdf3d2" opacity=".65"><rect x="74" y="64" width="24" height="4"/><rect x="114" y="64" width="24" height="4"/>
      <rect x="154" y="64" width="24" height="4"/></g></g>`,
    fresque: `<path d="M60 26 L192 26 L192 78 L60 78 Z" fill="#2a1c3a"/>
      <path d="M60 66 Q92 40 126 60 Q160 80 192 52 L192 78 L60 78 Z" fill="#5c3a6b"/>
      <circle cx="150" cy="42" r="9" fill="#f7dd9a" opacity=".85"/>
      <path d="M60 26 L192 26 L192 78 L60 78 Z" fill="none" stroke="#caa24a" stroke-width="2"/>`
  },
  gauche: {
    aucun:"",
    plante:`<path d="M24 118 L40 118 L37 100 L27 100 Z" fill="#6b4a2a"/>
      <path d="M32 100 q-14 -16 -4 -30 q10 10 4 30" fill="#3d6b3a"/>
      <path d="M32 100 q14 -18 6 -34 q-12 12 -6 34" fill="#4a7d46"/>
      <path d="M32 100 q-20 -6 -20 -22 q16 6 20 22" fill="#35603a"/>`,
    fauteuil:`<rect x="16" y="96" width="34" height="16" rx="4" fill="#8c2331"/>
      <path d="M18 96 L18 82 Q18 78 22 78 L44 78 Q48 78 48 82 L48 96" fill="none" stroke="#8c2331" stroke-width="5"/>
      <rect x="20" y="112" width="4" height="7" fill="#4a1520"/><rect x="42" y="112" width="4" height="7" fill="#4a1520"/>`
  },
  droite: {
    aucun:"",
    vitrine:`<rect x="200" y="72" width="34" height="48" rx="2" fill="#1c1218" stroke="#caa24a" stroke-width="2"/>
      <path d="M200 90 L234 90 M200 106 L234 106" stroke="#caa24a" stroke-width="1.4"/>
      <circle cx="211" cy="82" r="4" fill="#caa24a"/><rect x="220" y="96" width="9" height="7" fill="#8c2331"/>
      <path d="M202 74 L214 118" stroke="#fff" stroke-opacity=".12" stroke-width="6"/>`,
    horloge:`<circle cx="216" cy="60" r="16" fill="#1c1218" stroke="#caa24a" stroke-width="2.5"/>
      <path d="M216 50 L216 60 L223 64" stroke="#caa24a" stroke-width="2" fill="none" stroke-linecap="round"/>
      <circle cx="216" cy="60" r="2" fill="#caa24a"/>`
  },
  sol: {
    parquet:`<rect x="0" y="120" width="250" height="40" fill="#6b4a2a"/>
      <g stroke="#54391f" stroke-width="1.2">${[0,40,80,120,160,200].map(x=>`<path d="M${x} 120 L${x-14} 160"/>`).join("")}</g>`,
    tapis:`<rect x="0" y="120" width="250" height="40" fill="#5c4128"/>
      <path d="M92 120 L158 120 L182 160 L68 160 Z" fill="#a82b3d"/>
      <path d="M96 120 L74 160 M154 120 L176 160" stroke="#f7dd9a" stroke-width="1.6" opacity=".7"/>`,
    damier:`<rect x="0" y="120" width="250" height="40" fill="#e8e0d0"/>
      <g fill="#241a20">${Array.from({length:9},(_,i)=>Array.from({length:2},(_,j)=>
        (i+j)%2===0?`<rect x="${i*28}" y="${120+j*20}" width="28" height="20"/>`:"").join("")).join("")}</g>`
  },
  comptoir: {
    bois:  {couleur:"#6b4a2a", bord:"#8a6238"},
    laiton:{couleur:"#caa24a", bord:"#f6e3a6"},
    marbre:{couleur:"#d8d2c4", bord:"#f2eee4"}
  }
};

/* rendu du hall : SVG unique, aucune donnée privée */
function rendreHallPublic(hall, opts = {}){
  const z = (hall && hall.zones) || {};
  const mur  = OBJETS_HALL.mur[z.mur || "aucun"] ?? "";
  const gau  = OBJETS_HALL.gauche[z.gauche || "aucun"] ?? "";
  const dro  = OBJETS_HALL.droite[z.droite || "aucun"] ?? "";
  const sol  = OBJETS_HALL.sol[z.sol || "parquet"] ?? OBJETS_HALL.sol.parquet;
  const cpt  = OBJETS_HALL.comptoir[z.comptoir || "bois"] || OBJETS_HALL.comptoir.bois;
  const confiserie = !!(hall && hall.confiserie);
  const plaque = hall && hall.plaque;

  return `<svg viewBox="0 0 250 160" class="hallSvg" xmlns="http://www.w3.org/2000/svg"
    role="img" aria-label="Hall du cinéma">
    <defs>
      <linearGradient id="hMur" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#4a2a38"/><stop offset="1" stop-color="#2e1a24"/>
      </linearGradient>
      <radialGradient id="hLum" cx=".5" cy="0" r=".9">
        <stop offset="0" stop-color="#ffdf9a" stop-opacity=".28"/>
        <stop offset="1" stop-color="#ffdf9a" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="250" height="160" fill="url(#hMur)"/>
    <rect x="0" y="0" width="250" height="22" fill="#241a20"/>
    <g fill="#ffdf9a" opacity=".9">
      <circle cx="60" cy="14" r="3.4"/><circle cx="125" cy="14" r="3.4"/><circle cx="190" cy="14" r="3.4"/>
    </g>
    <rect width="250" height="160" fill="url(#hLum)"/>
    ${mur}${gau}${dro}
    ${sol}
    <!-- comptoir -->
    <g>
      <rect x="150" y="96" width="76" height="24" rx="3" fill="${cpt.couleur}"/>
      <rect x="150" y="92" width="76" height="6" rx="3" fill="${cpt.bord}"/>
      ${confiserie ? `
        <rect x="158" y="76" width="14" height="18" rx="2" fill="#e8443a"/>
        <g fill="#fdf3d2"><circle cx="161" cy="75" r="3"/><circle cx="167" cy="73" r="3.4"/><circle cx="171" cy="76" r="2.6"/></g>
        <rect x="182" y="80" width="9" height="14" rx="2" fill="#2e7a8c"/>
        <rect x="196" y="80" width="9" height="14" rx="2" fill="#c07a1f"/>` : ""}
    </g>
    ${plaque ? `<g transform="translate(96 84)">
      <rect x="0" y="0" width="58" height="18" rx="2" fill="#caa24a" stroke="#7d611f" stroke-width="1.2"/>
      <text x="29" y="12" text-anchor="middle" font-family="Courier New" font-size="6"
        letter-spacing=".5" fill="#3a2408">CINEMA RECONNU</text></g>` : ""}
  </svg>`;
}

/* ---- exports ---- */
export {
  OBJETS_HALL,
  rendreHallPublic
};
