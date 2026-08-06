import { entreeDePage, installeTransitions, quitteLieu } from "./transitions.js?v=2ab9afab";

/* Décors de lieu, transitions entre pages, narration. */


/* ============================================================
   AMBIANCE — la couche qui transforme des pages en lieux.
   Trois rôles : décor propre à chaque lieu, animations passives
   discrètes, et transitions entre les pièces du bâtiment.
   ============================================================ */

/* le joueur peut avoir demandé moins d'animation, ou avoir un appareil modeste */
const MOUVEMENT_REDUIT = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const APPAREIL_MODESTE = (navigator.hardwareConcurrency || 4) <= 4
  || (navigator.deviceMemory || 4) <= 2;
const ANIMATIONS_LEGERES = MOUVEMENT_REDUIT || APPAREIL_MODESTE;

/* ---------- décors par lieu ---------- */
const DECORS = {
  jeu: ()=>"",   /* la façade fait déjà le travail */

  salles: ()=>`
    <div class="decorLieu decorSalles" aria-hidden="true">
      <svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMax slice">
        <defs>
          <linearGradient id="faisceau" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#ffe9b0" stop-opacity=".22"/>
            <stop offset="1" stop-color="#ffe9b0" stop-opacity="0"/>
          </linearGradient>
        </defs>
        <path d="M0 32 L400 32 L400 200 L0 200 Z" fill="#2a0f18" opacity=".55"/>
        <path d="M24 26 L86 8 L400 96 L400 200 L24 200 Z" fill="url(#faisceau)" class="faisceauProj"/>
        <g fill="#3d1620" opacity=".7">
          ${[0,1,2].map(r=>`<g transform="translate(0 ${150+r*18})">
            ${[...Array(9)].map((_,i)=>`<rect x="${8+i*44}" y="0" width="34" height="15" rx="4"/>`).join("")}
          </g>`).join("")}
        </g>
      </svg>
    </div>`,

  programmation: ()=>`
    <div class="decorLieu decorProg" aria-hidden="true">
      <svg viewBox="0 0 400 120" preserveAspectRatio="xMidYMin slice">
        <rect x="0" y="0" width="400" height="120" fill="#1a0a10"/>
        <g class="ampoulesPanneau">
          ${[...Array(14)].map((_,i)=>
            `<circle cx="${16+i*28}" cy="12" r="3.2" fill="#ffdf9a" class="amp a${i%4}"/>`).join("")}
        </g>
        <g opacity=".5">
          ${[0,1,2,3].map(i=>`<rect x="${28+i*96}" y="30" width="62" height="80" rx="3"
            fill="none" stroke="#caa24a" stroke-width="1.6"/>`).join("")}
        </g>
      </svg>
    </div>`,

  studio: ()=>`
    <div class="decorLieu decorStudio" aria-hidden="true">
      <svg viewBox="0 0 400 150" preserveAspectRatio="xMidYMin slice">
        <rect width="400" height="150" fill="#14161c"/>
        <g stroke="#3a3f4a" stroke-width="2" fill="none">
          <path d="M0 34 L400 34"/><path d="M60 34 L60 8"/><path d="M180 34 L180 4"/><path d="M310 34 L310 10"/>
        </g>
        <g fill="#2a2f38">
          <rect x="44" y="34" width="32" height="18" rx="3"/>
          <rect x="164" y="34" width="32" height="18" rx="3"/>
          <rect x="294" y="34" width="32" height="18" rx="3"/>
        </g>
        <g class="halosStudio">
          <ellipse cx="60" cy="96" rx="52" ry="44" fill="#ffe1a8" opacity=".10"/>
          <ellipse cx="180" cy="104" rx="62" ry="50" fill="#ffe1a8" opacity=".12"/>
          <ellipse cx="310" cy="98" rx="48" ry="42" fill="#ffe1a8" opacity=".09"/>
        </g>
        <g transform="translate(330 96)" opacity=".55">
          <rect x="0" y="8" width="44" height="14" rx="2" fill="#20242c" stroke="#4a5058" stroke-width="1.4"/>
          <path d="M0 6 L42 -2 L44 6 Z" fill="#4a5058"/>
        </g>
      </svg>
    </div>`,

  communaute: ()=>`
    <div class="decorLieu decorHall" aria-hidden="true">
      <svg viewBox="0 0 400 130" preserveAspectRatio="xMidYMin slice">
        <rect width="400" height="130" fill="#2e1a24"/>
        <rect y="0" width="400" height="18" fill="#1c1018"/>
        <g fill="#ffdf9a" opacity=".85">
          <circle cx="80" cy="9" r="2.8" class="amp a0"/><circle cx="200" cy="9" r="2.8" class="amp a2"/>
          <circle cx="320" cy="9" r="2.8" class="amp a1"/>
        </g>
        <g opacity=".45">
          <rect x="40" y="34" width="46" height="62" rx="2" fill="#7c1c2e" stroke="#caa24a" stroke-width="1.4"/>
          <rect x="176" y="30" width="48" height="66" rx="2" fill="#1f3a5c" stroke="#caa24a" stroke-width="1.4"/>
          <rect x="314" y="34" width="46" height="62" rx="2" fill="#4a3f8c" stroke="#caa24a" stroke-width="1.4"/>
        </g>
        <path d="M120 130 L160 96 L246 96 L286 130 Z" fill="#a82b3d" opacity=".35"/>
      </svg>
    </div>`,

  progression: ()=>`
    <div class="decorLieu decorMur" aria-hidden="true">
      <svg viewBox="0 0 400 140" preserveAspectRatio="xMidYMin slice">
        <rect width="400" height="140" fill="#241820"/>
        <g stroke="#3a2a30" stroke-width="1" opacity=".6">
          ${[...Array(8)].map((_,i)=>`<path d="M${i*52} 0 L${i*52} 140"/>`).join("")}
        </g>
        <g fill="none" stroke="#caa24a" stroke-width="2" opacity=".45">
          <rect x="46" y="30" width="52" height="66" rx="2"/>
          <rect x="126" y="42" width="44" height="54" rx="2"/>
          <rect x="200" y="26" width="56" height="70" rx="2"/>
          <rect x="286" y="40" width="46" height="56" rx="2"/>
        </g>
        <g fill="#caa24a" opacity=".22">
          <circle cx="72" cy="63" r="13"/><circle cx="148" cy="69" r="11"/>
          <circle cx="228" cy="61" r="14"/><circle cx="309" cy="68" r="11"/>
        </g>
      </svg>
    </div>`,

  evenements: ()=>`
    <div class="decorLieu decorFete" aria-hidden="true">
      <svg viewBox="0 0 400 110" preserveAspectRatio="xMidYMin slice">
        <rect width="400" height="110" fill="#1c1224"/>
        <path d="M0 12 Q50 40 100 12 Q150 40 200 12 Q250 40 300 12 Q350 40 400 12"
          fill="none" stroke="#caa24a" stroke-width="2" opacity=".7"/>
        ${[...Array(9)].map((_,i)=>{
          const x = 22+i*44, c = ["#e8443a","#e8b84b","#5fd8c8","#a83a5c"][i%4];
          return `<path d="M${x} ${20+(i%2?12:2)} l7 13 l-7 11 l-7 -11 Z" fill="${c}"
            opacity=".8" class="fanion f${i%3}"/>`;}).join("")}
      </svg>
    </div>`
};

