/* ============================================================
   LES ICÔNES DE NAVIGATION

   Le vocabulaire du cinéma plutôt que des pictogrammes
   interchangeables : un marquee à ampoules, une pellicule
   perforée, un fauteuil de salle. Les deux dernières montrent
   une mesure — les séances du jour, la courbe de trésorerie —
   parce que c'est ce que ces écrans contiennent vraiment.

   Toutes dessinées sur la même grille de 24, trait de 1,7,
   bouts ronds. Elles tiennent à 23 pixels comme à 42.
   ============================================================ */

const ICONES_NAV = {

  /* le marquee et ses trois ampoules */
  cinema:
    '<path d="M3.4 9.4h17.2v3.2a1 1 0 0 1-1 1H4.4a1 1 0 0 1-1-1z"/>' +
    '<path d="M5.4 13.6v6.8h13.2v-6.8"/>' +
    '<path d="M12 3.4v6M8.4 5v4.4M15.6 5v4.4"/>' +
    '<circle cx="7" cy="17" r="1.1" fill="currentColor" stroke="none"/>' +
    '<circle cx="12" cy="17" r="1.1" fill="currentColor" stroke="none"/>' +
    '<circle cx="17" cy="17" r="1.1" fill="currentColor" stroke="none"/>',

  /* les séances du jour, en colonnes inégales */
  grille:
    '<rect x="3" y="4.4" width="18" height="15.2" rx="1.5"/>' +
    '<path d="M3 8.6h18"/>' +
    '<path d="M6.4 16.8v-4.4M10.8 16.8v-2.4M15.2 16.8v-5.4"/>' +
    '<path d="M5.2 16.8h15.4" opacity=".5"/>',

  /* la pellicule et ses perforations */
  films:
    '<rect x="2.8" y="5.4" width="18.4" height="13.2" rx="1.6"/>' +
    '<path d="M6.8 5.4v13.2M17.2 5.4v13.2"/>' +
    '<path d="M2.8 9h4M2.8 12h4M2.8 15h4M17.2 9h4M17.2 12h4M17.2 15h4"/>',

  /* un fauteuil de salle, vu de face */
  salles:
    '<path d="M5 20v-3.4M19 20v-3.4"/>' +
    '<path d="M4 16.6h16l-.8-6.4a1.4 1.4 0 0 0-1.4-1.2H6.2a1.4 1.4 0 0 0-1.4 1.2z"/>' +
    '<path d="M8.6 9V6.8a1.6 1.6 0 0 1 1.6-1.6h3.6a1.6 1.6 0 0 1 1.6 1.6V9"/>',

  /* trente jours de dents de scie */
  compte:
    '<path d="M3.6 4v14.4a1.6 1.6 0 0 0 1.6 1.6H21"/>' +
    '<path d="M6.6 15.6l3-4.4 2.6 2.2 2.4-5 4 3.4"/>' +
    '<circle cx="18.6" cy="11.8" r="1.5" fill="currentColor" stroke="none"/>'
};

const LIBELLES_NAV = [
  ["cinema", "Cinéma"],
  ["grille", "Grille"],
  ["films",  "Films"],
  ["salles", "Salles"],
  ["compte", "Compte"]
];

function iconeNav(cle, taille){
  const d = ICONES_NAV[cle];
  if(!d) return "";
  const t = taille || 23;
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"
    style="width:${t}px;height:${t}px">${d}</svg>`;
}

/* Construit la barre entière. Les pastilles d'alerte sont un
   objet {grille:2, films:3} : un chiffre s'affiche, un booléen
   donne un simple point. */
function rendBarreNav(cible, actif, alertes){
  if(!cible) return;
  const a = alertes || {};
  cible.innerHTML = LIBELLES_NAV.map(([cle, lib]) => {
    const v = a[cle];
    const marque = !v ? ""
      : (typeof v === "number"
          ? `<span class="badgeNav">${v > 9 ? "9+" : v}</span>`
          : `<span class="pointNav"></span>`);
    return `<button data-v="${cle}" class="${cle === actif ? "on" : ""}">
      <span class="icNav">${iconeNav(cle)}${marque}</span>${lib}</button>`;
  }).join("");
}

export { ICONES_NAV, LIBELLES_NAV, iconeNav, rendBarreNav };
