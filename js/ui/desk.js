import { toastSocial } from "../social.js?v=2ab9afab";
import { ouvreAssistant, ouvreFicheFilm, projet, reprendProjet } from "../studio.js?v=2ab9afab";

/* ============================================================
   LE BUREAU DU STUDIO
   Un plan de travail vu de dessus. Chaque objet posé dessus
   ouvre une partie du studio. Plus de cartes empilées.
   ============================================================ */

function bureauStudio(prods){
  const enCours = prods.filter(p=>["brouillon","tournage","postproduction"].includes(p.statut));
  const finis = prods.filter(p=>["termine","sorti"].includes(p.statut));
  const p = enCours[0];
  const avance = p ? Math.round((p.joursFaits / Math.max(1,p.joursRequis)) * 100) : 0;

  return `<svg viewBox="0 0 400 300" class="svgBureau" xmlns="http://www.w3.org/2000/svg"
    role="img" aria-label="Le bureau du studio">
  <defs>
    <linearGradient id="boisG" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#6b4a2a"/><stop offset="1" stop-color="#4a321c"/>
    </linearGradient>
    <radialGradient id="lampeG" cx=".5" cy=".2" r=".8">
      <stop offset="0" stop-color="#ffe9b0" stop-opacity=".42"/>
      <stop offset="1" stop-color="#ffe9b0" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="400" height="300" fill="#1a1218"/>
  <rect x="0" y="26" width="400" height="274" fill="url(#boisG)"/>
  <g stroke="#3a2716" stroke-width="1" opacity=".5">
    ${[60,120,180,240].map(y=>`<path d="M0 ${y} L400 ${y}"/>`).join("")}
  </g>
  <ellipse cx="200" cy="150" rx="210" ry="150" fill="url(#lampeG)" class="halolampe"/>

  <!-- les scénarios : une pile de feuilles -->
  <g class="objetBureau" data-cle="scenarios" role="button" tabindex="0"
     aria-label="Les scénarios">
    <g transform="translate(38 64) rotate(-6)">
      <rect x="0" y="4" width="72" height="94" rx="2" fill="#d8cdb4"/>
      <rect x="3" y="0" width="72" height="94" rx="2" fill="#efe6ce" stroke="#c2b494" stroke-width="1"/>
      <g stroke="#8a7c5c" stroke-width="1.4" opacity=".7">
        ${[16,26,36,50,60,70].map(y=>`<path d="M13 ${y} L${y%20===6?54:64} ${y}"/>`).join("")}
      </g>
      <rect x="13" y="78" width="34" height="8" rx="1" fill="#8c2331" opacity=".6"/>
    </g>
  </g>

  <!-- la caméra -->
  <g class="objetBureau" data-cle="camera" role="button" tabindex="0" aria-label="La caméra">
    <g transform="translate(150 52)">
      <rect x="0" y="22" width="58" height="34" rx="4" fill="#2a2830" stroke="#5a5a64" stroke-width="1.6"/>
      <circle cx="20" cy="12" r="13" fill="none" stroke="#5a5a64" stroke-width="3"/>
      <circle cx="44" cy="14" r="10" fill="none" stroke="#5a5a64" stroke-width="3"/>
      <path d="M58 32 L74 24 L74 52 L58 46 Z" fill="#3a3a44"/>
      <circle cx="14" cy="39" r="7" fill="#0d0d10" stroke="#8a8a94" stroke-width="1.6"/>
      <circle cx="14" cy="39" r="2.6" fill="#8fb6d8" class="oeilCamera"/>
      <rect x="26" y="58" width="8" height="22" fill="#3a3a44"/>
      <path d="M16 84 L30 60 L44 84" stroke="#3a3a44" stroke-width="4" fill="none"/>
    </g>
  </g>

  <!-- le clap -->
  <g class="objetBureau" data-cle="clap" role="button" tabindex="0" aria-label="Le clap">
    <g transform="translate(258 74) rotate(8)">
      <rect x="0" y="14" width="76" height="52" rx="3" fill="#241a20" stroke="#caa24a" stroke-width="1.6"/>
      <g class="clapHaut">
        <path d="M0 12 L72 -6 L76 10 L4 28 Z" fill="#caa24a"/>
        <g stroke="#241a20" stroke-width="4">
          <path d="M14 8 L18 -1"/><path d="M32 4 L36 -5"/><path d="M50 0 L54 -9"/>
        </g>
      </g>
      <g stroke="#5a4a38" stroke-width="1" opacity=".7">
        <path d="M8 30 L68 30"/><path d="M8 42 L68 42"/><path d="M8 54 L68 54"/>
      </g>
    </g>
  </g>

  <!-- le téléphone -->
  <g class="objetBureau" data-cle="telephone" role="button" tabindex="0" aria-label="Le téléphone">
    <g transform="translate(44 190)">
      <rect x="0" y="14" width="58" height="30" rx="5" fill="#1c1c22" stroke="#4a4a52" stroke-width="1.4"/>
      <path d="M6 12 q23 -14 46 0 l-4 8 q-19 -10 -38 0 Z" fill="#2e2e38"/>
      <circle cx="29" cy="32" r="9" fill="#3a3a44" stroke="#5a5a64" stroke-width="1.2"/>
      <path d="M58 26 q18 6 14 22" stroke="#4a4a52" stroke-width="2.4" fill="none" class="filTel"/>
    </g>
  </g>

  <!-- l'ordinateur de montage -->
  <g class="objetBureau" data-cle="montage" role="button" tabindex="0" aria-label="La table de montage">
    <g transform="translate(266 178)">
      <rect x="0" y="0" width="92" height="60" rx="4" fill="#1c1c22" stroke="#5a5a64" stroke-width="2"/>
      <rect x="6" y="6" width="80" height="48" rx="2" fill="#0d1418"/>
      <g class="ecranMontage">
        <rect x="10" y="12" width="72" height="14" fill="#1f3a5c" opacity=".8"/>
        <rect x="10" y="30" width="46" height="6" fill="#2e6b52" opacity=".8"/>
        <rect x="10" y="40" width="62" height="6" fill="#8a6c2a" opacity=".8"/>
      </g>
      <rect x="34" y="60" width="24" height="8" fill="#2a2a32"/>
      <rect x="18" y="68" width="56" height="4" rx="2" fill="#3a3a44"/>
    </g>
  </g>

  <!-- la bobine en cours, seulement s'il y a un tournage -->
  ${p ? `<g class="objetBureau enCours" data-cle="production" role="button" tabindex="0"
      aria-label="Production en cours" transform="translate(168 176)">
    <circle cx="34" cy="34" r="32" fill="#241a20" stroke="#caa24a" stroke-width="2.5"/>
    <circle cx="34" cy="34" r="7" fill="#caa24a"/>
    <g fill="#0d0508">
      <circle cx="34" cy="14" r="5.4"/><circle cx="51" cy="44" r="5.4"/><circle cx="17" cy="44" r="5.4"/>
    </g>
    <circle cx="34" cy="34" r="32" fill="none" stroke="#e8b84b" stroke-width="3.4"
      stroke-dasharray="${(avance*2.01).toFixed(0)} 400" stroke-linecap="round"
      transform="rotate(-90 34 34)" class="jaugeBobine"/>
    <text x="34" y="82" text-anchor="middle" font-family="Courier New" font-size="9"
      fill="#e8b84b">${p.joursFaits} / ${p.joursRequis}</text>
  </g>` : ""}

  <!-- la pile de films terminés -->
  ${finis.length ? `<g class="objetBureau" data-cle="filmotheque" role="button" tabindex="0"
      aria-label="Films terminés" transform="translate(324 92)">
    ${finis.slice(0,3).map((f,i)=>`<g transform="translate(${i*3} ${-i*5})">
      <rect x="0" y="0" width="46" height="14" rx="2" fill="#3a2a34" stroke="#caa24a" stroke-width="1.2"/>
      <rect x="4" y="4" width="38" height="2" fill="#caa24a" opacity=".5"/>
    </g>`).join("")}
    <text x="23" y="34" text-anchor="middle" font-family="Courier New" font-size="8"
      fill="#caa24a">${finis.length} film${finis.length>1?"s":""}</text>
  </g>` : ""}
</svg>`;
}

