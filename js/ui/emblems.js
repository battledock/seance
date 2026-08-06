/* ============================================================
   EMBLÈMES — avatars SVG prédéfinis (aucun envoi d'image)
   ============================================================ */
const EMBLEMES = {
  bobine:     {nom:"Bobine dorée", svg:`<circle cx="30" cy="30" r="22" fill="#1c070d" stroke="#caa24a" stroke-width="3"/>
    <circle cx="30" cy="30" r="5" fill="#caa24a"/>
    <circle cx="30" cy="15" r="4.5" fill="#0d0306"/><circle cx="43" cy="38" r="4.5" fill="#0d0306"/><circle cx="17" cy="38" r="4.5" fill="#0d0306"/>`},
  projecteur: {nom:"Projecteur", svg:`<rect x="10" y="24" width="26" height="18" rx="3" fill="#caa24a"/>
    <path d="M36 33 L50 26 L50 42 L36 38 Z" fill="#f7dd9a"/>
    <circle cx="18" cy="18" r="7" fill="none" stroke="#caa24a" stroke-width="3"/>
    <circle cx="30" cy="19" r="5" fill="none" stroke="#caa24a" stroke-width="3"/>`},
  etoile:     {nom:"Étoile", svg:`<path d="M30 10 L36 24 L51 26 L40 36 L43 51 L30 43 L17 51 L20 36 L9 26 L24 24 Z"
    fill="#f7dd9a" stroke="#caa24a" stroke-width="2" stroke-linejoin="round"/>`},
  fauteuil:   {nom:"Fauteuil rouge", svg:`<path d="M16 28 L16 18 Q16 14 20 14 L40 14 Q44 14 44 18 L44 28" fill="none" stroke="#a82b3d" stroke-width="4"/>
    <rect x="12" y="27" width="36" height="14" rx="4" fill="#a82b3d"/>
    <rect x="16" y="41" width="4" height="7" fill="#5c1220"/><rect x="40" y="41" width="4" height="7" fill="#5c1220"/>`},
  ticket:     {nom:"Ticket ancien", svg:`<path d="M9 22 L51 22 L51 30 Q46 31 46 34 Q46 37 51 38 L51 46 L9 46 L9 38 Q14 37 14 34 Q14 31 9 30 Z"
    fill="#fdf3d2" stroke="#caa24a" stroke-width="2.5"/>
    <path d="M28 22 L28 46" stroke="#caa24a" stroke-width="1.6" stroke-dasharray="3 3"/>`},
  clap:       {nom:"Clap", svg:`<rect x="10" y="28" width="40" height="20" rx="2" fill="#241a12" stroke="#caa24a" stroke-width="2"/>
    <path d="M10 26 L48 16 L50 24 L12 34 Z" fill="#caa24a"/>
    <path d="M20 24 L23 17 M30 21 L33 14 M40 18 L43 11" stroke="#241a12" stroke-width="2.5"/>`},
  popcorn:    {nom:"Popcorn", svg:`<path d="M20 26 L40 26 L37 50 L23 50 Z" fill="#e8443a"/>
    <path d="M23 26 L22 50 M30 26 L30 50 M37 26 L38 50" stroke="#fdf3d2" stroke-width="2.5"/>
    <circle cx="24" cy="21" r="6" fill="#fdf3d2"/><circle cx="33" cy="18" r="7" fill="#f7dd9a"/><circle cx="39" cy="23" r="5" fill="#fdf3d2"/>`},
  lune:       {nom:"Lune de cinéma", svg:`<circle cx="30" cy="30" r="20" fill="#fdf6de"/>
    <circle cx="22" cy="26" r="18" fill="#1c070d"/>
    <circle cx="44" cy="16" r="2" fill="#f7dd9a"/><circle cx="49" cy="26" r="1.4" fill="#f7dd9a"/>`}
};
function embleme(cle, taille = 60){
  const e = EMBLEMES[cle] || EMBLEMES.bobine;
  return `<svg class="embleme" viewBox="0 0 60 60" width="${taille}" height="${taille}"
    xmlns="http://www.w3.org/2000/svg" aria-label="${e.nom}">${e.svg}</svg>`;
}

/* ---------- texte joueur : jamais injecté en HTML ---------- */
function texteSur(el, valeur){ if(el) el.textContent = valeur == null ? "" : String(valeur); }
function echappe(t){
  return String(t == null ? "" : t)
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;").replace(/'/g,"&#39;");
}

/* ---- exports ---- */
export {
  EMBLEMES,
  echappe,
  embleme,
  texteSur
};
