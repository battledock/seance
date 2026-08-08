/* ============================================================
   LA SEMAINE, LES CLASSES, LES ENGAGEMENTS

   Six systèmes qui tournent autour de la même question : quoi
   programmer aujourd'hui.

   Jusqu'ici tous les jours se ressemblaient — un mardi valait un
   samedi. C'était le manque le plus structurel du jeu. La bande
   de semaine rend ce rythme visible pendant qu'on décide.
   ============================================================ */

import { echappe } from "./grille.js?v=becf21cb";

const eur = n => Math.round(Number(n) || 0).toLocaleString("fr") + " €";
const fmt = v => (Number(v) || 0).toFixed(2).replace(".", ",") + " €";

/* ---------- la bande de semaine ---------- */
function rendSemaine(cible, s){
  if(!cible || !s || !s.semaine) return;
  const j = s.semaine;
  const idx = j.findIndex(x => x.actuel);
  const auj = s.aujourdhui || {};

  const W = 350, H = 64, n = j.length, pas = W / n;
  const mx = 1.42, mn = 0.60;
  const X = i => pas * (i + .5);
  const Y = v => H - 9 - (v - mn) / (mx - mn) * (H - 24);

  let d = `M${X(0).toFixed(1)} ${Y(j[0].affluence).toFixed(1)}`;
  for(let i = 0; i < n - 1; i++){
    const x0 = X(i), y0 = Y(j[i].affluence);
    const x1 = X(i+1), y1 = Y(j[i+1].affluence);
    const cx = (x0 + x1) / 2;
    d += ` C${cx.toFixed(1)} ${y0.toFixed(1)} ${cx.toFixed(1)} ${y1.toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}`;
  }

  /* Le jour courant est marqué par un bandeau de pleine hauteur,
     pas par une barre proportionnelle : un lundi creux devenait
     invisible justement le jour où l'on en a le plus besoin. */
  let fonds = "", pts = "", jalons = "";
  for(let i = 0; i < n; i++){
    const v = j[i].affluence;
    if(j[i].actuel){
      fonds += `<rect x="${(X(i)-15).toFixed(1)}" y="0" width="30" height="${H}"
        rx="6" fill="#8a1c2c" opacity=".09"/>
        <rect x="${(X(i)-15).toFixed(1)}" y="0" width="30" height="${H}"
        rx="6" fill="none" stroke="#8a1c2c" stroke-width="1.4" opacity=".38"/>`;
    } else if(j[i].passe){
      fonds += `<rect x="${(X(i)-13).toFixed(1)}" y="0" width="26" height="${H}"
        rx="5" fill="#d8d0c4" opacity=".18"/>`;
    }
    if(j[i].sortie){
      jalons += `<circle cx="${X(i).toFixed(1)}" cy="${(Y(v)-9).toFixed(1)}"
        r="3.2" fill="#caa24a"/>`;
    }
    const r = j[i].actuel ? 4.4 : 2.6;
    pts += `<circle cx="${X(i).toFixed(1)}" cy="${Y(v).toFixed(1)}" r="${r}"
      fill="${j[i].actuel ? "#8a1c2c" : "#fff"}"
      stroke="${j[i].actuel ? "#fff" : "#c9a24a"}" stroke-width="2"/>`;
  }

  /* Un coefficient ne parle à personne : on le traduit en écart
     par rapport au jour le plus creux. */
  const creux = Math.min(...j.map(x => Number(x.affluence)));
  const rapport = (Number(auj.affluence) / creux);

  cible.innerHTML = `
    <div class="semT"><b>${echappe(auj.nom || "")}</b>
      <span>jour ${s.jour}${rapport >= 1.15
        ? ` · ${rapport.toFixed(1).replace(".", ",")} fois un lundi` : ""}</span></div>
    <div class="semVue">
      <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
        <defs><linearGradient id="semG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#caa24a" stop-opacity=".22"/>
          <stop offset="1" stop-color="#caa24a" stop-opacity="0"/></linearGradient></defs>
        ${fonds}
        <line x1="0" y1="${H-9}" x2="${W}" y2="${H-9}" stroke="#ece4d6" stroke-width="1"/>
        <path d="${d} L${X(n-1).toFixed(1)} ${H-9} L${X(0).toFixed(1)} ${H-9} Z"
          fill="url(#semG)"/>
        <path d="${d}" fill="none" stroke="#c9a24a" stroke-width="2"
          vector-effect="non-scaling-stroke" stroke-linejoin="round" stroke-linecap="round"/>
        ${jalons}${pts}
      </svg>
    </div>
    <div class="semJours">
      ${j.map(x => `<div class="j ${x.actuel ? "on" : x.passe ? "passe" : ""}">
        <span class="n">${echappe(x.court)}</span>
        <span class="m">${x.sortie ? "● sorties" : ""}</span></div>`).join("")}
    </div>
    ${auj.detail ? `<div class="semNote"><b>${echappe(auj.detail)}</b>
      ${conseilJour(auj)}</div>` : ""}`;
}

