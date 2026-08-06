import { echappe } from "./emblems.js?v=2ab9afab";

/* ============================================================
   AFFICHES DE FILM — SVG généré, aucune image externe
   ============================================================ */
const FONDS_AFFICHE = {
  nuit:    {nom:"Nuit", haut:"#1a2340", bas:"#0a0d1c"},
  aube:    {nom:"Aube", haut:"#8a5484", bas:"#e8956a"},
  rouge:   {nom:"Velours", haut:"#7c1c2e", bas:"#2a0810"},
  vert:    {nom:"Forêt", haut:"#1d5c52", bas:"#0c2420"},
  papier:  {nom:"Papier", haut:"#e8dcc0", bas:"#c4b394"},
  encre:   {nom:"Encre", haut:"#2a2830", bas:"#101014"}
};
const ACCENTS_AFFICHE = {
  or:      {nom:"Or", c:"#e8b84b"},
  creme:   {nom:"Crème", c:"#fdf3d2"},
  rouge:   {nom:"Rouge", c:"#e8443a"},
  turquoise:{nom:"Turquoise", c:"#5fd8c8"}
};
const MOTIFS_AFFICHE = {
  lune:    (a)=>`<circle cx="90" cy="72" r="30" fill="${a}" opacity=".85"/>
                 <circle cx="78" cy="64" r="27" fill="#0000" stroke="none"/>`,
  soleil:  (a)=>`<circle cx="90" cy="76" r="24" fill="${a}"/>
                 ${[...Array(12)].map((_,i)=>{const r=i*30*Math.PI/180;
                   return `<line x1="${90+Math.cos(r)*32}" y1="${76+Math.sin(r)*32}"
                     x2="${90+Math.cos(r)*42}" y2="${76+Math.sin(r)*42}"
                     stroke="${a}" stroke-width="3" stroke-linecap="round" opacity=".8"/>`}).join("")}`,
  silhouette:(a)=>`<path d="M60 150 L60 108 Q60 92 76 92 Q92 92 92 108 L92 150 Z" fill="${a}" opacity=".9"/>
                 <circle cx="76" cy="80" r="13" fill="${a}"/>
                 <path d="M104 150 L104 116 Q104 102 118 102 Q132 102 132 116 L132 150 Z" fill="${a}" opacity=".6"/>
                 <circle cx="118" cy="92" r="11" fill="${a}" opacity=".6"/>`,
  escalier:(a)=>`<path d="M40 160 L40 140 L70 140 L70 120 L100 120 L100 100 L130 100 L130 80 L160 80"
                   stroke="${a}" stroke-width="5" fill="none" stroke-linejoin="round"/>`,
  fenetre: (a)=>`<rect x="58" y="56" width="64" height="82" rx="3" fill="none" stroke="${a}" stroke-width="4"/>
                 <line x1="90" y1="56" x2="90" y2="138" stroke="${a}" stroke-width="3"/>
                 <line x1="58" y1="97" x2="122" y2="97" stroke="${a}" stroke-width="3"/>`,
  pellicule:(a)=>`<rect x="52" y="58" width="76" height="86" rx="3" fill="none" stroke="${a}" stroke-width="4"/>
                 ${[66,86,106,126].map(y=>`<rect x="56" y="${y}" width="7" height="9" fill="${a}"/>
                   <rect x="117" y="${y}" width="7" height="9" fill="${a}"/>`).join("")}`
};

/* affiche d'un film — titre toujours échappé */
function afficheFilmSVG(config, titre, sousTitre, taille = 180){
  const c = config || {};
  const f = FONDS_AFFICHE[c.fond] || FONDS_AFFICHE.nuit;
  const a = (ACCENTS_AFFICHE[c.accent] || ACCENTS_AFFICHE.or).c;
  const motif = (MOTIFS_AFFICHE[c.motif] || MOTIFS_AFFICHE.lune)(a);
  const serif = (c.typo || "classique") === "classique";
  const id = "aff" + Math.random().toString(36).slice(2, 8);

  /* titre coupé en lignes courtes */
  const mots = String(titre || "").toUpperCase().split(" ");
  const lignes = []; let l = "";
  mots.forEach(m=>{ if((l+" "+m).trim().length <= 14) l = (l+" "+m).trim(); else { lignes.push(l); l = m; } });
  if(l) lignes.push(l);
  const trois = lignes.slice(0, 3);
  const tailleTitre = trois.length > 2 ? 13 : 16;

  return `<svg viewBox="0 0 180 260" width="${taille}" class="afficheFilm"
    xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Affiche du film">
    <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${f.haut}"/><stop offset="1" stop-color="${f.bas}"/>
    </linearGradient></defs>
    <rect width="180" height="260" fill="url(#${id})"/>
    <rect x="6" y="6" width="168" height="248" fill="none" stroke="${a}" stroke-width="1.5" opacity=".65"/>
    ${motif}
    ${trois.map((t,i)=>`<text x="90" y="${190 + i*(tailleTitre+3)}" text-anchor="middle"
      font-family="${serif ? "Georgia,serif" : "'Courier New',monospace"}" font-weight="bold"
      font-size="${tailleTitre}" letter-spacing="${serif ? 1.5 : 0.8}" fill="${a}">${echappe(t)}</text>`).join("")}
    <line x1="52" y1="${196 + trois.length*(tailleTitre+3)}" x2="128"
      y2="${196 + trois.length*(tailleTitre+3)}" stroke="${a}" stroke-width="1" opacity=".6"/>
    <text x="90" y="${212 + trois.length*(tailleTitre+3)}" text-anchor="middle"
      font-family="'Courier New',monospace" font-size="7" letter-spacing="1.6"
      fill="${a}" opacity=".75">${echappe(String(sousTitre || "").toUpperCase().slice(0,26))}</text>
  </svg>`;
}

/* trois propositions déduites du genre, pour un choix rapide */
function propositionsAffiche(genre){
  const parGenre = {
    Drame:      [["nuit","silhouette","or"],["encre","fenetre","creme"],["aube","lune","or"]],
    Documentaire:[["papier","pellicule","encre"],["vert","fenetre","creme"],["encre","escalier","turquoise"]],
    Aventure:   [["aube","soleil","or"],["vert","escalier","creme"],["nuit","lune","turquoise"]],
    Comédie:    [["aube","soleil","rouge"],["papier","silhouette","rouge"],["rouge","pellicule","creme"]],
    Thriller:   [["encre","escalier","rouge"],["nuit","fenetre","turquoise"],["encre","silhouette","creme"]],
    Action:     [["rouge","soleil","or"],["encre","escalier","rouge"],["nuit","silhouette","rouge"]]
  };
  const base = parGenre[genre] || parGenre.Drame;
  return base.map(([fond, motif, accent])=>({fond, motif, accent, typo:"classique"}));
}

/* ---- exports ---- */
export {
  ACCENTS_AFFICHE,
  FONDS_AFFICHE,
  MOTIFS_AFFICHE,
  afficheFilmSVG,
  propositionsAffiche
};