/* ---------- ce que chaque objet déclenche ---------- */
const MOTS_BUREAU = {
  scenarios:"Des idées, il y en a plein le tiroir. Le difficile, c'est de choisir.",
  camera:"Elle a filmé trois mariages et un enterrement. Elle est prête pour mieux.",
  clap:"Un bon clap, c'est le moment où le film existe vraiment.",
  telephone:"Le téléphone du studio. Il sonne rarement. On va changer ça.",
  montage:"La table de montage. C'est là qu'un film devient bon ou pas.",
  production:"Le tournage avance. Chaque journée jouée fait tourner la bobine.",
  filmotheque:"Nos films. Je les range par ordre de préférence. La mienne."
};

function brancheBureau(conteneur, prods){
  conteneur.querySelectorAll(".objetBureau").forEach(o=>{
    const cle = o.dataset.cle;
    const declenche = ()=>{
      o.classList.add("touche");
      setTimeout(()=>o.classList.remove("touche"), 460);
      if(typeof toastSocial === "function") toastSocial(MOTS_BUREAU[cle] || "", "camera");
      setTimeout(()=>actionBureau(cle, prods), 480);
    };
    o.addEventListener("click", declenche);
    o.addEventListener("keydown", e=>{
      if(e.key === "Enter" || e.key === " "){ e.preventDefault(); declenche(); }
    });
  });
}

function actionBureau(cle, prods){
  const enCours = prods.filter(p=>["brouillon","tournage","postproduction"].includes(p.statut));
  const finis = prods.filter(p=>["termine","sorti"].includes(p.statut));

  if(cle === "camera" || cle === "clap" || cle === "scenarios"){
    if(enCours.length){
      const p = enCours[0];
      if(p.statut === "brouillon") reprendProjet(p.id);
      else document.getElementById("blocProduction")?.scrollIntoView({behavior:"smooth"});
      return;
    }
    ouvreAssistant();
    if(cle === "scenarios") projet.etape = 1;
    return;
  }
  if(cle === "production" && enCours.length){
    document.getElementById("blocProduction")?.scrollIntoView({behavior:"smooth"});
    return;
  }
  if(cle === "filmotheque" || cle === "montage"){
    if(finis.length) ouvreFicheFilm(finis[0].id);
    else document.getElementById("blocFilms")?.scrollIntoView({behavior:"smooth"});
    return;
  }
  if(cle === "telephone"){
    toastSocial("Les appels de distributeurs arriveront plus tard.", "cloche");
  }
}

/* ---- exports ---- */
export {
  MOTS_BUREAU,
  actionBureau,
  brancheBureau,
  bureauStudio
};
