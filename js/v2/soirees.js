/* ============================================================
   LES SOIRÉES

   Deux façons de sortir de la routine. L'avant-première se
   mérite — elle n'est proposée qu'aux salles qui ont signé avant
   la sortie. Le gala se prépare : on compose un budget, et la
   scène change avec lui.

   Tout est dessiné plutôt que suggéré : un bandeau coloré ne
   fait pas un événement. On doit voir la file d'attente, le
   tapis rouge, les photographes — et surtout, on doit voir
   quand personne ne vient.
   ============================================================ */

import { echappe } from "./grille.js?v=becf21cb";
import { soireesPossibles, apercuSoiree, organiserSoiree, annulerSoiree,
         messageErreurV2 } from "./api.js?v=becf21cb";

const eur = n => Math.round(Number(n) || 0).toLocaleString("fr") + " €";
const fmt = v => (Number(v) || 0).toFixed(2).replace(".", ",") + " €";

/* un tirage stable : la même soirée doit se dessiner pareil à
   chaque rendu, sinon les silhouettes sautent d'un coup d'œil
   à l'autre */
function alea(graine){
  let x = graine * 9301 + 49297;
  return () => { x = (x * 9301 + 49297) % 233280; return x / 233280; };
}

function ciel(n, g, w = 390, h = 120){
  const r = alea(g); let o = "";
  for(let i = 0; i < n; i++)
    o += `<circle cx="${(r()*w).toFixed(0)}" cy="${(r()*h).toFixed(0)}"
      r="${(r()*1.1+.35).toFixed(1)}" fill="#fff" opacity="${(r()*.5+.2).toFixed(2)}"/>`;
  return o;
}

/* Une foule de silhouettes vues de dos. Leur nombre est le
   véritable message : quatre personnes derrière les cordons se
   voient plus sûrement qu'un avertissement écrit. */
function foule(y, n, g, teintes){
  const r = alea(g); let o = "";
  const t = teintes || ["#120c18", "#1a1220", "#221828"];
  for(let i = 0; i < n; i++){
    const x = 8 + i * 374 / Math.max(1, n - 1) + (r()*14 - 7);
    const s = .82 + r()*.36;
    o += `<g transform="translate(${x.toFixed(0)} ${y}) scale(${s.toFixed(2)})"
      fill="${t[i % t.length]}">
      <circle cx="0" cy="-26" r="7.4"/>
      <path d="M-11 -18 q11 -5 22 0 l3 26 q-14 5 -28 0 z"/></g>`;
  }
  return o;
}