function conseilJour(a){
  const v = Number(a.affluence);
  if(a.sortie) return "Les enfants ne vont pas en classe l'après-midi.";
  if(v >= 1.25) return "Programmez large, la salle se remplira.";
  if(v >= 1.05) return "Une bonne journée : n'ayez pas peur d'ouvrir tôt.";
  if(v <= 0.80) return "Deux séances suffiront ; c'est le moment d'entretenir vos salles.";
  return "";
}

/* ---------- la classe qui réserve ---------- */
/* Le car jaune, la file d'enfants, l'accompagnatrice. C'est le
   seul moment attendrissant du jeu, autant l'assumer. */
function sceneCar(nb){
  const n = Math.max(4, Math.min(12, Math.round(nb / 5)));
  const couleurs = ["#c85a4a","#4a7ab8","#d8a44a","#5aa87a","#a85a9a","#e08a5a"];
  let enfants = "";
  for(let i = 0; i < n; i++){
    const x = 116 + i * 17 + ((i * 37) % 5 - 2);
    const s = .72 + ((i * 53) % 22) / 100;
    const c = couleurs[i % couleurs.length];
    enfants += `<g transform="translate(${x} 146) scale(${s.toFixed(2)})">
      <circle cx="0" cy="-19" r="5.6" fill="#e8c49a"/>
      <path d="M-5.6 -22 q5.6 -4 11.2 0 q-1 -5 -5.6 -5 q-4.6 0 -5.6 5z" fill="#4a3a2a"/>
      <path d="M-7 -13 q7 -3.5 14 0 l2 19 q-9 3.5 -18 0 z" fill="${c}"/>
      <rect x="4" y="-8" width="6" height="9" rx="1.6" fill="#8a6a4a"/></g>`;
  }

  return `<svg viewBox="0 0 390 158" preserveAspectRatio="xMidYMid slice">
  <defs>
    <linearGradient id="scC" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#8ab4cc"/><stop offset="1" stop-color="#dceaf2"/></linearGradient>
    <linearGradient id="scM" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#7a5a4c"/><stop offset="1" stop-color="#5a3e36"/></linearGradient>
    <linearGradient id="scCar" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#e8b81c"/><stop offset="1" stop-color="#c88c06"/></linearGradient>
  </defs>
  <rect width="390" height="158" fill="url(#scC)"/>
  <circle cx="52" cy="24" r="16" fill="#fff6d8" opacity=".85"/>
  <g fill="#fff" opacity=".55">
    <ellipse cx="292" cy="30" rx="30" ry="11"/><ellipse cx="314" cy="26" rx="22" ry="9"/>
    <ellipse cx="152" cy="18" rx="24" ry="9"/></g>
  <rect x="88" y="42" width="230" height="92" fill="url(#scM)"/>
  <rect x="84" y="36" width="238" height="8" rx="2" fill="#98786a"/>
  <rect x="132" y="54" width="142" height="24" rx="2" fill="#32241f"/>
  <rect x="132" y="54" width="142" height="24" rx="2" fill="none"
    stroke="#e8c060" stroke-width="1.6"/>
  <text x="203" y="70" text-anchor="middle" font-family="Marcellus,serif"
    font-size="9.5" fill="#f8e8b8" letter-spacing="1.5">SÉANCE SCOLAIRE</text>
  <rect x="176" y="86" width="54" height="48" rx="2" fill="#241a16"/>
  <rect x="180" y="90" width="22" height="40" fill="#f0d090" opacity=".5"/>
  <rect x="205" y="90" width="22" height="40" fill="#f0d090" opacity=".5"/>
  <rect x="106" y="88" width="42" height="42" rx="2" fill="#2a1e1a"/>
  <rect x="110" y="92" width="34" height="34" rx="1" fill="#6a8ab0"/>
  <rect x="258" y="88" width="42" height="42" rx="2" fill="#2a1e1a"/>
  <rect x="262" y="92" width="34" height="34" rx="1" fill="#b08a4a"/>
  <rect x="0" y="130" width="390" height="28" fill="#c0b8ac"/>
  <rect x="0" y="140" width="390" height="18" fill="#827e78"/>
  <g>
    <rect x="-6" y="72" width="126" height="56" rx="8" fill="url(#scCar)"/>
    <rect x="-6" y="72" width="126" height="10" rx="5" fill="#f4cc44" opacity=".62"/>
    <g fill="#3a5a6a" opacity=".82">
      <rect x="6" y="82" width="22" height="19" rx="2.5"/>
      <rect x="34" y="82" width="22" height="19" rx="2.5"/>
      <rect x="62" y="82" width="22" height="19" rx="2.5"/>
      <rect x="90" y="82" width="24" height="19" rx="2.5"/></g>
    <g fill="#e8c49a">
      <circle cx="14" cy="93" r="3.6"/><circle cx="24" cy="94" r="3.2"/>
      <circle cx="42" cy="93" r="3.6"/><circle cx="70" cy="94" r="3.4"/></g>
    <rect x="-6" y="104" width="126" height="5" fill="#2a2018"/>
    <rect x="96" y="108" width="20" height="20" rx="2" fill="#b07c06"/>
    <circle cx="22" cy="130" r="11" fill="#2a2622"/><circle cx="22" cy="130" r="4.6" fill="#827e78"/>
    <circle cx="96" cy="130" r="11" fill="#2a2622"/><circle cx="96" cy="130" r="4.6" fill="#827e78"/>
    <circle cx="108" cy="70" r="3.4" fill="#e05a3a"/>
  </g>
  ${enfants}
  <g transform="translate(300 145) scale(1.05)">
    <circle cx="0" cy="-24" r="6.6" fill="#e8c49a"/>
    <path d="M-6.6 -27 q6.6 -5 13.2 0 q-1.2 -6 -6.6 -6 q-5.4 0 -6.6 6z" fill="#6a4a3a"/>
    <path d="M-8.5 -17 q8.5 -4 17 0 l2.5 23 q-11 4 -22 0 z" fill="#4a5a7a"/></g>
</svg>`;
}

