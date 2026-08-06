import { rendreFacadePublique } from "../../cinema.js?v=2ab9afab";
import { rendreSallePublique } from "../../data/upgrades.js?v=2ab9afab";
import { salles } from "../../rooms.js?v=2ab9afab";
import { chargeRelation, conteneurSocialActuel, rendActionsSociales } from "../../social.js?v=2ab9afab";
import { rpc } from "../../supabase-client.js?v=2ab9afab";
import { echappe, embleme, texteSur } from "../../ui/emblems.js?v=2ab9afab";
import { rendreHallPublic } from "../../ui/hall.js?v=2ab9afab";
import { icone } from "../../ui/icons.js?v=2ab9afab";

/* ============================================================
   VISITE IMMERSIVE — lecture seule, une seule requête serveur
   ============================================================ */
let visite = null;
let espaceActuel = "facade";
let visiteEnregistree = false;

const ESPACES = [
  {id:"facade",   nom:"Façade",   ic:"batiment"},
  {id:"hall",     nom:"Hall",     ic:"maison"},
  {id:"salles",   nom:"Salles",   ic:"fauteuil"},
  {id:"films",    nom:"Films",    ic:"pellicule"},
  {id:"trophees", nom:"Trophées", ic:"etoile"}
];

async function initVisite(){
  const id = new URLSearchParams(location.search).get("cinema")
          || new URLSearchParams(location.search).get("id");
  if(!id){ messageVisite("Aucun cinéma demandé.", "Reviens à la communauté pour en chercher un."); return; }

  let r;
  try{ r = await rpc("get_cinema_visit_data", {p_public_id: id}); }
  catch(e){ messageVisite("Le réseau a mangé la bobine.", "Réessaie dans un instant."); return; }

  if(!r?.success){
    const M = {
      PROFILE_PRIVATE:["Portes fermées",
        "On dirait que le propriétaire a tiré les rideaux. On reviendra après l'entracte."],
      VISITS_DISABLED:["Visites suspendues",
        "Ce cinéma n'accepte pas encore les visiteurs. Le hall n'est pas prêt."],
      PROFILE_NOT_FOUND:["Adresse inconnue",
        "Il n'y a aucun cinéma à cette adresse. Un lampadaire, un panneau, rien de plus."]
    };
    const [t, m] = M[r?.code] || ["Visite impossible", "Reviens plus tard."];
    messageVisite(t, m);
    return;
  }

  visite = r;
  rendArrivee();

  /* la visite n'est comptée qu'une fois par jour, et jamais pour le propriétaire */
  if(!r.proprietaire && !visiteEnregistree){
    visiteEnregistree = true;
    rpc("record_cinema_visit", {p_public_id: id}).catch(()=>null);
  }
}

/* ---------- écran d'erreur narratif ---------- */
function messageVisite(titre, message){
  document.getElementById("contenuVisite").innerHTML = `
    <section class="carteEcran vitrineFermee">
      <div class="vfIco">${icone("porte","icoVerrou")}</div>
      <h2 style="justify-content:center;border:none" id="vfTitre"></h2>
      <div class="blocBob bilanBob">
        <div class="bobMiniTete grand">${svgBobVisite()}</div>
        <div class="bulle"><b>Bob</b><span id="vfMsg"></span></div>
      </div>
      <a class="btnOr btnRetourJeu" href="communaute.html">Retour à la communauté</a>
    </section>`;
  texteSur(document.getElementById("vfTitre"), titre);
  texteSur(document.getElementById("vfMsg"), message);
}
function svgBobVisite(){
  return `<svg viewBox="30 40 60 60" role="img" aria-label="Bob">
    <circle cx="60" cy="70" r="26" fill="#f0c9a0"/>
    <path d="M40 78 Q50 86 60 79 Q70 86 80 78 Q72 92 60 84 Q48 92 40 78" fill="#4a3527"/>
    <path d="M44 60 Q51 55 57 59 M63 59 Q69 55 76 60" stroke="#4a3527" stroke-width="4" fill="none" stroke-linecap="round"/>
    <circle cx="51" cy="66" r="2.6" fill="#1c1210"/><circle cx="69" cy="66" r="2.6" fill="#1c1210"/>
    <path d="M34 56 Q60 34 86 56 L86 50 Q60 28 34 50 Z" fill="#571520"/>
    <rect x="52" y="44" width="16" height="7" rx="2" fill="#e8b84b"/></svg>`;
}

/* ============================================================
   ARRIVÉE DEVANT LA FAÇADE
   ============================================================ */