/* ---------- la scène de l'avant-première ---------- */
function sceneAvantPremiere(titre){
  return `<svg viewBox="0 0 390 186" preserveAspectRatio="xMidYMid slice">
  <defs>
    <linearGradient id="apC" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#150e26"/><stop offset=".6" stop-color="#241a3e"/>
      <stop offset="1" stop-color="#33244a"/></linearGradient>
    <radialGradient id="apH" cx=".5" cy=".42" r=".55">
      <stop offset="0" stop-color="#ffd98a" stop-opacity=".5"/>
      <stop offset="1" stop-color="#ffd98a" stop-opacity="0"/></radialGradient>
    <linearGradient id="apM" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#4a3a58"/><stop offset="1" stop-color="#2a1f34"/></linearGradient>
  </defs>
  <rect width="390" height="186" fill="url(#apC)"/>
  ${ciel(40, 7)}
  <circle cx="326" cy="30" r="15" fill="#f2ead2" opacity=".9"/>
  <circle cx="319" cy="26" r="13.5" fill="#241a3e"/>
  <rect x="0" y="58" width="46" height="128" fill="#1b1428"/>
  <rect x="344" y="50" width="46" height="136" fill="#1b1428"/>
  <g fill="#e8cf94" opacity=".42">
    <rect x="9" y="70" width="8" height="11"/><rect x="26" y="70" width="8" height="11"/>
    <rect x="9" y="92" width="8" height="11"/><rect x="356" y="64" width="8" height="11"/>
    <rect x="372" y="86" width="8" height="11"/><rect x="356" y="108" width="8" height="11"/></g>
  <rect x="42" y="46" width="306" height="140" fill="url(#apM)"/>
  <rect x="38" y="40" width="314" height="9" rx="2" fill="#5c4a68"/>
  <ellipse cx="195" cy="100" rx="150" ry="52" fill="url(#apH)"/>
  <rect x="94" y="76" width="202" height="42" rx="3" fill="#150f18"/>
  <rect x="94" y="76" width="202" height="42" rx="3" fill="none"
    stroke="#f0c96a" stroke-width="2.2"/>
  <text x="195" y="96" text-anchor="middle" font-family="Marcellus,serif"
    font-size="12.5" fill="#ffeec4" letter-spacing="2.4">AVANT-PREMIÈRE</text>
  <text x="195" y="110" text-anchor="middle" font-family="Outfit,sans-serif"
    font-size="7.5" fill="#caa24a" letter-spacing="1.5">CE SOIR · 21H00</text>
  <g fill="#ffe9a8">${Array.from({length:11},(_,i)=>
    `<circle cx="${104+i*19}" cy="70" r="2.6"/>`).join("")}</g>
  <rect x="74" y="122" width="242" height="7" rx="2" fill="#6a5478" opacity=".9"/>
  <rect x="86" y="134" width="52" height="42" rx="2" fill="#1e1828"/>
  <rect x="90" y="138" width="44" height="34" rx="1" fill="#4a3a72"/>
  <rect x="252" y="134" width="52" height="42" rx="2" fill="#1e1828"/>
  <rect x="256" y="138" width="44" height="34" rx="1" fill="#3a2a5c"/>
  <rect x="160" y="130" width="70" height="46" rx="2" fill="#241c30"/>
  <rect x="164" y="134" width="30" height="38" fill="#3a3050" opacity=".85"/>
  <rect x="197" y="134" width="30" height="38" fill="#3a3050" opacity=".85"/>
  <rect x="0" y="172" width="390" height="14" fill="#171320"/>
  ${foule(180, 16, 11)}
  <g fill="#241c30"><rect x="52" y="132" width="3" height="42"/><circle cx="53.5" cy="129" r="5"/>
    <rect x="334" y="132" width="3" height="42"/><circle cx="335.5" cy="129" r="5"/></g>
  <circle cx="53.5" cy="129" r="20" fill="url(#apH)"/>
  <circle cx="335.5" cy="129" r="20" fill="url(#apH)"/>
</svg>`;
}

/* ---------- la scène du gala ----------
   Elle suit ce qu'on a payé : les faisceaux et les photographes
   n'apparaissent qu'à partir d'un certain budget, et la foule
   compte exactement le nombre de spectateurs attendus. */