/* ---------- poussière dans les faisceaux ---------- */
function poussiere(n){
  if(ANIMATIONS_LEGERES) return "";
  return `<div class="poussiere" aria-hidden="true">${
    [...Array(n)].map(()=>{
      const g = Math.random()*100, t = 14 + Math.random()*16, d = -Math.random()*t;
      const s = 1 + Math.random()*1.6;
      return `<i style="left:${g}%;width:${s}px;height:${s}px;
        animation-duration:${t}s;animation-delay:${d}s;
        --derive:${(Math.random()*40-20).toFixed(0)}px"></i>`;
    }).join("")}</div>`;
}

/* ============================================================
   MISE EN PLACE
   ============================================================ */
function initAmbiance(lieu){
  /* une classe par lieu : elle permet à une page de neutraliser le décor */
  document.body.classList.add("lieu" + lieu.charAt(0).toUpperCase() + lieu.slice(1));

  /* Les pages refondues en clair le signalent par une classe sur leur
     contenu. On la remonte sur le body pour teindre le fond — en visant
     la page et non le lieu, car deux pages peuvent partager un lieu. */
  if(document.querySelector(".accueilClair, .sallesClair"))
    document.body.classList.add("pageClaire");
  document.body.dataset.lieu = lieu || "jeu";
  if(ANIMATIONS_LEGERES) document.body.classList.add("animLegeres");

  const decor = (DECORS[lieu] || (()=>""))();
  if(decor){
    const d = document.createElement("div");
    d.innerHTML = decor + (lieu === "salles" || lieu === "studio" ? poussiere(14) : "");
    while(d.firstChild) document.body.insertBefore(d.firstChild, document.body.firstChild);
  }

  entreeDePage();
  installeTransitions();
  economiseHorsEcran();
}

/* ---------- rien ne tourne quand l'onglet est caché ---------- */
function economiseHorsEcran(){
  document.addEventListener("visibilitychange", ()=>{
    document.body.classList.toggle("enPause", document.hidden);
  });
}

/* ============================================================
   NARRATION — les chiffres restent, la phrase passe devant
   ============================================================ */
function phraseFrequentation(spectateurs, capacite){
  const t = capacite > 0 ? spectateurs / capacite : 0;
  if(t >= 1)   return "Salle comble. On a refusé du monde.";
  if(t >= .85) return "Presque plein. Les derniers rangs se sont remplis.";
  if(t >= .6)  return "Belle affluence. Le hall bourdonnait.";
  if(t >= .35) return "Une salle correcte, sans plus.";
  if(t > 0)    return "Quelques fidèles, et beaucoup de fauteuils vides.";
  return "Personne n'est venu. Ça arrive.";
}
function phraseRecette(net){
  if(net >= 800) return "La soirée dépasse largement les attentes.";
  if(net >= 300) return "Bonne journée pour la caisse.";
  if(net >= 0)   return "La journée s'équilibre tout juste.";
  if(net >= -200) return "On perd un peu. Rien d'alarmant.";
  return "La caisse a souffert aujourd'hui.";
}
function phraseNiveau(niveau){
  if(niveau >= 40) return "Ton cinéma est une institution.";
  if(niveau >= 25) return "On vient d'autres quartiers pour toi.";
  if(niveau >= 15) return "Ton cinéma compte dans le quartier.";
  if(niveau >= 8)  return "Ton cinéma commence à être connu.";
  if(niveau >= 3)  return "Les habitués reviennent.";
  return "Les débuts, avec une seule salle et beaucoup d'espoir.";
}
function phraseSatisfaction(sat){
  if(sat >= 88) return "Le public est reparti enchanté.";
  if(sat >= 72) return "Les spectateurs ont passé un bon moment.";
  if(sat >= 55) return "Un accueil correct, sans enthousiasme.";
  if(sat >= 40) return "Quelques remarques à la sortie.";
  return "Le public a fait la grimace.";
}

/* ---- exports ---- */
export { quitteLieu };
export {
  ANIMATIONS_LEGERES,
  APPAREIL_MODESTE,
  DECORS,
  MOUVEMENT_REDUIT,
  economiseHorsEcran,
  initAmbiance,
  phraseFrequentation,
  phraseNiveau,
  phraseRecette,
  phraseSatisfaction,
  poussiere,
};