function rendArrivee(){
  const p = visite.profile;
  document.getElementById("contenuVisite").innerHTML = `
    ${visite.proprietaire ? `
      <div class="bandeauApercu">
        ${icone("etoile")}
        <span><b>Aperçu visiteur</b><br>Voici ce que les autres joueurs voient.</span>
        <a class="btnApercu" href="profil.html">Modifier la visibilité</a>
      </div>` : ""}

    <div class="facadeVisite" id="facadeVisite"></div>

    <section class="carteEcran carteArrivee">
      <div class="apercuProfil">
        <div class="apEmbleme">${embleme(p.embleme, 54)}</div>
        <div class="apTexte">
          <div class="apCine"><span class="apLogo"></span><b id="vNom"></b></div>
          <div class="apPar">Cinéma de <b id="vPseudo"></b></div>
          <div class="apNiveau">Niveau ${Number(p.niveau)||1} · <i id="vTitre"></i></div>
        </div>
      </div>
      <div class="metaVitrine">
        <span>${icone("etoile")} Réputation ${Number(p.reputation)||0}</span>
        <span>${icone("fauteuil")} ${Number(p.nbSalles)||1} salle${(Number(p.nbSalles)||1)>1?"s":""}</span>
        ${p.activite ? `<span>${icone("horloge")} Actif ${echappe(p.activite)}</span>` : ""}
        ${p.visiteurs != null ? `<span>${icone("spectateurs")} ${p.visiteurs} visiteur${p.visiteurs>1?"s":""} cette semaine</span>` : ""}
      </div>
      <div class="apDevise" id="vDevise"></div>
      <button class="btnOr btnEntrer" id="btnEntrer">${icone("porte")} Entrer dans le cinéma</button>
    </section>`;

  texteSur(document.getElementById("vNom"), p.nomCinema);
  texteSur(document.getElementById("vPseudo"), p.pseudo || "—");
  texteSur(document.getElementById("vTitre"), p.titreChoisi || p.titreNiveau || "");
  texteSur(document.getElementById("vDevise"), p.devise ? "« " + p.devise + " »" : "");
  document.querySelector(".apLogo").textContent = p.logo || "";

  rendreFacadePublique("facadeVisite", {
    nomCinema:p.nomCinema, logo:p.logo, quartier:p.quartier, nbSalles:p.nbSalles,
    styleFacade:visite.facade.styleFacade, styleEnseigne:visite.facade.styleEnseigne,
    plaque:visite.facade.plaque, exterieur:visite.facade.exterieur,
    films: visite.currentMovies || []
  });
  document.getElementById("btnEntrer").onclick = entreDansLeCinema;
}

/* ---------- transition d'entrée ---------- */
function entreDansLeCinema(){
  const reduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if(reduit){ ouvreEspaces("hall"); return; }
  const o = document.createElement("div");
  o.className = "voileEntree";
  o.innerHTML = `<div class="veTexte">Les portes s'ouvrent…</div>`;
  document.body.appendChild(o);
  setTimeout(()=>{ ouvreEspaces("hall"); }, 420);
  setTimeout(()=>{ o.classList.add("sortie"); setTimeout(()=>o.remove(), 320); }, 620);
}

/* ============================================================
   ESPACES DE LA VISITE
   ============================================================ */
function ouvreEspaces(espace){
  espaceActuel = espace || "hall";
  document.getElementById("contenuVisite").innerHTML = `
    ${visite.proprietaire ? `
      <div class="bandeauApercu compact">${icone("etoile")}
        <span><b>Aperçu visiteur</b></span>
        <a class="btnApercu" href="profil.html">Visibilité</a></div>` : ""}
    <div class="enteteVisite">
      <div class="evNom"><span class="apLogo"></span><b id="evNom"></b></div>
      <div class="evPar" id="evPar"></div>
    </div>
    <nav class="ongletsVisite" id="ongletsVisite" role="tablist"></nav>
    <div id="espaceVisite"></div>`;
  texteSur(document.getElementById("evNom"), visite.profile.nomCinema);
  texteSur(document.getElementById("evPar"), "Cinéma de " + (visite.profile.pseudo || "—"));
  document.querySelector(".apLogo").textContent = visite.profile.logo || "";
  rendOngletsVisite();
  rendEspace();
}

function rendOngletsVisite(){
  const s = visite.visitSettings || {};
  const dispo = {hall: s.montreHall !== false, salles: s.montreSalles !== false,
                 films: s.montreFilms !== false, trophees: s.montreTrophees !== false,
                 facade: true};
  document.getElementById("ongletsVisite").innerHTML = ESPACES.map(e=>`
    <button class="ongletVisite ${e.id===espaceActuel?'actif':''} ${dispo[e.id]?'':'ferme'}"
      role="tab" aria-selected="${e.id===espaceActuel}"
      onclick="changeEspace('${e.id}')">${icone(e.ic)}<span>${e.nom}</span></button>`).join("");
}
function changeEspace(id){
  espaceActuel = id;
  rendOngletsVisite();
  rendEspace();
  window.scrollTo({top:0, behavior:"smooth"});
}

