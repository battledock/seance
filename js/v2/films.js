/* ============================================================
   LES FILMS

   Une carte par film, qu'on fait défiler. C'est ici que le
   joueur apprend l'industrie : les studios reviennent, les
   réalisateurs signent, les franchises portent leur mémoire.

   Trois notes structurent la lecture — l'attente avant la
   sortie, les critiques la veille, le public le lendemain. Leur
   écart raconte tout.
   ============================================================ */

import { echappe } from "./grille.js?v=becf21cb";
import { afficheDuFilm, MOTIF_FILM } from "../ui/genre-posters.js?v=becf21cb";
import { signerLicence, poserSeance, retirerSeance, messageErreurV2 }
  from "./api.js?v=becf21cb";

const eur = n => Math.round(Number(n) || 0).toLocaleString("fr") + " €";

/* ------------------------------------------------------------
   LES AFFICHES

   Le jeu possède un générateur qui dessine un motif, compose le
   titre et choisit une palette. Il travaille à partir d'une table
   d'identifiants : on lui déclare les nôtres au premier passage.

   Un dégradé de deux couleurs, c'était une case vide. Une vraie
   affiche, c'est ce qu'un joueur reconnaît de loin — et il finit
   par reconnaître aussi le studio qui l'a produite.
   ------------------------------------------------------------ */
function affiche(f, avecTitre){
  if(!f) return "";
  if(f.motif && f.film_id) MOTIF_FILM[f.film_id] = f.motif;
  return afficheDuFilm({
    id: f.film_id || f.sortie_id,
    titre: f.titre,
    /* le générateur ne connaît pas tous nos genres : le serveur
       nous dit lequel utiliser pour la palette */
    genre: f.genre_palette || f.genre
  }, avecTitre);
}

function classeNote(n){
  if(n == null) return "";
  return n >= 75 ? "h" : n >= 55 ? "m" : "b";
}

/* Les conditions du distributeur, dites en français plutôt qu'en
   colonnes de base. C'est ce qui décide vraiment. */
function conditions(f){
  const p = [];
  if(f.places_minimum > 0) p.push(`Salle de ${f.places_minimum} places minimum.`);
  if(f.taux) p.push(`Taux de location ${Math.round(f.taux * 100)} %.`);
  if(f.seances_mini > 0) p.push(`<b>${f.seances_mini} séances par jour.</b>`);
  if(f.duree_licence) p.push(`Licence de ${f.duree_licence} jours.`);
  if(f.classification === "moins16") p.push("Interdit aux moins de 16 ans.");
  if(f.classification === "moins12") p.push("Déconseillé aux moins de 12 ans.");
  return p.length ? p.join(" ") : "Aucune contrainte particulière.";
}