function rendScolaires(cible, l, surAccepter, surRefuser){
  if(!cible) return;
  if(!l || !l.length){ cible.innerHTML = ""; return; }

  cible.innerHTML = l.map(g => `
    <div class="sco" data-resa="${g.id}">
      <div class="scoScene">${sceneCar(g.eleves)}<div class="scoVoile"></div>
        <div class="scoTxt">
          <div class="kick">${g.jour ? "demain" : "aujourd'hui"} · onze heures</div>
          <h3>Une classe demande une séance</h3>
          <p>${echappe(g.etablissement)}</p>
        </div></div>
      <div class="scoCorps">
        <div class="scoLg"><span>Le film<small>tous publics · ${
          Math.floor((g.duree||0)/60)}h${String((g.duree||0)%60).padStart(2,"0")}</small></span>
          <b>${echappe(g.titre)}</b></div>
        <div class="scoLg"><span>Effectif<small>jauge garantie</small></span>
          <b>${g.eleves} élèves</b></div>
        <div class="scoLg"><span>Tarif de groupe</span><b>${fmt(g.tarif)}</b></div>
        <div class="scoLg"><span>Recette</span><b class="v">${eur(g.recette)}</b></div>
        <div class="scoNote">Les élèves viennent, quoi qu'il arrive : pas d'aléa,
          pas de bouche-à-oreille. Et le créneau de onze heures ne vous sert
          à rien d'autre.</div>
        <div class="scoActions">
          <button class="scoOui" data-oui="${g.id}">Accepter</button>
          <button class="scoNon" data-non="${g.id}">Refuser</button>
        </div>
      </div>
    </div>`).join("");

  cible.querySelectorAll("[data-oui]").forEach(b =>
    b.addEventListener("click", () => { b.disabled = true; surAccepter(b.dataset.oui); }));
  cible.querySelectorAll("[data-non]").forEach(b =>
    b.addEventListener("click", () => { b.disabled = true; surRefuser(b.dataset.non); }));
}

