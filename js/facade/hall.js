/* ============================================================
   LE HALL — la programmation vue de l'intérieur

   La page séances montrait un carrousel d'affiches posé sur un
   fond neutre. On est maintenant dans le hall du cinéma : les
   affiches sont dans leurs cadres rétroéclairés, sur le mur,
   sous le lustre. Toucher un cadre ouvre la séance ; toucher un
   cadre vide en programme une nouvelle.

   Tout est vectoriel et calculé pour un viewBox fixe de
   480 × 620 : la scène se redimensionne avec l'écran sans que
   rien ne se déforme, comme la façade de jeu.html.

   Le nombre de cadres suit le nombre de créneaux du joueur :
   une séance programmée remplit son cadre, un créneau libre
   affiche un cadre vide avec son « + ».
   ============================================================ */

/* ---------- proportions de la scène ---------- */
const VB_L = 480, VB_H = 620;
const CADRE_L = 82, CADRE_H = 116;     /* l'affiche elle-même */
const CADRE_Y = 300;                    /* hauteur du haut des cadres */
const SOL_Y   = 496;                    /* ligne de sol */

/* les couleurs d'affiche par genre, pour que chaque cadre soit
   reconnaissable d'un coup d'œil sans charger d'image */
const TEINTES = {
  "Comédie":       ["#c07a1f", "#e0a850"],
  "Drame":         ["#1f3a5c", "#4a7ab0"],
  "Thriller":      ["#3a1f2c", "#7a4a5c"],
  "Aventure":      ["#1d5c52", "#3a9c8a"],
  "Romance":       ["#a83a5c", "#d06a8a"],
  "Documentaire":  ["#2a6b6b", "#4a9a9a"],
  "Animation":     ["#6a4a9c", "#9a7ad0"],
  "Horreur":       ["#2a1418", "#6a2a30"],
  "Science-fiction":["#1a3a4a", "#3a7a9a"],
  "Action":        ["#8a3a1f", "#c06a3a"]
};
function teinte(genre){ return TEINTES[genre] || ["#4a3a5c", "#7a6a9c"]; }

/* coupe un titre en deux lignes courtes qui tiennent dans le cadre */
function deuxLignes(titre){
  const mots = String(titre || "").toUpperCase().split(/\s+/);
  const l = [];
  for(const m of mots){
    const dernier = l[l.length - 1];
    if(dernier && (dernier + " " + m).length <= 12) l[l.length - 1] = dernier + " " + m;
    else l.push(m);
  }
  return [l[0] || "", l.slice(1).join(" ").slice(0, 14)];
}