function sceneGala(opts, attendus, places, titre){
  const o = new Set(opts || []);
  const nbFoule = Math.max(3, Math.round(attendus / Math.max(1, places) * 20));
  const rate = attendus < places * 0.55;

  let faisceaux = "";
  if(o.has("photos") || o.has("realisateur")){
    for(const [x0, ang] of [[70,-26],[150,-12],[240,12],[320,26]]){
      const dx = Math.tan(ang * Math.PI / 180) * 150;
      faisceaux += `<path d="M${x0} 160 L${(x0+dx-26).toFixed(0)} -30
        L${(x0+dx+26).toFixed(0)} -30 Z" fill="url(#gaR)" opacity=".55"/>`;
    }
  }

  let photos = "";
  if(o.has("photos")){
    for(let i = 0; i < 5; i++){
      const x = 34 + i * 74;
      photos += `<g transform="translate(${x} 172)">
        <circle cx="0" cy="-26" r="7" fill="#0e0a12"/>
        <path d="M-11 -18 q11 -5 22 0 l3 26 q-14 5 -28 0 z" fill="#150e18"/>
        <rect x="-8" y="-30" width="16" height="9" rx="2" fill="#2a2028"/>
        <circle cx="0" cy="-25.5" r="3" fill="#4a3f52"/>
        <circle cx="0" cy="-25.5" r="9" fill="#fff" opacity="${i % 2 ? .5 : .2}"/></g>`;
    }
  }

  const tapis = o.has("tapis");
  return `<svg viewBox="0 0 390 186" preserveAspectRatio="xMidYMid slice">
  <defs>
    <linearGradient id="gaC" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#1a0c14"/><stop offset="1" stop-color="#3a1420"/></linearGradient>
    <linearGradient id="gaR" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0" stop-color="#ffe0a0" stop-opacity=".34"/>
      <stop offset="1" stop-color="#ffe0a0" stop-opacity="0"/></linearGradient>
    <radialGradient id="gaH" cx=".5" cy=".4" r=".55">
      <stop offset="0" stop-color="#ffd98a" stop-opacity="${rate ? .26 : .52}"/>
      <stop offset="1" stop-color="#ffd98a" stop-opacity="0"/></radialGradient>
    <linearGradient id="gaT" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#a01f2e"/><stop offset="1" stop-color="#5c0f1a"/></linearGradient>
    <linearGradient id="gaM" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#5a3a3e"/><stop offset="1" stop-color="#2e1a20"/></linearGradient>
  </defs>
  <rect width="390" height="186" fill="url(#gaC)"/>
  ${ciel(26, 13)}
  ${faisceaux}
  <rect x="0" y="56" width="42" height="130" fill="#1e1016"/>
  <rect x="348" y="50" width="42" height="136" fill="#1e1016"/>
  <rect x="38" y="44" width="314" height="142" fill="url(#gaM)"/>
  <rect x="34" y="38" width="322" height="9" rx="2" fill="#6e4a4e"/>
  <ellipse cx="195" cy="98" rx="152" ry="50" fill="url(#gaH)"/>
  <rect x="92" y="74" width="206" height="40" rx="3" fill="#170e12"/>
  <rect x="92" y="74" width="206" height="40" rx="3" fill="none"
    stroke="#f0c96a" stroke-width="2.2"/>
  <text x="195" y="94" text-anchor="middle" font-family="Marcellus,serif"
    font-size="14" fill="#ffeec4" letter-spacing="3.4">GALA</text>
  <text x="195" y="107" text-anchor="middle" font-family="Outfit,sans-serif"
    font-size="7" fill="#caa24a" letter-spacing="1.2">${
      echappe((titre || "").toUpperCase().slice(0, 26))}</text>
  <g fill="#ffe9a8">${Array.from({length:11},(_,i)=>
    `<circle cx="${102+i*19}" cy="68" r="2.6"/>`).join("")}</g>
  <rect x="72" y="118" width="246" height="7" rx="2" fill="#7a5458" opacity=".9"/>
  <rect x="158" y="126" width="74" height="48" rx="2" fill="#1c1218"/>
  <rect x="163" y="130" width="30" height="40" fill="#f0c96a" opacity="${rate ? .14 : .34}"/>
  <rect x="197" y="130" width="30" height="40" fill="#f0c96a" opacity="${rate ? .14 : .34}"/>
  <rect x="84" y="130" width="50" height="44" rx="2" fill="#201418"/>
  <rect x="88" y="134" width="42" height="36" rx="1" fill="#8a5a2a"/>
  <rect x="256" y="130" width="50" height="44" rx="2" fill="#201418"/>
  <rect x="260" y="134" width="42" height="36" rx="1" fill="#7a4a24"/>
  <rect x="0" y="170" width="390" height="16" fill="#1c1620"/>
  ${tapis ? `<path d="M150 170 L240 170 L268 186 L122 186 Z" fill="url(#gaT)"/>
    <path d="M150 170 L240 170 L268 186 L122 186 Z" fill="none"
      stroke="#d8a84a" stroke-width="1.2" opacity=".6"/>
    <g stroke="#caa24a" stroke-width="1.6" fill="none" opacity=".85">
      <path d="M116 178 q18 7 36 0"/><path d="M274 178 q-18 7 -36 0"/></g>
    <g fill="#caa24a">
      <rect x="114" y="164" width="3.4" height="16" rx="1.6"/><circle cx="115.7" cy="162" r="2.6"/>
      <rect x="272" y="164" width="3.4" height="16" rx="1.6"/><circle cx="273.7" cy="162" r="2.6"/>
      <rect x="150" y="162" width="3.4" height="18" rx="1.6"/><circle cx="151.7" cy="160" r="2.6"/>
      <rect x="238" y="162" width="3.4" height="18" rx="1.6"/><circle cx="239.7" cy="160" r="2.6"/>
    </g>` : ""}
  ${foule(182, nbFoule, 17, ["#1a0e14","#241016","#2c141c"])}
  ${photos}
</svg>`;
}

/* ============================================================
   LE PANNEAU
   ============================================================ */
const CHECK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
  stroke-width="3.2" stroke-linecap="round"><path d="M4 12l6 6L20 6"/></svg>`;
const CADENAS = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
  stroke-width="1.9"><rect x="4" y="11" width="16" height="10" rx="2"/>
  <path d="M8 11V7a4 4 0 018 0v4"/></svg>`;

let etatPan = null;   /* {possibles, choix, genre, options} */