function rendEspace(){
  const el = document.getElementById("espaceVisite");
  const s = visite.visitSettings || {};
  if(espaceActuel === "facade"){
    el.innerHTML = `<div class="facadeVisite" id="facadeEspace"></div>
      <button class="btnOr btnEntrer" onclick="changeEspace('hall')">${icone("porte")} Entrer dans le hall</button>`;
    const p = visite.profile;
    rendreFacadePublique("facadeEspace", {
      nomCinema:p.nomCinema, logo:p.logo, quartier:p.quartier, nbSalles:p.nbSalles,
      styleFacade:visite.facade.styleFacade, styleEnseigne:visite.facade.styleEnseigne,
      plaque:visite.facade.plaque, exterieur:visite.facade.exterieur,
      films: visite.currentMovies || []});
    return;
  }
  if(espaceActuel === "hall")     return rendEspaceHall(el, s);
  if(espaceActuel === "salles")   return rendEspaceSalles(el, s);
  if(espaceActuel === "films")    return rendEspaceFilms(el, s);
  if(espaceActuel === "trophees") return rendEspaceTrophees(el, s);
}

function espaceFerme(el, titre, texte){
  el.innerHTML = `<section class="carteEcran espaceFerme">
    <div class="vfIco">${icone("porte","icoVerrou")}</div>
    <h2 style="justify-content:center;border:none">${titre}</h2>
    <div class="vide">${texte}</div></section>`;
}

/* ---------- hall ---------- */
function rendEspaceHall(el, s){
  if(s.montreHall === false)
    return espaceFerme(el, "Hall fermé", "Le propriétaire préfère garder son hall pour lui.");
  const h = visite.hall;
  el.innerHTML = `
    <div class="hallBoite">${rendreHallPublic(h)}</div>
    <section class="carteEcran">
      <h2>Dans le hall</h2>
      <div id="descHall"></div>
    </section>`;
  const lignes = [];
  const z = (h && h.zones) || {};
  const NOMS = {
    cadres:"Des cadres anciens couvrent le mur principal.",
    affiches:"De vieilles affiches sont accrochées au mur.",
    fresque:"Une fresque peinte occupe tout le mur du fond.",
    plante:"Une grande plante veille dans un coin.",
    fauteuil:"Un fauteuil d'attente est posé près de l'entrée.",
    vitrine:"Une vitrine expose quelques souvenirs.",
    horloge:"Une horloge murale rythme l'attente.",
    tapis:"Un tapis rouge mène vers les salles.",
    damier:"Le sol en damier claque sous les pas.",
    parquet:"Le parquet d'origine grince un peu."
  };
  Object.values(z).forEach(v=>{ if(NOMS[v]) lignes.push(NOMS[v]); });
  if(h && h.confiserie) lignes.push("Une odeur de popcorn flotte dans le hall.");
  if(h && h.plaque) lignes.push("Une plaque dorée rappelle que ce cinéma est reconnu du quartier.");
  if(lignes.length === 0) lignes.push("Le hall est sobre. Quelques pas résonnent, c'est tout.");
  document.getElementById("descHall").innerHTML = lignes.map(t=>
    `<div class="ligneRecit">${icone("etoile")}<span>${echappe(t)}</span></div>`).join("");
}

/* ---------- salles ---------- */
function rendEspaceSalles(el, s){
  if(s.montreSalles === false)
    return espaceFerme(el, "Salles fermées", "Le propriétaire ne montre pas ses salles pour l'instant.");
  const salles = visite.rooms || [];
  if(salles.length === 0)
    return espaceFerme(el, "Aucune salle visible", "Il n'y a rien à voir de ce côté-là.");
  el.innerHTML = salles.map(r=>rendreSallePublique({room:r})).join("");
}