function carteFilm(f, surSigner){
  const aff = f.affiche || ["#4a3a5c","#7a6a9c"];
  const badge = (f.categorie || "").replace("_"," ");
  const evt = f.categorie === "evenement";
  const nouveau = f.statut === "nouveaute";
  const signe = f.statut === "signe";

  return `<article class="carte" data-sortie="${f.sortie_id || ""}">
    <div class="cAffiche">
      <div class="cAffFond">${affiche(f, true)}</div>
      <span class="cBadge ${evt ? "evt" : ""}">${echappe(badge)}</span>
      ${nouveau && f.jours_avant > 0
        ? `<span class="cSortie">dans ${f.jours_avant} jour${f.jours_avant>1?"s":""}</span>`
        : ""}
    </div>
    <div class="cCorps">
      ${f.studio ? `<div class="cSignature">
        <span class="cLogo" style="background:${f.studio_couleur || "#571520"}">${
          echappe((f.studio || "?").split(" ").map(m => m[0]).join("").slice(0,2))}</span>
        <div><b>${echappe(f.studio)}</b>
          <span>${echappe(f.realisateur || f.genre || "")}</span></div>
        ${f.franchise ? `<span class="cFr">${echappe(f.franchise)}</span>` : ""}
      </div>` : ""}

      ${f.synopsis ? `<p class="cSynopsis">${echappe(f.synopsis)}</p>` : ""}

      <div class="cNotes">
        <div class="cN"><b class="att">${f.attente ?? "—"}</b><span>attente</span></div>
        <div class="cN"><b class="${classeNote(f.note_critiques)}">${
          f.note_critiques ?? "—"}</b><span>critiques</span></div>
        <div class="cN"><b class="${classeNote(f.note_public)}">${
          f.note_public ?? "—"}</b><span>public</span></div>
      </div>

      ${!signe && f.jours_avant > 0
        ? `<div class="cCond">Sortie <b>dans ${f.jours_avant} jour${
             f.jours_avant > 1 ? "s" : ""}</b>. ${conditions(f)}
             <br>Réserver maintenant fige le taux ; les copies partent vite.</div>
           <button class="cSigner" data-signer="${f.sortie_id}"
             data-duree="${f.duree_licence || 14}">Réserver la licence</button>`
        : signe
        ? `<div class="cCond">Vous avez la licence encore
             <b>${f.jours_restants} jour${f.jours_restants>1?"s":""}</b>.
             ${f.seances_mini > 0
               ? `Le distributeur exige <b>${f.seances_mini} séances par jour</b>.` : ""}</div>
           <div class="cDejaSigne">Sous licence</div>`
        : `<div class="cCond">${conditions(f)}</div>
           <button class="cSigner" data-signer="${f.sortie_id}"
             data-duree="${f.duree_licence || 14}">Signer la licence</button>`}
    </div>
  </article>`;
}

function rendCatalogue(cible, offre, onglet, surSigner){
  if(!cible) return;
  if(!offre){ cible.innerHTML = ""; return; }

  const listes = {
    nouveautes: offre.nouveautes || [],
    selection:  offre.selection  || [],
    miennes:    offre.mes_licences || []
  };
  const l = listes[onglet] || [];

  if(l.length === 0){
    cible.innerHTML = `<div class="cVide">
      ${onglet === "nouveautes" ? "Aucune sortie ces jours-ci."
        : onglet === "miennes" ? "Vous n'avez aucune licence en cours."
        : "Le distributeur n'a rien d'autre à vous proposer."}</div>`;
    return;
  }

  cible.innerHTML = l.map(f => carteFilm(f)).join("");
  cible.querySelectorAll("[data-signer]").forEach(b =>
    b.addEventListener("click", () => surSigner(b.dataset.signer, Number(b.dataset.duree))));
}

/* ============================================================
   LE PANNEAU DE PROGRAMMATION

   Ce qui s'ouvre quand on touche une case de la grille. Chaque
   film y montre sa prévision pour ce créneau précis — pas une
   moyenne, le chiffre de cette heure-là dans cette salle-là.
   ============================================================ */