async function ouvreSoirees(surFait){
  const anc = document.getElementById("panSoiree");
  if(anc) anc.remove();

  const o = document.createElement("div");
  o.id = "panSoiree";
  o.className = "voilePanneau";
  o.innerHTML = `<div class="feuille">
    <div class="poignee"></div>
    <div class="fTete">
      <div class="fInfo"><b>Une soirée ?</b><span id="soSous">Un instant…</span></div>
      <button class="fX" aria-label="Fermer">✕</button>
    </div>
    <div class="fCorps" id="soCorps"><div class="cVide">Un instant…</div></div>
  </div>`;
  document.body.appendChild(o);
  requestAnimationFrame(() => o.classList.add("ouvert"));

  const ferme = () => { o.classList.remove("ouvert"); setTimeout(() => o.remove(), 260); };
  o.querySelector(".fX").addEventListener("click", ferme);
  o.addEventListener("click", e => { if(e.target === o) ferme(); });

  const r = await soireesPossibles();
  if(r.erreur){ document.getElementById("soCorps").innerHTML =
    `<div class="cVide">${echappe(messageErreurV2(r))}</div>`; return; }

  etatPan = {p: r.data, choix: null, genre: null, options: new Set(), ferme, surFait};
  rendPanneau();
}

function rendPanneau(){
  const {p} = etatPan;
  const sous = document.getElementById("soSous");
  const corps = document.getElementById("soCorps");
  if(!corps) return;

  sous.textContent = p.salle
    ? `demain soir · ${p.salle.nom} · ${p.salle.places} places`
    : "aucune salle disponible demain";

  if(p.deja_prevue){
    corps.innerHTML = `<div class="soDeja">
      <b>Une soirée est déjà prévue demain</b>
      <span>On n'en donne qu'une par soir.</span>
      <button class="soAnnuler">Annuler la soirée</button></div>`;
    corps.querySelector(".soAnnuler").addEventListener("click", async () => {
      const a = await annulerSoiree();
      if(a.erreur){ return; }
      etatPan.ferme(); etatPan.surFait && etatPan.surFait();
    });
    return;
  }

  const ap = p.avant_premieres || [];
  const ga = p.galas || [];

  corps.innerHTML = `
    ${ap.length ? `<div class="groupe">Avant-première</div>
      ${ap.map(f => carteAP(f)).join("")}` : ""}
    ${ga.length ? `<div class="groupe">Soirée de gala</div>
      ${ga.map(f => carteGala(f, p)).join("")}` : ""}
    ${!ap.length && !ga.length
      ? `<div class="cVide">Aucune soirée possible demain. Il faut une licence
         en cours, et une salle disponible.</div>` : ""}`;

  corps.querySelectorAll("[data-ap]").forEach(b =>
    b.addEventListener("click", () => lance("avant_premiere", b.dataset.ap, [])));
  corps.querySelectorAll("[data-gala]").forEach(b =>
    b.addEventListener("click", () => ouvreComposition(
      ga.find(x => x.sortie_id === b.dataset.gala))));
}