/* ---------- films ---------- */
function rendEspaceFilms(el, s){
  if(s.montreFilms === false)
    return espaceFerme(el, "Programme privé", "Le propriétaire garde sa programmation secrète.");
  const films = visite.currentMovies || [];
  if(films.length === 0)
    return espaceFerme(el, "Écran éteint", "Ce cinéma prépare actuellement sa prochaine séance.");
  el.innerHTML = `<section class="carteEcran"><h2>À l'affiche</h2>
    ${films.map(f=>`
      <div class="ficheFilm">
        <div class="ffAffiche" style="background:${couleurGenreVisite(f.genre)}">
          <span class="ffAffTitre">${echappe(f.titre)}</span>
          <span class="ffAffGenre">${echappe(f.genre)}</span>
        </div>
        <div class="ffCorps">
          <div class="ffTitre">${echappe(f.titre)}</div>
          <div class="ffMeta"><span>${icone("pellicule")} ${echappe(f.genre)}</span>
            <span>${icone("horloge")} ${Number(f.duree)||0} min</span></div>
          <div class="ffMeta"><span>${f.en_cours
            ? icone("etoile") + " Projection en cours"
            : icone("horloge") + " Prochaine séance : " + echappe(f.heure)}</span></div>
          <div class="ffMeta"><span>${icone("fauteuil")} ${echappe(f.salle || "Salle 1")}</span></div>
        </div>
      </div>`).join("")}
    <div class="notePied">Trois prochaines séances au maximum.</div>
  </section>`;
}
function couleurGenreVisite(g){
  const C = {"Drame":"#1f3a5c","Aventure":"#1d5c52","Animation":"#4a3f8c","Documentaire":"#2a6b6b",
    "Thriller familial":"#3a2a52","Comédie":"#c07a1f","Romance":"#a83a5c","Film noir":"#22262e",
    "Western":"#8c5a2a","Musical":"#b53a4a","Fantastique":"#3a2a6b","Culte":"#1f5c3a"};
  return C[g] || "#7c1c2e";
}

/* ---------- trophées et statistiques ---------- */
function rendEspaceTrophees(el, s){
  const t = visite.achievements || [];
  const st = visite.stats || {};
  const col = visite.collection;
  el.innerHTML = `
    <section class="carteEcran">
      <h2>Le cinéma en chiffres</h2>
      <div class="grilleStats">
        <div><b>${Number(st.journeesTerminees)||0}</b><span>Journées terminées</span></div>
        <div><b>${(Number(st.totalSpectateurs)||0).toLocaleString("fr-FR")}</b><span>Spectateurs accueillis</span></div>
        <div><b>${Number(st.meilleureJournee)||0}</b><span>Record sur une journée</span></div>
        <div><b>${Number(st.totalSeances)||0}</b><span>Séances projetées</span></div>
      </div>
    </section>
    ${s.montreTrophees === false ? "" : `<section class="carteEcran">
      <h2>Trophées</h2>
      ${t.length ? t.map(x=>`<div class="ligneRecit">${icone(x.icone||"etoile")}
        <span><b>${echappe(x.nom)}</b><br><small>${echappe(x.description)}</small></span></div>`).join("")
        : `<div class="vide">Aucun trophée exposé.</div>`}
    </section>`}
    ${col ? `<section class="carteEcran">
      <h2>Collection</h2>
      <div class="grilleStats">
        <div><b>${Number(col.trophees)||0}</b><span>Trophées</span></div>
        <div><b>${Number(col.personnalisations)||0}</b><span>Personnalisations</span></div>
        <div><b>${Number(col.filmsProduits)||0}</b><span>Films produits</span></div>
        <div><b>${Number(col.niveauxAtteints)||1}</b><span>Niveau atteint</span></div>
      </div>
    </section>` : ""}
    <section class="carteEcran">
      <h2>Livre d'or</h2>
      <div id="zoneSociale"></div>
    </section>
    <div class="piedVitrine">Cinéma ouvert depuis le ${echappe(visite.profile.arriveLe || "—")}</div>`;

  if(!visite.proprietaire){
    conteneurSocialActuel = "zoneSociale";
    chargeRelation(visite.profile.publicId)
      .then(()=>rendActionsSociales("zoneSociale", visite.profile.publicId,
        {titre:"Tu as aimé la visite ?"}));
  }else{
    document.getElementById("zoneSociale").innerHTML =
      `<div class="vide">Les visiteurs pourront réagir ici.</div>`;
  }
}

/* ---- exports ---- */
export {
  ESPACES,
  changeEspace,
  couleurGenreVisite,
  entreDansLeCinema,
  espaceActuel,
  espaceFerme,
  initVisite,
  messageVisite,
  ouvreEspaces,
  rendArrivee,
  rendEspace,
  rendEspaceFilms,
  rendEspaceHall,
  rendEspaceSalles,
  rendEspaceTrophees,
  rendOngletsVisite,
  svgBobVisite,
  visite,
  visiteEnregistree
};

/* ---- gestionnaires en attribut ---- */
/* Ces fonctions sont appelées depuis des attributs onclick écrits
   dans le HTML généré. Un module ES n'expose rien globalement :
   on les rend accessibles explicitement. */
Object.assign(window, {
  changeEspace
});