function ouvrePanneau({salle, heure, seanceId, offre, surPoser, surRetirer, surFermer}){
  const anciens = document.getElementById("panneauProg");
  if(anciens) anciens.remove();

  const dispo = [
    ...(offre?.mes_licences || []).map(f => ({...f, groupe:"Vous avez la licence"})),
    ...(offre?.nouveautes || []).filter(f => f.jours_avant <= 0)
       .map(f => ({...f, groupe:"À signer aujourd'hui"})),
    ...(offre?.selection || []).map(f => ({...f, groupe:"À signer aujourd'hui"}))
  ];

  const groupes = [];
  for(const f of dispo){
    let g = groupes.find(x => x.nom === f.groupe);
    if(!g){ g = {nom:f.groupe, films:[]}; groupes.push(g); }
    g.films.push(f);
  }

  const o = document.createElement("div");
  o.id = "panneauProg";
  o.className = "voilePanneau";
  o.innerHTML = `
    <div class="feuille">
      <div class="poignee"></div>
      <div class="fTete">
        <div class="fCase"><b>${heure.replace("h00","h")}</b><span>${echappe(salle.nom)}</span></div>
        <div class="fInfo"><b>Quel film ?</b>
          <span>${salle.places} places</span></div>
        <button class="fX" aria-label="Fermer">✕</button>
      </div>
      <div class="fCorps">
        ${groupes.length === 0
          ? `<div class="cVide">Aucun film disponible pour ce créneau.</div>`
          : groupes.map(g => `
            <div class="groupe">${g.nom}</div>
            ${g.films.map(f => {
              const trop = f.places_minimum > salle.places;
              /* la copie n'arrive qu'au jour de la sortie */
              const pasSorti = f.jours_avant > 0;
              return `<button class="choix" data-sortie="${f.sortie_id}"
                        data-signe="${f.statut === "signe" ? 1 : 0}"
                        data-duree="${f.duree_licence || 14}" ${
                          trop || pasSorti ? "disabled" : ""}>
                <span class="chAff">${affiche(f, false)}</span>
                <span class="chInfo"><b>${echappe(f.titre)}</b>
                  <span class="meta">${echappe(f.genre || "")} · ${
                    Math.floor((f.duree||0)/60)}h${String((f.duree||0)%60).padStart(2,"0")}${
                    f.studio ? " · " + echappe(f.studio) : ""}</span>
                  <span class="tags">${etiquettes(f, trop, salle)}</span></span>
                <span class="chPrev">${pasSorti
                  ? `<b class="ind">—</b><span>dans ${f.jours_avant} j</span>`
                  : trop
                  ? `<b class="ind">—</b><span>trop petite</span>`
                  : `<b class="${classeNote(f.note_public ?? f.attente)}">${
                      f.popularite ?? f.attente ?? "—"}</b><span>popularité</span>`}</span>
              </button>`;
            }).join("")}`).join("")}
      </div>
      <div class="fPied">
        ${seanceId
          ? `<button class="fRetirer">Libérer ce créneau</button>`
          : ""}
      </div>
    </div>`;

  document.body.appendChild(o);
  requestAnimationFrame(() => o.classList.add("ouvert"));

  const ferme = () => {
    o.classList.remove("ouvert");
    setTimeout(() => o.remove(), 260);
    surFermer && surFermer();
  };
  o.querySelector(".fX").addEventListener("click", ferme);
  o.addEventListener("click", e => { if(e.target === o) ferme(); });

  o.querySelectorAll(".choix[data-sortie]").forEach(b =>
    b.addEventListener("click", async () => {
      b.disabled = true;
      await surPoser(b.dataset.sortie, b.dataset.signe === "1", Number(b.dataset.duree));
      ferme();
    }));

  const r = o.querySelector(".fRetirer");
  if(r) r.addEventListener("click", async () => {
    r.disabled = true;
    await surRetirer(seanceId);
    ferme();
  });

  return {ferme};
}

function etiquettes(f, trop, salle){
  const t = [];
  if(f.jours_avant > 0) t.push(["r", `Sort dans ${f.jours_avant} jour${
    f.jours_avant > 1 ? "s" : ""}`]);
  if(trop) t.push(["r", `${f.places_minimum} places minimum`]);
  if(f.statut === "signe") t.push(["n", `Licence ${f.jours_restants} j`]);
  if(f.seances_mini > 0) t.push(["r", `${f.seances_mini} séances/jour`]);
  if(f.taux) t.push(["n", `Location ${Math.round(f.taux * 100)} %`]);
  if(f.note_public != null && f.note_public >= 78) t.push(["v","Public conquis"]);
  if(f.note_critiques != null && f.note_critiques >= 85) t.push(["v","Critiques élogieuses"]);
  if(f.verdict === "flop") t.push(["r","A déçu"]);
  return t.slice(0,3).map(x => `<span class="tg ${x[0]}">${x[1]}</span>`).join("");
}

export { rendCatalogue, ouvrePanneau, carteFilm, eur };