function carteAP(f){
  const bloque = !f.reserve || f.places_minimum > f.places;
  return `<div class="soCarte ${bloque ? "eteinte" : ""}">
    <div class="soScene">${sceneAvantPremiere(f.titre)}<div class="soVoile"></div>
      <div class="soTxt">
        <div class="kick">Demain soir · une seule séance</div>
        <h3>Avant-première</h3>
        <p>${echappe(f.titre)}</p>
      </div></div>
    <div class="soCorps2">
      ${bloque
        ? `<div class="soBloc">${CADENAS}<span>${!f.reserve
            ? "Les avant-premières sont réservées aux salles qui ont signé la licence avant la sortie. Vous pourrez programmer ce film dès demain, en séance normale."
            : `Ce film demande une salle de ${f.places_minimum} places.`}</span></div>`
        : `<div class="soLg"><span>Tarif unique<small>pour voir avant les autres</small></span>
             <b>${fmt(f.tarif)}</b></div>
           <div class="soLg"><span>Jauge<small>une seule copie</small></span>
             <b>${f.places} places</b></div>
           <button class="soGo" data-ap="${f.sortie_id}">
             Programmer l'avant-première · 21h00</button>`}
    </div>
  </div>`;
}

function carteGala(f, p){
  const dur = p.etoiles < (p.etoiles_min_gala || 2);
  return `<div class="soCarte ${dur ? "eteinte" : ""}">
    <div class="soScene">${sceneGala(["tapis"], Math.round(f.places * 0.7), f.places, f.titre)}
      <div class="soVoile"></div>
      <div class="soTxt">
        <div class="kick">Grande première · jour ${p.jour_soiree}</div>
        <h3>Soirée de gala</h3>
        <p>${echappe(f.titre)}${f.studio ? " · " + echappe(f.studio) : ""}</p>
      </div></div>
    <div class="soCorps2">
      ${dur
        ? `<div class="soBloc">${CADENAS}<span>Un distributeur ne confie pas sa première
             à un cinéma de moins de ${p.etoiles_min_gala} étoiles. Vous en êtes à
             ${String(p.etoiles).replace(".", ",")}.</span></div>`
        : `<div class="soLg"><span>Popularité du film<small>${f.risque
             ? "peu attendu : une salle vide devant les photographes se voit"
             : "le public l'attend"}</small></span>
             <b class="${f.risque ? "r" : "v"}">${f.popularite}</b></div>
           <button class="soGo" data-gala="${f.sortie_id}">Composer la soirée</button>`}
    </div>
  </div>`;
}

/* ---------- composer le gala ---------- */
function ouvreComposition(f){
  etatPan.choix = f; etatPan.genre = "gala"; etatPan.options = new Set();
  majComposition();
}

async function majComposition(){
  const {p, choix, options} = etatPan;
  const corps = document.getElementById("soCorps");
  const a = await apercuSoiree(choix.sortie_id, "gala", [...options]);
  const d = a.ok ? a.data : null;
  if(!d) return;

  corps.innerHTML = `
    <div class="soCarte">
      <div class="soScene">${sceneGala([...options], d.attendus, d.places, choix.titre)}
        <div class="soVoile"></div>
        <div class="soTxt">
          <div class="kick">Grande première · jour ${d.jour}</div>
          <h3>Soirée de gala</h3>
          <p>${echappe(choix.titre)}</p>
        </div></div>
      <div class="soCorps2">
        ${(p.options || []).map(o => `
          <button class="opt ${options.has(o.cle) ? "on" : ""}" data-opt="${o.cle}">
            <span class="coche">${CHECK}</span>
            <span class="nm"><b>${echappe(o.nom)}</b><small>${echappe(o.detail)}</small></span>
            <span class="px">${eur(o.cout)}</span></button>`).join("")}

        <div class="prep ${d.risque ? "risque" : ""}">
          <div class="h"><span class="lb">Préparation</span><span class="v">${eur(d.cout)}</span></div>
          <div class="jauge"><i style="width:${Math.min(100, d.cout / 3620 * 100).toFixed(0)}%"></i></div>
          <div class="note">${d.note ? echappe(d.note) + " " : ""}Tarif accepté
            <b>${fmt(d.tarif)}</b>, ${d.attendus} spectateurs attendus sur ${d.places}.
            ${d.note_reputation ? "<br>" + echappe(d.note_reputation) : ""}</div>
        </div>

        <div class="soBilan">
          <div><span>Recette</span><b class="v">${eur(d.recette)}</b></div>
          <div><span>Résultat</span><b class="${d.resultat >= 0 ? "v" : "r"}">${
            d.resultat >= 0 ? "+" : "−"}${eur(Math.abs(d.resultat))}</b></div>
          <div><span>Réputation</span><b class="v">+${
            String(d.etoiles_si_plein).replace(".", ",")}</b></div>
        </div>

        <button class="soGo" data-lancer="1">${d.cout > 0
          ? `Organiser la soirée · ${eur(d.cout)}` : "Organiser la soirée"}</button>
        <button class="soRetour">Choisir un autre film</button>
      </div>
    </div>`;

  corps.querySelectorAll("[data-opt]").forEach(b =>
    b.addEventListener("click", () => {
      const c = b.dataset.opt;
      options.has(c) ? options.delete(c) : options.add(c);
      majComposition();
    }));
  corps.querySelector("[data-lancer]").addEventListener("click", () =>
    lance("gala", choix.sortie_id, [...options]));
  corps.querySelector(".soRetour").addEventListener("click", rendPanneau);
}

async function lance(genre, sortieId, options){
  const b = document.querySelector("#soCorps .soGo[data-lancer], #soCorps [data-ap]");
  if(b){ b.disabled = true; b.textContent = "On prépare la salle…"; }
  const r = await organiserSoiree(sortieId, genre, options);
  if(r.erreur){
    if(b){ b.disabled = false; b.textContent = "Réessayer"; }
    etatPan.surFait && etatPan.surFait(messageErreurV2(r), true);
    return;
  }
  etatPan.ferme();
  etatPan.surFait && etatPan.surFait(
    genre === "avant_premiere" ? "Avant-première programmée." : "La soirée est lancée.");
}

export { ouvreSoirees, sceneAvantPremiere, sceneGala };