function echappeSvg(t){
  return String(t == null ? "" : t)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/* ---------- les pièces d'architecture ---------- */

function colonne(x){
  const cannelures = [0,1,2,3,4,5].map(i =>
    `<rect x="${x-13+i*5}" y="234" width="2" height="${SOL_Y-238}" fill="#000" opacity=".24"/>
     <rect x="${x-12+i*5}" y="234" width="1.5" height="${SOL_Y-238}" fill="#7a5c3e" opacity=".45"/>`
  ).join("");
  return `<g>
    <rect x="${x-15}" y="232" width="30" height="${SOL_Y-236}" fill="#3a2c22"/>
    ${cannelures}
    <rect x="${x-19}" y="224" width="38" height="9" fill="url(#hOrV)"/>
    <rect x="${x-17}" y="215" width="34" height="9" fill="#4a3826"/>
    <rect x="${x-17}" y="215" width="34" height="3" fill="url(#hOr)" opacity=".7"/>
    <path d="M${x-19} 224 L${x+19} 224 L${x+15} 217 L${x-15} 217 Z" fill="url(#hOr)" opacity=".5"/>
    <rect x="${x-19}" y="${SOL_Y-9}" width="38" height="9" fill="url(#hOrV)"/>
    <rect x="${x-14}" y="234" width="3" height="${SOL_Y-240}" fill="#fff" opacity=".07"/>
  </g>`;
}

function applique(x, y){
  return `<g>
    <path d="M${x-6} ${y} l6 -14 l6 14 l-3 22 l-6 0 Z" fill="url(#hOrV)"/>
    <circle cx="${x}" cy="${y-2}" r="8" fill="url(#hAmp)"/>
    <circle cx="${x}" cy="${y-3}" r="3" fill="#fff4d0"/>
  </g>`;
}

function lustre(){
  const ampoules = [];
  for(let x = 206; x < 280; x += 12){
    ampoules.push(`<circle cx="${x}" cy="120" r="4.5" fill="#fff4d0"/>
      <circle cx="${x}" cy="120" r="10" fill="url(#hAmp)"/>`);
  }
  return `<g>
    <ellipse cx="240" cy="140" rx="185" ry="105" fill="url(#hLustre)"/>
    <rect x="237" y="40" width="6" height="54" fill="#3a2a1e"/>
    <path d="M210 94 L270 94 L262 108 L218 108 Z" fill="url(#hOrV)"/>
    <path d="M198 108 L282 108 L272 126 L208 126 Z" fill="#2a1c14"/>
    <path d="M198 108 L282 108 L280 112 L200 112 Z" fill="url(#hOr)"/>
    ${ampoules.join("")}
    <path d="M214 126 L214 142 M232 126 L232 150 M248 126 L248 150 M266 126 L266 142"
      stroke="url(#hOr)" stroke-width="1.4" opacity=".7"/>
    <circle cx="214" cy="144" r="2.5" fill="#ffe9b0"/><circle cx="232" cy="152" r="2.5" fill="#ffe9b0"/>
    <circle cx="248" cy="152" r="2.5" fill="#ffe9b0"/><circle cx="266" cy="144" r="2.5" fill="#ffe9b0"/>
  </g>`;
}

/* la porte du fond : on aperçoit la rue, en cohérence avec jeu.html */
function porteDuFond(){
  return `<g>
    <rect x="204" y="256" width="72" height="120" rx="2" fill="#0a0608"/>
    <rect x="207" y="259" width="66" height="98" fill="url(#hRue)"/>
    <path d="M207 330 L207 314 L219 314 L219 302 L234 302 L234 322 L249 322
             L249 310 L262 310 L262 320 L273 320 L273 357 L207 357 Z"
      fill="#2a3646" opacity=".8"/>
    <g fill="#ffd89a" opacity=".7">
      <rect x="212" y="318" width="3" height="4"/><rect x="226" y="306" width="3" height="4"/>
      <rect x="244" y="326" width="3" height="4"/><rect x="260" y="314" width="3" height="4"/>
    </g>
    <rect x="238" y="256" width="4" height="101" fill="url(#hOrV)"/>
    <rect x="204" y="256" width="72" height="120" rx="2" fill="none" stroke="url(#hOr)" stroke-width="2.5"/>
    <path d="M210 261 L224 261 L208 310 L208 284 Z" fill="#fff" opacity=".08"/>
    <path d="M204 256 L276 256 L276 244 Q240 232 204 244 Z" fill="#1a1418"/>
    <g stroke="url(#hOr)" stroke-width="1.2" opacity=".8" fill="none">
      <path d="M240 256 L240 234"/><path d="M240 256 L216 244"/><path d="M240 256 L264 244"/>
      <path d="M240 256 L226 238"/><path d="M240 256 L254 238"/>
    </g>
  </g>`;
}

/* ---------- un cadre d'affiche ---------- */

function cadre(o){
  const x = o.cx - CADRE_L / 2, y = CADRE_Y;
  const socle = `
    <rect x="${x-6}" y="${y+CADRE_H+10}" width="${CADRE_L+12}" height="17" rx="3" fill="#160c10"/>
    <text x="${o.cx}" y="${y+CADRE_H+22}" text-anchor="middle" font-family="Outfit,sans-serif"
      font-size="8.5" fill="${o.film ? '#ffcf7a' : '#8a7a72'}" letter-spacing=".5">${echappeSvg(o.heure)}</text>`;

  if(!o.film){
    return `<g class="cadreHall vide" data-creneau="${echappeSvg(o.heure)}" role="button"
              tabindex="0" aria-label="Créneau libre à ${echappeSvg(o.heure)}">
      <rect x="${x-6}" y="${y-8}" width="${CADRE_L+12}" height="${CADRE_H+16}" rx="4" fill="#160c12"/>
      <rect x="${x-6}" y="${y-8}" width="${CADRE_L+12}" height="${CADRE_H+16}" rx="4"
        fill="none" stroke="#6a4a3a" stroke-width="2"/>
      <rect x="${x+3}" y="${y+3}" width="${CADRE_L-6}" height="${CADRE_H-6}" rx="2"
        fill="none" stroke="#5a4238" stroke-width="1" stroke-dasharray="4 4"/>
      <circle cx="${o.cx}" cy="${y+CADRE_H/2-6}" r="13" fill="#571520" stroke="url(#hOr)" stroke-width="1.5"/>
      <text x="${o.cx}" y="${y+CADRE_H/2-1}" text-anchor="middle" font-size="17" fill="#f7dd9a">+</text>
      <text x="${o.cx}" y="${y+CADRE_H/2+26}" text-anchor="middle" font-family="Outfit,sans-serif"
        font-size="9" fill="#8a7a72">libre</text>
      ${socle}
    </g>`;
  }

  const [t1, t2] = deuxLignes(o.film.titre);
  const c = teinte(o.film.genre);
  const etat = o.passee
    ? `<rect x="${x}" y="${y}" width="${CADRE_L}" height="${CADRE_H}" fill="#000" opacity=".42"/>
       <text x="${o.cx}" y="${y+18}" text-anchor="middle" font-family="Outfit,sans-serif"
         font-size="7.5" fill="#f7dd9a" letter-spacing="1">EN COURS</text>` : "";

  return `<g class="cadreHall plein" data-seance="${echappeSvg(o.id)}" role="button"
            tabindex="0" aria-label="${echappeSvg(o.film.titre)} à ${echappeSvg(o.heure)}">
    <rect x="${x-9}" y="${y-11}" width="${CADRE_L+18}" height="${CADRE_H+38}" rx="5"
      fill="url(#hCaisson)" opacity=".7"/>
    <rect x="${x-6}" y="${y-8}" width="${CADRE_L+12}" height="${CADRE_H+16}" rx="4" fill="#1a1016"/>
    <rect x="${x-6}" y="${y-8}" width="${CADRE_L+12}" height="${CADRE_H+16}" rx="4"
      fill="none" stroke="url(#hOr)" stroke-width="2.5"/>
    <defs><linearGradient id="hAff${o.i}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${c[1]}"/><stop offset="1" stop-color="${c[0]}"/>
    </linearGradient></defs>
    <rect x="${x}" y="${y}" width="${CADRE_L}" height="${CADRE_H}" rx="2" fill="url(#hAff${o.i})"/>
    <circle cx="${o.cx}" cy="${y+CADRE_H*0.3}" r="${CADRE_L*0.22}" fill="#fff" opacity=".15"/>
    <rect x="${x}" y="${y+CADRE_H*0.6}" width="${CADRE_L}" height="${CADRE_H*0.4}" fill="#000" opacity=".3"/>
    <text x="${o.cx}" y="${y+CADRE_H*0.72}" text-anchor="middle" font-family="Marcellus,Georgia,serif"
      font-size="8.5" fill="#f7dd9a">${echappeSvg(t1)}</text>
    ${t2 ? `<text x="${o.cx}" y="${y+CADRE_H*0.72+10}" text-anchor="middle"
      font-family="Marcellus,Georgia,serif" font-size="8.5" fill="#f7dd9a">${echappeSvg(t2)}</text>` : ""}
    ${etat}
    ${socle}
    <text x="${o.cx}" y="${y+CADRE_H+31}" text-anchor="middle" font-family="Outfit,sans-serif"
      font-size="6.5" fill="#caa24a" letter-spacing=".4">${echappeSvg(o.salle || "")}</text>
  </g>`;
}

/* ---------- la scène complète ---------- */

/* creneaux : [{id, heure, film:{titre,genre}, salle, passee}] — film null = cadre vide */
function dessineHall(creneaux){
  const n = Math.max(1, creneaux.length);
  /* on répartit les cadres sur la largeur, resserrés quand il y en a beaucoup */
  const marge = n <= 3 ? 138 : n === 4 ? 108 : 88;
  const pas = n === 1 ? 0 : (VB_L - marge * 2) / (n - 1);
  const cadres = creneaux.map((c, i) =>
    cadre({ ...c, i, cx: n === 1 ? 240 : Math.round(marge + pas * i) })).join("");

  const lambris = [];
  for(let x = 112; x < 384; x += 15) lambris.push(`<path d="M${x} 300 L${x} 480"/>`);

  const poussiere = [[200,240,1,.4],[260,300,1.2,.3],[228,370,.8,.35],[280,270,1,.28],[212,340,1.1,.32]]
    .map(([x,y,r,o]) => `<circle cx="${x}" cy="${y}" r="${r}" opacity="${o}"/>`).join("");

  return `<svg viewBox="0 0 ${VB_L} ${VB_H}" xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="xMidYMid slice" class="hallSvg" aria-label="Le hall du cinéma">
  <defs>
    <linearGradient id="hPlaf" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#100609"/><stop offset="1" stop-color="#2a1a1e"/></linearGradient>
    <linearGradient id="hMur" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#4a2e28"/><stop offset=".45" stop-color="#4e322c"/>
      <stop offset="1" stop-color="#2e1c1a"/></linearGradient>
    <linearGradient id="hMurG" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#160c0e"/><stop offset="1" stop-color="#34201e"/></linearGradient>
    <linearGradient id="hMurD" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#34201e"/><stop offset="1" stop-color="#160c0e"/></linearGradient>
    <linearGradient id="hMarbre" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#2e262c"/><stop offset="1" stop-color="#0e0a0e"/></linearGradient>
    <linearGradient id="hTapis" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#8a1c28"/><stop offset=".5" stop-color="#a02230"/>
      <stop offset="1" stop-color="#5a1018"/></linearGradient>
    <linearGradient id="hOr" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#7a5c1e"/><stop offset=".3" stop-color="#e8c268"/>
      <stop offset=".5" stop-color="#fff0b8"/><stop offset=".7" stop-color="#e8c268"/>
      <stop offset="1" stop-color="#7a5c1e"/></linearGradient>
    <linearGradient id="hOrV" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff0b8"/><stop offset=".5" stop-color="#d4a850"/>
      <stop offset="1" stop-color="#7a5c1e"/></linearGradient>
    <radialGradient id="hLustre" cx=".5" cy=".5" r=".5">
      <stop offset="0" stop-color="#ffe9b0" stop-opacity=".72"/>
      <stop offset=".5" stop-color="#ffcf7a" stop-opacity=".22"/>
      <stop offset="1" stop-color="#ffcf7a" stop-opacity="0"/></radialGradient>
    <radialGradient id="hAmp" cx=".5" cy=".5" r=".5">
      <stop offset="0" stop-color="#fff4d0" stop-opacity="1"/>
      <stop offset=".4" stop-color="#ffe0a0" stop-opacity=".6"/>
      <stop offset="1" stop-color="#ffe0a0" stop-opacity="0"/></radialGradient>
    <linearGradient id="hCone" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffe9b0" stop-opacity=".3"/>
      <stop offset=".6" stop-color="#ffe9b0" stop-opacity=".07"/>
      <stop offset="1" stop-color="#ffe9b0" stop-opacity="0"/></linearGradient>
    <radialGradient id="hCaisson" cx=".5" cy=".42" r=".62">
      <stop offset="0" stop-color="#ffe9b0" stop-opacity=".55"/>
      <stop offset=".6" stop-color="#ffcf7a" stop-opacity=".18"/>
      <stop offset="1" stop-color="#ffcf7a" stop-opacity="0"/></radialGradient>
    <linearGradient id="hRue" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#4a5a72"/><stop offset=".5" stop-color="#6a7a92"/>
      <stop offset="1" stop-color="#3a4656"/></linearGradient>
    <radialGradient id="hReflet" cx=".5" cy="0" r=".9">
      <stop offset="0" stop-color="#ffce8a" stop-opacity=".16"/>
      <stop offset="1" stop-color="#ffce8a" stop-opacity="0"/></radialGradient>
    <linearGradient id="hVign" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#000" stop-opacity=".38"/>
      <stop offset=".22" stop-color="#000" stop-opacity="0"/>
      <stop offset=".8" stop-color="#000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity=".45"/></linearGradient>
  </defs>

  <rect width="${VB_L}" height="${VB_H}" fill="#180e10"/>

  <!-- plafond à caissons, fuite vers le point de fuite -->
  <rect width="${VB_L}" height="250" fill="url(#hPlaf)"/>
  <g opacity=".55" stroke="#5a3a2e" stroke-width="1" fill="none">
    <path d="M0 0 L200 224 M96 0 L216 224 M192 0 L232 224 M288 0 L248 224 M384 0 L264 224 M480 0 L280 224"/>
    <path d="M0 48 L480 48" opacity=".8"/><path d="M20 96 L460 96" opacity=".7"/>
    <path d="M50 144 L430 144" opacity=".6"/><path d="M80 186 L400 186" opacity=".5"/>
  </g>
  <rect x="0" y="244" width="480" height="4" fill="url(#hOr)" opacity=".7"/>
  <rect x="0" y="248" width="480" height="3" fill="#180c0e"/>

  <!-- murs latéraux en perspective -->
  <path d="M0 250 L96 310 L96 ${SOL_Y} L0 ${SOL_Y+70} Z" fill="url(#hMurG)"/>
  <path d="M480 250 L384 310 L384 ${SOL_Y} L480 ${SOL_Y+70} Z" fill="url(#hMurD)"/>
  <rect x="96" y="250" width="288" height="${SOL_Y-250}" fill="url(#hMur)"/>
  <g opacity=".14" stroke="#000" stroke-width="1">${lambris.join("")}</g>
  <rect x="96" y="392" width="288" height="3" fill="url(#hOr)" opacity=".5"/>

  ${colonne(96)}${colonne(384)}
  ${porteDuFond()}

  <!-- le cône de lumière passe derrière les cadres -->
  <path d="M240 108 L150 ${SOL_Y} L330 ${SOL_Y} Z" fill="url(#hCone)"/>

  ${cadres}

  <!-- sol : marbre puis tapis en forte fuite -->
  <path d="M0 ${SOL_Y} L480 ${SOL_Y} L480 ${VB_H} L0 ${VB_H} Z" fill="url(#hMarbre)"/>
  <g opacity=".12" stroke="#6a5a60" stroke-width="1" fill="none">
    <path d="M0 545 L480 545 M0 590 L480 590"/>
    <path d="M96 ${SOL_Y} L20 ${VB_H} M192 ${SOL_Y} L165 ${VB_H} M288 ${SOL_Y} L315 ${VB_H} M384 ${SOL_Y} L460 ${VB_H}"/>
  </g>
  <ellipse cx="240" cy="${SOL_Y+30}" rx="160" ry="34" fill="url(#hReflet)"/>
  <path d="M186 ${SOL_Y} L140 ${VB_H} L340 ${VB_H} L294 ${SOL_Y} Z" fill="url(#hTapis)"/>
  <path d="M186 ${SOL_Y} L140 ${VB_H} M294 ${SOL_Y} L340 ${VB_H}"
    stroke="url(#hOrV)" stroke-width="3" opacity=".6"/>
  <path d="M230 ${SOL_Y} L222 ${VB_H} L258 ${VB_H} L250 ${SOL_Y} Z" fill="#c04050" opacity=".16"/>
  <rect x="0" y="${SOL_Y-4}" width="480" height="5" fill="url(#hOr)" opacity=".5"/>
  <rect x="0" y="${SOL_Y+1}" width="480" height="4" fill="#1a0e10"/>

  ${lustre()}
  ${applique(66, 320)}${applique(414, 320)}
  <g fill="#ffe9b0">${poussiere}</g>
  <rect width="${VB_L}" height="${VB_H}" fill="url(#hVign)" pointer-events="none"/>
</svg>`;
}

export { dessineHall, teinte };
