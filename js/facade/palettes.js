/* ============================================================
   LA FAÇADE — version détaillée
   viewBox 0 0 480 520. Tout est vectoriel, aucune image.
   ============================================================ */

const PALETTES = {
  matin: {
    ciel:["#8fb4d4","#c5d9e4","#e8dcc8"], soleil:"#fff4d8", soleilY:96, halo:.10,
    mur:["#c9a882","#a8875f"], murOmbre:"#8a6c48", pierre:"#d8c0a0",
    toit:"#5a4438", trottoir:["#c8c2b8","#a89e92"], route:["#4a4a4e","#3a3a3e"],
    fenetres:"#6a8299", lumieres:false, ombreLong:1.6, ombreOpac:.20,
    brume:"#e8dcc8", brumeOpac:.16, vignette:.22, immeubles:["#a89880","#8a7a64","#6e6050"]
  },
  aprem: {
    ciel:["#6fa8d8","#a8cce0","#dfe4d8"], soleil:"#fffbe8", soleilY:60, halo:.06,
    mur:["#d8b48c","#b8926a"], murOmbre:"#96745200", pierre:"#e8d4b4",
    toit:"#63４a3c".replace("４","4"), trottoir:["#d4cec4","#b4aa9e"], route:["#525258","#424248"],
    fenetres:"#7a92a9", lumieres:false, ombreLong:.7, ombreOpac:.26,
    brume:"#dfe4d8", brumeOpac:.10, vignette:.18, immeubles:["#b8a890","#9a8a74","#7e7060"]
  },
  crepuscule: {
    ciel:["#2e3a6e","#8a5a7a","#e08a5a"], soleil:"#ffb870", soleilY:300, halo:.34,
    mur:["#8a6a5a","#6a4a44"], murOmbre:"#4a3230", pierre:"#a08472",
    toit:"#3a2a2c", trottoir:["#7a6e6a","#5a5250"], route:["#32323a","#26262e"],
    fenetres:"#ffcf8a", lumieres:true, ombreLong:2.4, ombreOpac:.16,
    brume:"#c07a5a", brumeOpac:.20, vignette:.34, immeubles:["#5a4a52","#463a44","#332a34"]
  },
  nuit: {
    ciel:["#0a1024","#141c38","#242c4a"], soleil:"#e8eeff", soleilY:80, halo:.52,
    mur:["#3a2e34","#2a2028"], murOmbre:"#1e1620", pierre:"#4a3c40",
    toit:"#1a1418", trottoir:["#3a3438","#282428"], route:["#1c1c22","#141418"],
    fenetres:"#ffd89a", lumieres:true, ombreLong:1.2, ombreOpac:.10,
    brume:"#3a4a6a", brumeOpac:.14, vignette:.5, immeubles:["#232030","#1a1826","#12111c"]
  }
};

/* ------------------------------------------------------------
   Petites fabriques réutilisables
   ------------------------------------------------------------ */

/* une fenêtre d'immeuble voisin, allumée ou non */
function fenetreVoisin(x, y, l, h, P, allumee){
  return `<rect x="${x}" y="${y}" width="${l}" height="${h}" rx="1"
    fill="${allumee ? P.fenetres : "#1a1a22"}" opacity="${allumee ? .9 : .55}"/>`;
}

/* rangée d'ampoules sur un rail */
function ampoules(x1, x2, y, n, r = 2.4){
  const pas = (x2 - x1) / (n - 1);
  return [...Array(n)].map((_,i)=>
    `<circle cx="${(x1 + i*pas).toFixed(1)}" cy="${y}" r="${r}"
      fill="url(#ampouleG)" class="amp a${i%4}"/>`).join("");
}