/* ---------- les engagements du distributeur ---------- */
/* On les découvrait au moment où le bouton d'ouverture refusait.
   Les montrer pendant qu'on programme change tout. */
function rendEngagements(cible, l){
  if(!cible) return;
  if(!l || !l.length){ cible.innerHTML = ""; return; }

  cible.innerHTML = `
    <div class="engT">Ce que le distributeur exige</div>
    ${l.map(e => {
      let pts = "";
      for(let i = 0; i < e.exigees; i++)
        pts += `<i class="${i < e.posees ? "on" : "manque"}"></i>`;
      return `<div class="engL">
        <span class="pts">${pts}</span>
        <span class="nm"><b>${echappe(e.titre)}</b>
          <small>${e.exigees} séance${e.exigees>1?"s":""} par jour · encore ${
            e.jours_restants} jour${e.jours_restants>1?"s":""}</small></span>
        <span class="st ${e.tenu ? "ok" : "non"}">${
          e.tenu ? "tenu" : e.posees + " sur " + e.exigees}</span>
      </div>`;
    }).join("")}`;
}

/* ---------- les avant-séances ---------- */
const CRANS = [
  {n:0, m:"rien"}, {n:1, m:"5 min"}, {n:2, m:"10 min"},
  {n:3, m:"15 min"}, {n:4, m:"20 min"}
];

function rendAvantSeance(cible, niveau, spectateurs, surRegler){
  if(!cible) return;
  const recette = niveau * 0.22;
  const agace = Math.max(0, niveau - 2) * 0.035;

  /* La jauge de patience : du vert tant que le public accepte,
     puis l'orange, puis le rouge. Un réglage abstrait devient
     une couleur qu'on comprend sans lire. */
  const segments = [];
  for(let i = 1; i <= niveau; i++){
    segments.push(`<i style="width:20%;background:${
      i <= 2 ? "#2a8a4a" : i === 3 ? "#c9a24a" : "#c05a3a"}"></i>`);
  }
  if(niveau < 5) segments.push(`<i style="flex:1;background:#f0ebe2"></i>`);

  cible.innerHTML = `
    <div class="pubT"><b>Avant le film</b><span>${niveau * 5} minutes</span></div>
    <div class="pubCrans">
      ${CRANS.map(c => `<button class="${c.n === niveau ? "on" : ""}" data-cran="${c.n}">
        <b>${c.n}</b><small>${c.m}</small></button>`).join("")}
    </div>
    <div class="patience">${segments.join("")}</div>
    <div class="pubNote ${agace > 0 ? "alerte" : ""}">
      <b>${LIBELLES[niveau] || ""}</b> ${agace > 0
        ? `On vous le reprochera : votre note baisse de ${
            String(agace.toFixed(3)).replace(".", ",").replace(/0+$/, "")} étoile chaque jour.`
        : "Le public l'accepte sans broncher."}</div>
    ${niveau > 0 ? `
      <div class="pubLg"><span>Recette par spectateur</span>
        <b class="v">+${fmt(recette)}</b></div>
      ${spectateurs ? `<div class="pubLg"><span>Sur ${spectateurs} spectateurs</span>
        <b class="v">+${eur(recette * spectateurs)} par jour</b></div>` : ""}
      ${agace > 0 ? `<div class="pubLg"><span>Coût en réputation</span>
        <b class="r">−${String(agace).replace(".", ",")} étoile par jour</b></div>` : ""}
    ` : ""}`;

  cible.querySelectorAll("[data-cran]").forEach(b =>
    b.addEventListener("click", () => surRegler(Number(b.dataset.cran))));
}

const LIBELLES = ["Aucune publicité", "Bandes-annonces seules",
  "Bandes-annonces et deux réclames", "Cinq minutes de publicité",
  "Un quart d'heure avant le film", "Beaucoup trop long"];

export { rendSemaine, rendScolaires, rendEngagements, rendAvantSeance, sceneCar };