/* pilastre cannelé art déco */
function pilastre(x, yHaut, yBas, l, P){
  const n = 4, pas = l / (n + 1);
  return `<g>
    <rect x="${x}" y="${yHaut}" width="${l}" height="${yBas - yHaut}" fill="url(#pierreG)"/>
    <rect x="${x}" y="${yHaut}" width="${l * .3}" height="${yBas - yHaut}" fill="#fff" opacity=".08"/>
    <rect x="${x + l*.78}" y="${yHaut}" width="${l * .22}" height="${yBas - yHaut}"
      fill="#000" opacity=".14"/>
    ${[...Array(n)].map((_,i)=>
      `<rect x="${(x + pas*(i+1) - .6).toFixed(1)}" y="${yHaut + 8}" width="1.2"
        height="${yBas - yHaut - 16}" fill="#000" opacity=".16"/>`).join("")}
    <!-- chapiteau -->
    <rect x="${x - 2}" y="${yHaut - 6}" width="${l + 4}" height="6" fill="url(#pierreG)"/>
    <rect x="${x - 3}" y="${yHaut - 9}" width="${l + 6}" height="3.5" fill="url(#orG)"/>
    <!-- base -->
    <rect x="${x - 2}" y="${yBas}" width="${l + 4}" height="7" fill="url(#pierreG)"/>
    <rect x="${x - 2}" y="${yBas + 7}" width="${l + 4}" height="2" fill="#000" opacity=".2"/>
  </g>`;
}

/* vitrine d'affiche avec reflet de verre */
function vitrine(x, y, l, h, seance, lum){
  const genre = (seance && seance.genre) || "défaut";
  const COUL = {"Drame":"#1f3a5c","Aventure":"#1d5c52","Animation":"#4a3f8c",
    "Documentaire":"#2a6b6b","Thriller familial":"#3a2a52","Comédie":"#c07a1f",
    "Romance":"#a83a5c","défaut":"#5a2a34"};
  const c = COUL[genre] || COUL["défaut"];
  const t = (seance && seance.titre) || "";
  const lignes = decoupe(t.toUpperCase(), 12).slice(0, 3);

  return `<g>
    <!-- caisson -->
    <rect x="${x-4}" y="${y-4}" width="${l+8}" height="${h+8}" rx="2" fill="url(#laitonG)"/>
    <rect x="${x-2}" y="${y-2}" width="${l+4}" height="${h+4}" rx="1" fill="#1a1218"/>
    <!-- affiche -->
    <rect x="${x}" y="${y}" width="${l}" height="${h}" fill="${c}"/>
    <rect x="${x}" y="${y}" width="${l}" height="${h}" fill="url(#afficheG)"/>
    ${seance ? `
      <circle cx="${x + l/2}" cy="${y + h*.3}" r="${l*.22}" fill="#fff" opacity=".16"/>
      ${lignes.map((ln,i)=>`<text x="${x + l/2}" y="${y + h*.62 + i*9}" text-anchor="middle"
        font-family="Georgia" font-size="7" font-weight="bold" fill="#fdf3d2"
        letter-spacing=".4">${ln}</text>`).join("")}
      <text x="${x + l/2}" y="${y + h - 7}" text-anchor="middle" font-family="Courier New"
        font-size="6.5" fill="#fdf3d2" opacity=".75" letter-spacing="1">${seance.heure || ""}</text>
    ` : `<text x="${x + l/2}" y="${y + h/2}" text-anchor="middle" font-family="Courier New"
        font-size="8" fill="#fdf3d2" opacity=".45" letter-spacing="1.5">PROCHAINEMENT</text>`}
    <!-- reflet de verre -->
    <path d="M${x} ${y+h} L${x + l*.55} ${y} L${x + l*.85} ${y} L${x + l*.3} ${y+h} Z"
      fill="#fff" opacity=".07"/>
    <path d="M${x + l*.72} ${y+h} L${x + l} ${y + h*.5} L${x+l} ${y + h*.68} L${x + l*.88} ${y+h} Z"
      fill="#fff" opacity=".05"/>
    ${lum ? `<rect x="${x}" y="${y}" width="${l}" height="${h}" fill="#ffdf9a" opacity=".07"/>` : ""}
  </g>`;
}

function decoupe(t, max){
  const mots = String(t).split(" "), out = []; let l = "";
  mots.forEach(m=>{ if((l+" "+m).trim().length <= max) l = (l+" "+m).trim();
                    else { if(l) out.push(l); l = m; } });
  if(l) out.push(l);
  return out;
}

/* ------------------------------------------------------------
   LA FAÇADE COMPLÈTE
   ------------------------------------------------------------ */

/* ---- exports ---- */
export {
  PALETTES,
  ampoules,
  decoupe,
  fenetreVoisin,
  pilastre,
  vitrine
};
