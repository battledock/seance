/* Programmation : mur d'affiches et grille des séances. */

import {
  CATALOGUE_FILMS,
  NETTOYAGE_MIN,
  compareHeures,
  filmDebloque,
  filmParId,
  fmtDuree,
  fmtDureeHeures,
  heureEnMinutes,
  horairesDisponibles,
  minutesEnHeure,
  obtenirLimiteSeances
} from "./data/films.js?v=becf21cb";
import { niveauEquipement } from "./data/upgrades.js?v=becf21cb";
import { chargeJournee, ouvreCinema, statutJournee } from "./engine/day.js?v=becf21cb";
import { Etat, fmtArgent } from "./game-state.js?v=becf21cb";
import { bobCompact } from "./navigation.js?v=becf21cb";
import { accomplitMission, debloque } from "./progression.js?v=becf21cb";
import { toastSocial } from "./social.js?v=becf21cb";
import { appelSecurise, messageErreur, rpc, sbFetch } from "./supabase-client.js?v=becf21cb";
import { echappe, texteSur } from "./ui/emblems.js?v=becf21cb";
import { afficheDuFilm } from "./ui/genre-posters.js?v=becf21cb";
import { icone } from "./ui/icons.js?v=becf21cb";

/* ============================================================
   PROGRAMMATION DES SÉANCES
   Statuts : draft → validated → running → completed
   (running / completed seront utilisés par la simulation de journée)
   ============================================================ */
const PRIX_MIN = 4, PRIX_MAX = 20, PRIX_DEFAUT = 8;

let seancesJour = [];      /* séances du jour courant */
let sallesDispo  = [];     /* salles du cinéma */
let brouillon    = null;   /* séance en cours d'édition */

/* ---------- initialisation ---------- */
let vueProg = "affiche";
let evenementsProg = [];
let evenementsProgLe = 0;   /* quand la liste a été relue */

/* ------------------------------------------------------------
   LE CHARGEMENT DE LA PAGE

   Sept appels s'enchaînaient, chacun attendant la fin du
   précédent : sur un téléphone, cela faisait sept allers-retours
   bout à bout. La plupart ne dépendent pas les uns des autres et
   peuvent partir ensemble.

   Seul chargeSeances doit venir après chargeSallesProg : il relit
   les prévisions, qui ont besoin des salles pour être affichées.
   ------------------------------------------------------------ */
async function initProgrammation(){
  await Promise.all([
    chargeCatalogue(),
    chargeMatin(),
    chargeJournee(),
    chargeSallesProg(),
    chargeFilmsMaison()
  ]);
  /* les séances relisent les prévisions au passage */
  await chargeSeances();
  brancheSegments();
  installeFleches();
  rendVue();
}

/* les trois onglets du haut */
function brancheSegments(){
  document.querySelectorAll("#segments button").forEach(b=>{
    b.addEventListener("click", ()=>{
      if(vueProg === b.dataset.vue) return;
      document.querySelectorAll("#segments button").forEach(x=>{
        x.classList.remove("on"); x.setAttribute("aria-selected","false");
      });
      b.classList.add("on"); b.setAttribute("aria-selected","true");
      vueProg = b.dataset.vue;
      rendVue();
      majFleches();
      const piste = document.getElementById("pisteAffiches");
      if(piste) piste.scrollTo({left:0, behavior:"smooth"});
    });
  });
}

/* ---------- les flèches du carrousel ---------- */
function installeFleches(){
  const p = document.getElementById("pisteAffiches");
  const g = document.getElementById("flecheG"), d = document.getElementById("flecheD");
  if(!p || !g || !d) return;
  const pas = () => Math.max(140, Math.round(p.clientWidth * .8));
  g.onclick = () => p.scrollBy({left: -pas(), behavior:"smooth"});
  d.onclick = () => p.scrollBy({left:  pas(), behavior:"smooth"});
  p.addEventListener("scroll", majFleches, {passive:true});
  window.addEventListener("resize", majFleches);
  majFleches();
}

/* elles s'éteignent quand il n'y a rien à faire défiler */
function majFleches(){
  const p = document.getElementById("pisteAffiches");
  const g = document.getElementById("flecheG"), d = document.getElementById("flecheD");
  if(!p || !g || !d) return;
  const debord = p.scrollWidth > p.clientWidth + 4;
  g.classList.toggle("eteinte", !debord || p.scrollLeft < 6);
  d.classList.toggle("eteinte", !debord || p.scrollLeft > p.scrollWidth - p.clientWidth - 6);
}

const SOUS_TITRES = {
  affiche:"À l'affiche aujourd'hui",
  catalogue:"Au catalogue cette semaine",
  evenements:"Ce qui se passe dans le quartier"
};
const PLAQUES = {affiche:"Aujourd'hui", catalogue:"Au catalogue", evenements:"Le quartier"};

/* rendu complet d'une vue : fronton, carrousel, tableau, Bob */
/* les prévisions changent à chaque retouche : on les relit avant de peindre */
async function rafraichitPrevisions(){
  await chargePrevisions();
  await rendVue();
}

async function rendVue(){
  const st = document.getElementById("sousTitre");
  if(st) texteSur(st, SOUS_TITRES[vueProg]);
  const pl = document.getElementById("plaqueJour");
  if(pl) texteSur(pl, PLAQUES[vueProg]);
  const bj = document.getElementById("badgeJourTxt");
  if(bj) bj.textContent = "Jour " + (Etat.cinema?.jour || 1);

  /* le carrousel d'affiches ne sert qu'aux deux autres vues */
  const carr = document.getElementById("carrousel");
  if(carr) carr.classList.toggle("masque", vueProg === "affiche");

  if(vueProg === "affiche"){ rendVueAffiche(); }
  else if(vueProg === "catalogue"){ rendVueCatalogue(); }
  else{ await rendVueEvenements(); }

  bulleConseil(conseilDeLaVue());
}

function conseilDeLaVue(){
  if(vueProg === "catalogue"){
    const dispo = catalogueComplet().filter(f=>filmDebloque(f)).length;
    return dispo > 0
      ? `${dispo} films sont à ta portée. Regarde la popularité avant le prix : un film cher qui remplit vaut mieux qu'un film gratuit qui vide la salle.`
      : "Le catalogue s'étoffera avec les niveaux. Pour l'instant, on fait avec ce qu'on a.";
  }
  if(vueProg === "evenements"){
    const actifs = evenementsProg.filter(e=>e.actif).length;
    return actifs > 0
      ? "Un événement est en cours dans le quartier. C'est le moment de remplir les salles."
      : "Rien en ce moment dans le quartier. Ça ne saurait tarder, il y a toujours quelque chose.";
  }
  return conseilProg();
}

async function chargeSallesProg(){
  const d = await sbFetch(`salles?cinema_id=eq.${Etat.cinema.id}&select=*&order=cree_le`);
  sallesDispo = Array.isArray(d) ? d : [];
  Etat.salles = sallesDispo;
}

/* Toute retouche passe par ici. On en profite pour relire les
   prévisions : le joueur baisse un prix et voit la fourchette bouger. */
async function chargeSeances(){
  const c = Etat.cinema;
  const d = await sbFetch(`seances?cinema_id=eq.${c.id}&jour=eq.${c.jour}&select=*`);
  seancesJour = Array.isArray(d) ? d : [];
  trieSeances();
  Etat.seancesJour = seancesJour;
  try{ await chargePrevisions(); }catch(e){}
}
function trieSeances(){ seancesJour.sort((a,b)=>compareHeures(a.heure,b.heure)); }

/* films produits au studio : injectés au catalogue, licence gratuite */
/* Films produits par le joueur : le serveur donne l'identifiant officiel,
   la popularité et la durée. Aucun coût de licence. */
async function chargeFilmsMaison(){
  const c = Etat.cinema;
  let maison = [];
  try{
    const r = await rpc("get_my_available_productions", {p_cinema_id: c.id});
    maison = r?.entries || [];
  }catch(e){ maison = []; }
  Etat.filmsMaisonCat = maison.map(f=>({
    id: f.filmId, titre: f.titre, genre: f.genre, duree: Number(f.duree) || 20,
    popularite: Number(f.popularite) || 40, qualite: Number(f.qualite) || 50,
    coutLicence: 0, niveauRequis: 1, publicCible:["adultes","cinephiles"],
    couleurAffiche:"#8a6c2a", maison:true, affiche: f.affiche,
    resume:"Une production maison, tournée ici même. Aucune licence à payer."
  }));
}
/* ------------------------------------------------------------
   LE CATALOGUE DU JOUR
   Il ne vient plus d'une liste figée : le serveur rend l'état de
   chaque film à cette date — nouveauté, semaine d'exploitation,
   reprise — avec la popularité et la licence du moment.
   ------------------------------------------------------------ */
let catalogueServeur = null;
let previsionsJour = null;      /* ce que le serveur attend, séance par séance */
let prepDuJour = null;          /* le matin : dossier, alertes, mémoire */

async function chargePrevisions(){
  const appel = await appelSecurise(
    () => rpc("get_day_forecast", {p_cinema_id: Etat.cinema.id}),
    {rechargeApresErreur: false});
  previsionsJour = (appel.ok && appel.data && appel.data.success) ? appel.data.data : null;
}

/* le matin a déjà tout calculé : on le relit pour le résumé */
async function chargeMatin(){
  const appel = await appelSecurise(
    () => rpc("preparer_journee", {p_cinema_id: Etat.cinema.id}),
    {rechargeApresErreur: false});
  prepDuJour = (appel.ok && appel.data && appel.data.success) ? appel.data.data : null;
}

function previsionDe(seanceId){
  if(!previsionsJour) return null;
  return (previsionsJour.seances || []).find(p =>
    String(p.seance_id) === String(seanceId)) || null;
}

function classeTendance(t){
  if(t === "excellente" || t === "bonne") return "haut";
  if(t === "correcte") return "moyen";
  return "bas";
}


async function chargeCatalogue(){
  const appel = await appelSecurise(
    () => rpc("get_catalogue", {p_cinema_id: Etat.cinema.id}),
    {rechargeApresErreur: false});
  catalogueServeur = (appel.ok && appel.data && appel.data.success) ? appel.data.data : null;

  /* on le partage : l'accueil, le bilan et la simulation cherchent
     des films par identifiant sans passer par cette page */
  Etat.catalogueJour = catalogueServeur
    ? [].concat(catalogueServeur.nouveautes || [], catalogueServeur.a_l_affiche || [],
                catalogueServeur.reprises || []).map(filmDepuisServeur)
    : null;
}

/* on ramène la forme du serveur à celle qu'attend le reste de la page */
function filmDepuisServeur(e){
  const base = CATALOGUE_FILMS.find(f => String(f.id) === String(e.film_id)) || {};
  return {
    ...base,
    id: e.film_id, titre: e.titre, genre: e.genre,
    duree: Number(e.duree) || base.duree || 100,
    popularite: Number(e.popularite),
    populariteBase: Number(e.popularite_base),
    qualite: Number(e.qualite),
    coutLicence: Number(e.cout_licence),
    licenceBase: Number(e.licence_base),
    niveauRequis: Number(e.niveau_requis) || 1,
    publicCible: e.public_cible || base.publicCible || ["adultes"],
    statutSortie: e.statut,
    semaineExploitation: e.semaine_exploitation,
    exceptionnel: !!e.exceptionnel,
    tendance: e.tendance
  };
}

function catalogueComplet(){
  if(!catalogueServeur) return [...(Etat.filmsMaisonCat||[]), ...CATALOGUE_FILMS];
  const films = []
    .concat(catalogueServeur.nouveautes || [])
    .concat(catalogueServeur.a_l_affiche || [])
    .concat(catalogueServeur.reprises || [])
    .map(filmDepuisServeur);
  return [...(Etat.filmsMaisonCat||[]), ...films];
}

/* le mot qui décrit où en est un film */
function mentionSortie(f){
  if(f.maison) return {texte:"Production maison", classe:"maison"};
  switch(f.statutSortie){
    case "nouveaute": return f.exceptionnel
      ? {texte:"Événement · cette semaine", classe:"evenement"}
      : {texte:"Nouveauté de la semaine", classe:"nouveaute"};
    case "affiche": return {texte:f.semaineExploitation + "e semaine · en baisse", classe:"affiche"};
    case "fin_affiche": return {texte:"Dernière semaine", classe:"fin"};
    case "reprise": return {texte:"Reprise · licence réduite", classe:"reprise"};
    default: return null;
  }
}

/* ---------- règles métier ---------- */
function coutLicence(f){ return Math.round((f.coutLicence||0) * (debloque("partenariat") ? .8 : 1)); }
function limiteSeances(){ return obtenirLimiteSeances(Etat.cinema, sallesDispo); }
/* Le programme se retouche tant que les portes sont fermées. Le seul
   verrou est l'ouverture — c'est elle qui fige les séances. */
function journeeLancee(){ return ["running","completed"].includes(statutJournee()); }

/* intervalle occupé par une séance : début → fin + nettoyage */
function intervalle(s){
  const deb = heureEnMinutes(s.heure);
  const fin = deb + (s.duree_min||0);
  return {deb, fin, libre: fin + (s.nettoyage_min ?? NETTOYAGE_MIN)};
}
/* renvoie la séance en conflit, ou null */
function chercheConflit({salle_id, heure, duree, ignorerId}){
  const deb = heureEnMinutes(heure);
  const libreNouveau = deb + duree + NETTOYAGE_MIN;
  for(const s of seancesJour){
    if(String(s.salle_id) !== String(salle_id)) continue;
    if(ignorerId && String(s.id) === String(ignorerId)) continue;
    const i = intervalle(s);
    if(deb < i.libre && i.deb < libreNouveau) return s;
  }
  return null;
}

/* ------------------------------------------------------------
   ESTIMATION LOCALE D'AUDIENCE — un simple repère

   Le chiffre qui fait foi vient du serveur (previsionDe). Cette
   estimation n'est qu'un repère affiché tant que la prévision
   serveur n'est pas encore chargée, ou pour le total indicatif.
   Elle ne distribue aucun argent et ne décide de rien.

   (L'ancien code multipliait par Etat.cinema.mult_frequentation,
   une colonne qui n'existe pas : le facteur valait donc toujours 1
   et masquait un bug silencieux. On l'a retiré.)
   ------------------------------------------------------------ */
function estimeAudience(s){
  const f = filmParId(s.film_id); if(!f) return 0;
  const salle = sallesDispo.find(x=>String(x.id)===String(s.salle_id)) || {capacite:80, confort:1};
  const heure = heureEnMinutes(s.heure);
  let bonusHeure = 0.55;
  if(heure >= 17*60 && heure <= 21*60+30) bonusHeure = 1;
  else if(heure >= 13*60 && heure < 17*60) bonusHeure = .78;
  else if(heure > 21*60+30) bonusHeure = .68;
  const elast = Math.max(.35, Math.min(1.25, 1.35 - (s.prix||PRIX_DEFAUT)/16));
  const base = (f.popularite/100) * salle.capacite * bonusHeure * elast;
  return Math.max(0, Math.round(base));
}

/* ---------- Bob ---------- */
function bulleConseil(t){
  const nouvelle = document.getElementById("bulleProg");
  if(nouvelle){ texteSur(nouvelle, t); return; }
  const z = document.getElementById("zoneBob");
  z.innerHTML = ""; z.appendChild(bobCompact(t));
}
function conseilProg(){
  if(journeeLancee()) return "Les portes sont ouvertes, on ne change plus rien. Le bilan arrive.";
  if(sallesDispo.length === 0) return "Pas encore de salle ? Passe par l'onglet Salles, je t'attends ici.";
  /* Bob parlait encore de valider et de retourner à l'accueil — deux
     gestes qui n'existent plus. On ouvre depuis cette page. */
  if(seancesJour.length === 0) return "Le marquee est vide. Commence par la séance de 20h30 : c'est là que le quartier sort.";
  const licences = seancesJour.reduce((t,x)=>t + Number(x.cout_licence||0), 0);
  if(Number(Etat.cinema.argent) < licences)
    return "Il manque de quoi payer les licences. Retire une séance, ou baisse tes ambitions.";
  if(seancesJour.length >= limiteSeances())
    return "Journée complète. Quand tu veux, on ouvre les portes.";
  return "Bon début. Tu peux encore ajouter une séance, ou ouvrir comme ça.";
}



function refuseFilm(id){
  const f = catalogueComplet().find(x=>String(x.id)===String(id));
  if(!f) return;
  toastSocial("Ce film se débloque au niveau " + (f.niveauRequis || "?") + ".");
}

/* ---------- l'affiche s'agrandit avant d'être punaisée ---------- */
function agranditAffiche(id){
  const f = catalogueComplet().find(x=>String(x.id)===String(id));
  if(!f) return;
  const o = document.createElement("div");
  o.className = "voileAffiche"; o.id = "voileAffiche";
  o.innerHTML = `
    <div class="afficheGrande">
      <button class="agFermer" onclick="fermeAffiche()" aria-label="Fermer">✕</button>
      <div class="agPapier">
        ${afficheDuFilm(f, true)}
      </div>
      <div class="agInfos">
        <div class="agResume" id="agResume"></div>
        <div class="agLignes">
          <span>${icone("horloge")} ${f.duree} min</span>
          <span>${icone("spectateurs")} popularité ${f.popularite}</span>
          <span>${icone("piece")} ${f.coutLicence ? fmtArgent(coutLicence(f)) : "aucune licence"}</span>
        </div>
      </div>
      <button class="btnRouge agPunaiser" onclick="fermeAffiche(); ouvrePanneau('${f.id}')">
        Punaiser au programme</button>
    </div>`;
  document.body.appendChild(o);
  /* le titre est imprimé sur l'affiche elle-même : plus d'étiquette par-dessus */
  texteSur(document.getElementById("agResume"), f.resume || "");
}
function fermeAffiche(){
  const o = document.getElementById("voileAffiche");
  if(o){ o.classList.add("sortie"); setTimeout(()=>o.remove(), 260); }
}



/* ============================================================
   PANNEAU DE CRÉATION / MODIFICATION D'UNE SÉANCE
   ============================================================ */
function ouvrePanneau(filmId, seanceId){
  const f = filmParId(filmId);
  if(!f || !filmDebloque(f)) return;
  if(sallesDispo.length === 0){ bulleConseil("Il faut au moins une salle. Onglet Salles, deux minutes."); return; }
  if(!seanceId && seancesJour.length >= limiteSeances()){
    bulleConseil(`Limite atteinte : ${limiteSeances()} séances par jour avec ${sallesDispo.length} salle(s). Supprime-en une, ou agrandis le cinéma.`);
    return;
  }
  const dejaVue = seanceId ? seancesJour.find(s=>String(s.id)===String(seanceId)) : null;
  brouillon = {
    id: seanceId || null,
    film_id: filmId,
    salle_id: dejaVue ? dejaVue.salle_id : sallesDispo[0].id,
    heure: dejaVue ? dejaVue.heure : premierHoraireLibre(sallesDispo[0].id, f.duree),
    prix: dejaVue ? Number(dejaVue.prix) : PRIX_DEFAUT
  };
  afficherPanneau();
}

function premierHoraireLibre(salleId, duree){
  const h = horairesDisponibles().find(x=>!chercheConflit({salle_id:salleId, heure:x, duree}));
  return h || horairesDisponibles()[0];
}

function afficherPanneau(){
  const f = filmParId(brouillon.film_id);
  const anciens = document.getElementById("voilePanneau");
  if(anciens) anciens.remove();

  const o = document.createElement("div");
  o.className = "voilePanneau";
  o.id = "voilePanneau";
  o.innerHTML = `
    <div class="panneauSeance">
      <div class="pnEntete" style="background:${f.couleurAffiche}">
        <span class="pnTitre">${f.titre}</span>
        <span class="pnSous">${f.genre} · ${fmtDuree(f.duree)} · licence ${f.maison?"offerte":fmtArgent(coutLicence(f))}</span>
        <button class="pnFermer" onclick="fermePanneau()" aria-label="Fermer">✕</button>
      </div>
      <div class="pnCorps">
        <label class="lblProg">La salle</label>
        <div class="choixSalles" id="choixSalles"></div>

        <label class="lblProg">L'horaire</label>
        <div class="choixHoraires" id="choixHoraires"></div>

        <label class="lblProg">Le prix du billet</label>
        <div class="reglagePrix">
          <button class="btnPrix" onclick="changePrix(-1)">−</button>
          <span class="prixVal" id="prixVal">${brouillon.prix} €</span>
          <button class="btnPrix" onclick="changePrix(1)">+</button>
        </div>
        <input type="range" class="curseurPrix" id="curseurPrix"
          min="${PRIX_MIN}" max="${PRIX_MAX}" step="1" value="${brouillon.prix}"
          oninput="changePrixDirect(this.value)">

        <div class="pnRecap" id="pnRecap"></div>
        <div class="pnBob" id="pnBob"></div>
        <button class="btnRouge btnAjouter" id="btnAjouter" onclick="valideSeance()"></button>
      </div>
    </div>`;
  document.body.appendChild(o);
  rendChoixSalles(); rendChoixHoraires(); majPanneau();
}
function fermePanneau(){
  const o = document.getElementById("voilePanneau");
  if(o){ o.classList.add("sortie"); setTimeout(()=>o.remove(), 260); }
  brouillon = null;
}

function rendChoixSalles(){
  const f = filmParId(brouillon.film_id);
  document.getElementById("choixSalles").innerHTML = sallesDispo.map(s=>{
    const conflit = chercheConflit({salle_id:s.id, heure:brouillon.heure, duree:f.duree, ignorerId:brouillon.id});
    const travaux = s.travaux_fin && new Date(s.travaux_fin).getTime() > Date.now();
    const sel = String(s.id)===String(brouillon.salle_id);
    return `<button class="carteSalleChoix ${sel?'sel':''} ${travaux?'enTravaux':''}" onclick="choisitSalle('${s.id}')">
      <span class="csNom">${s.nom}</span>
      <span class="csMeta">${icone("fauteuil")} ${s.capacite} places · confort ${niveauEquipement(s,"sieges")}/3 · écran ${niveauEquipement(s,"ecran")}/3 · propreté ${Math.round(Number(s.proprete??100))} %</span>
      <span class="csEtat ${conflit?'occupee':travaux?'travaux':'libre'}">
        ${travaux ? "En travaux" : conflit ? "Occupée à " + brouillon.heure : "Libre à " + brouillon.heure}
      </span>
    </button>`;
  }).join("");
}

function rendChoixHoraires(){
  const f = filmParId(brouillon.film_id);
  document.getElementById("choixHoraires").innerHTML = horairesDisponibles().map(h=>{
    const conflit = chercheConflit({salle_id:brouillon.salle_id, heure:h, duree:f.duree, ignorerId:brouillon.id});
    const sel = h===brouillon.heure;
    return `<button class="pastHoraire ${sel?'sel':''} ${conflit?'occupe':''}" onclick="choisitHoraire('${h}')">
      ${h}${conflit?'<i></i>':''}
    </button>`;
  }).join("");
}

function choisitSalle(id){ brouillon.salle_id = id; rendChoixSalles(); rendChoixHoraires(); majPanneau(); }
function choisitHoraire(h){ brouillon.heure = h; rendChoixSalles(); rendChoixHoraires(); majPanneau(); }
function changePrix(d){
  brouillon.prix = Math.max(PRIX_MIN, Math.min(PRIX_MAX, brouillon.prix + d));
  document.getElementById("curseurPrix").value = brouillon.prix;
  majPanneau();
}
function changePrixDirect(v){ brouillon.prix = parseInt(v,10); majPanneau(); }

function majPanneau(){
  const f = filmParId(brouillon.film_id);
  const fin = heureEnMinutes(brouillon.heure) + f.duree;
  const libre = fin + NETTOYAGE_MIN;
  const conflit = chercheConflit({salle_id:brouillon.salle_id, heure:brouillon.heure, duree:f.duree, ignorerId:brouillon.id});
  const salle = sallesDispo.find(s=>String(s.id)===String(brouillon.salle_id));

  document.getElementById("prixVal").textContent = brouillon.prix + " €";
  document.getElementById("pnRecap").innerHTML = `
    <div class="recapLigne">${icone("horloge")} Début <b>${brouillon.heure}</b> · fin prévue <b>${minutesEnHeure(fin)}</b></div>
    <div class="recapLigne">${icone("outil")} Salle libérée à <b>${minutesEnHeure(libre)}</b> <small>(${NETTOYAGE_MIN} min de nettoyage)</small></div>
    <div class="recapLigne">${icone("spectateurs")} Potentiel indicatif <b>≈ ${estimeAudience({film_id:brouillon.film_id, salle_id:brouillon.salle_id, heure:brouillon.heure, prix:brouillon.prix})} spectateurs</b> <small>sur ${salle?salle.capacite:"—"} places</small></div>`;

  /* messages de Bob */
  let bob = "";
  if(conflit){
    const fc = filmParId(conflit.film_id);
    bob = `Deux films dans la même salle au même moment ? Même moi je ne sais pas monter une pellicule aussi vite.<br><small>« ${fc?fc.titre:conflit.film_id} » occupe ${salle?salle.nom:"la salle"} de ${conflit.heure} à ${minutesEnHeure(intervalle(conflit).libre)}.</small>`;
  }
  else if(brouillon.prix < 6) bob = "À ce prix-là, même les pigeons vont demander une place.";
  else if(brouillon.prix > 15) bob = "À ce tarif, j'espère que les fauteuils font aussi le café.";
  const zb = document.getElementById("pnBob");
  zb.className = "pnBob" + (conflit ? " conflit" : "");
  zb.innerHTML = bob ? `<span class="pnBobIco">${icone("cloche")}</span><span>${bob}</span>` : "";
  zb.style.display = bob ? "flex" : "none";

  const btn = document.getElementById("btnAjouter");
  btn.disabled = !!conflit;
  btn.textContent = conflit ? "Créneau occupé" : (brouillon.id ? "Enregistrer les modifications" : "Ajouter au programme");
}

/* ---------- validations (préparées pour un futur passage côté serveur) ---------- */
function verifieSeance(b){
  const f = filmParId(b.film_id);
  if(!Etat.session?.user_id) return "Session expirée. Reconnecte-toi.";
  if(!f) return "Film introuvable.";
  if(!filmDebloque(f)) return `« ${f.titre} » se débloque au niveau ${f.niveauRequis}.`;
  const salle = sallesDispo.find(s=>String(s.id)===String(b.salle_id));
  if(!salle) return "Cette salle n'appartient pas à ton cinéma.";
  if(salle.travaux_fin && new Date(salle.travaux_fin).getTime() > Date.now())
    return `${salle.nom} est en travaux, on ne peut pas y programmer de séance.`;
  if(b.prix < PRIX_MIN || b.prix > PRIX_MAX) return `Le prix doit être entre ${PRIX_MIN} et ${PRIX_MAX} €.`;
  if(!horairesDisponibles().includes(b.heure)) return "Horaire non disponible.";
  if(chercheConflit({salle_id:b.salle_id, heure:b.heure, duree:f.duree, ignorerId:b.id})) return "Créneau déjà occupé dans cette salle.";
  if(!b.id && seancesJour.length >= limiteSeances()) return `Limite de ${limiteSeances()} séances par jour atteinte.`;
  return null;
}

async function valideSeance(){
  const erreur = verifieSeance(brouillon);
  if(erreur){ bulleConseil(erreur); return; }
  const f = filmParId(brouillon.film_id);
  const c = Etat.cinema;
  const salle = sallesDispo.find(s=>String(s.id)===String(brouillon.salle_id));

  const corps = {
    cinema_id: c.id,
    user_id: Etat.session.user_id,
    salle_id: brouillon.salle_id,
    salle: salle.nom,
    jour: c.jour,
    heure: brouillon.heure,
    film_id: brouillon.film_id,
    duree_min: f.duree,
    nettoyage_min: NETTOYAGE_MIN,
    prix: brouillon.prix,
    cout_licence: coutLicence(f),
    statut: "draft"
  };

  if(brouillon.id){
    /* on demande au serveur de renvoyer la ligne : ce qu'on affiche est
       exactement ce qui a été enregistré, jamais une reconstruction locale */
    const res = await sbFetch("seances?id=eq."+brouillon.id, {method:"PATCH", body:corps, prefer:"return=representation"});
    if(!Array.isArray(res) || !res.length){ bulleConseil("La modification n'est pas passée. Réessaie."); return; }
    const i = seancesJour.findIndex(s=>String(s.id)===String(brouillon.id));
    if(i >= 0) seancesJour[i] = res[0];
    bulleConseil(`« ${f.titre} » déplacé à ${brouillon.heure}. Le marquee suit.`);
  }else{
    const res = await sbFetch("seances", {method:"POST", body:corps});
    if(!Array.isArray(res) || !res.length){ bulleConseil("La machine a toussé. Réessaie."); return; }
    seancesJour.push(res[0]);
    bulleConseil(`« ${f.titre} » à ${brouillon.heure} en ${salle.nom}. ` +
      (seancesJour.length >= limiteSeances() ? "Journée complète, patron." : `Encore ${limiteSeances()-seancesJour.length} séance(s) possible(s).`));
  }
  trieSeances();
  fermePanneau();
  rendVue();
  if((f.genre||"").toLowerCase() === "comédie") await accomplitMission("m_comedie");
}

async function supprimeSeance(id){
  const s = seancesJour.find(x=>String(x.id)===String(id));
  if(!s) return;
  const f = filmParId(s.film_id);
  await sbFetch("seances?id=eq."+id, {method:"DELETE", prefer:"return=minimal"});
  seancesJour = seancesJour.filter(x=>String(x.id)!==String(id));
  Etat.seancesJour = seancesJour;
  rendVue();
  bulleConseil(`« ${f?f.titre:"La séance"} » retirée du programme.`);
}
function modifieSeance(id){
  const s = seancesJour.find(x=>String(x.id)===String(id));
  if(s) ouvrePanneau(s.film_id, s.id);
}

/* ============================================================
   PROGRAMME DU JOUR
   ============================================================ */
/* ============================================================
   VUE 1 — À L'AFFICHE : les séances du jour
   ============================================================ */
/* ------------------------------------------------------------
   RENDU DU HALL

   Les séances déjà programmées occupent leurs cadres, dans
   l'ordre des horaires. On complète avec des cadres vides
   jusqu'à la limite du jour, sans jamais dépasser cinq : au-delà
   la scène deviendrait illisible sur un téléphone, et le tableau
   en dessous reprend de toute façon le détail complet.
   ------------------------------------------------------------ */
/* ============================================================
   VUE 1 — À L'AFFICHE : les séances du jour

   La page montrait une scène de hall qui occupait la moitié de
   l'écran, puis un tableau, puis un résumé. Trois représentations
   des mêmes séances, dont deux ne disaient pas la même chose : le
   tableau affichait une estimation locale pendant que le résumé
   lisait le serveur, et les deux se contredisaient.

   Il n'y a plus qu'une liste. Une séance = une carte, avec son
   horaire, son film, sa prévision, les raisons de cette prévision,
   et ses deux actions en clair : modifier, retirer.

   Le bouton « retirer » manquait complètement : supprimeSeance()
   existait, était exportée, mais aucun élément ne l'appelait. On
   ne pouvait donc pas défaire une séance une fois posée.
   ============================================================ */

/* la prévision du serveur pour une séance, ou une estimation de
   secours tant qu'elle n'est pas arrivée */
function chiffresSeance(s){
  const pv = previsionDe(s.id);
  const cap = capaciteSalle(s.salle_id) || 0;
  if(pv) return {
    bas: pv.prevision_basse, haut: pv.prevision_haute, cap: pv.capacite,
    taux: pv.taux_estime, tendance: pv.tendance, facteurs: pv.facteurs || [],
    serveur: true
  };
  const est = estimeAudience(s);
  return {
    bas: est, haut: est, cap,
    taux: cap ? Math.min(100, Math.round(est / cap * 100)) : 0,
    tendance: null, facteurs: [], serveur: false
  };
}

function carteSeance(s, verrouille){
  const f = filmParId(s.film_id);
  const titre = f ? f.titre : s.film_id;
  const c = chiffresSeance(s);
  const passee = seanceCommencee(s);
  const plus  = c.facteurs.filter(x=>x.signe === "+").slice(0,2);
  const moins = c.facteurs.filter(x=>x.signe === "-").slice(0,2);

  return `<article class="carteSeance ${passee ? "encours" : ""}">
    <div class="csHaut" ${verrouille ? "" : `onclick="modifieSeance('${s.id}')"`}>
      <div class="csHeure"><b>${echappe(s.heure)}</b></div>
      <div class="csMid">
        <b>${echappe(titre)}</b>
        <span>${echappe(f ? f.genre : "")} • ${fmtDuree(s.duree_min||0)} • ${echappe(s.salle||"Salle")}</span>
      </div>
      <div class="csDr">
        <b class="${classeTaux(c.taux)}">${c.bas === c.haut ? c.bas : c.bas + "–" + c.haut}</b>
        <span>sur ${c.cap}</span>
      </div>
    </div>

    ${(plus.length || moins.length) ? `<div class="csRaisons">
      ${plus.map(x=>`<span class="p">+ ${echappe(x.texte)}</span>`).join("")}
      ${moins.map(x=>`<span class="m">− ${echappe(x.texte)}</span>`).join("")}
    </div>` : ""}

    ${verrouille
      ? `<div class="csVerrou">${icone("etoile")} Séance en cours</div>`
      : `<div class="csBas">
          <button onclick="modifieSeance('${s.id}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/>
              <path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/></svg>
            Modifier</button>
          <button class="sup" onclick="demandeRetrait('${s.id}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>
            Retirer</button>
        </div>`}
  </article>`;
}

/* On confirme avant de retirer : une séance représente une licence
   déjà engagée, et le geste est irréversible. */
function demandeRetrait(id){
  const s = seancesJour.find(x=>String(x.id)===String(id));
  if(!s) return;
  const f = filmParId(s.film_id);
  const titre = f ? f.titre : "cette séance";
  const anciens = document.getElementById("voileRetrait");
  if(anciens) anciens.remove();

  const o = document.createElement("div");
  o.className = "voileRetrait";
  o.id = "voileRetrait";
  o.innerHTML = `<div class="boiteRetrait">
    <h3>Retirer « ${echappe(titre)} » ?</h3>
    <p>La séance de ${echappe(s.heure)} disparaît du programme.
       La licence n'est pas payée tant que le cinéma n'a pas ouvert.</p>
    <div class="brActions">
      <button class="brAnnuler" onclick="fermeRetrait()">Garder</button>
      <button class="brOui" onclick="fermeRetrait(); supprimeSeance('${s.id}')">Retirer</button>
    </div>
  </div>`;
  document.body.appendChild(o);
  requestAnimationFrame(()=>o.classList.add("ouvert"));
}
function fermeRetrait(){
  const o = document.getElementById("voileRetrait");
  if(!o) return;
  o.classList.remove("ouvert");
  setTimeout(()=>o.remove(), 200);
}

function rendVueAffiche(){
  const limite = limiteSeances();
  const verrouille = journeeLancee();
  const tab = document.getElementById("tableauProg");
  if(!tab) return;

  const entete = `<div class="ligneJourProg">
    <h1>${verrouille ? "Le cinéma est ouvert" : "Aujourd'hui"}</h1>
    <span class="badgeJourProg">Jour ${Etat.cinema?.jour || 1}
      · ${seancesJour.length}/${limite} séance${limite > 1 ? "s" : ""}</span>
  </div>`;

  if(seancesJour.length === 0){
    tab.innerHTML = entete + `
      <div class="videProg">
        <p>Le projecteur est froid.</p>
        <small>Choisis un film pour ouvrir ta première séance.</small>
      </div>
      <button class="btnAjoutProg" onclick="allerAuCatalogue()">+ Ajouter une séance</button>
      ${blocBob()}`;
    rendValidation(verrouille);
    return;
  }

  const cartes = seancesJour.map(s=>carteSeance(s, verrouille)).join("");
  const ajout = (!verrouille && seancesJour.length < limite)
    ? `<button class="btnAjoutProg" onclick="allerAuCatalogue()">+ Ajouter une séance</button>`
    : "";

  tab.innerHTML = entete + cartes + ajout + resumeAvantOuverture() + blocBob();
  rendValidation(verrouille);
}

/* ------------------------------------------------------------
   LE RÉSUMÉ

   Il annonçait « 0 à 0 spectateurs attendus » et une journée à
   perte alors que le serveur prévoyait une centaine d'entrées et
   un bénéfice. Les chiffres étaient recalculés localement à partir
   d'une moyenne de prix, au lieu d'être lus tels quels.

   Tout vient maintenant de get_day_forecast, qui calcule séance
   par séance avec le prix réel de chaque billet. Le résumé et le
   bilan du soir parlent donc enfin de la même journée.
   ------------------------------------------------------------ */
function resumeAvantOuverture(){
  if(journeeLancee()) return "";
  const p = previsionsJour;
  const charges = prepDuJour && prepDuJour.charges ? Number(prepDuJour.charges.total || 0) : 0;

  if(!p){
    return `<section class="bilanProg">
      <h2>Prêt à ouvrir</h2>
      <div class="bpSous">Les prévisions arrivent…</div>
      <button class="btnPortesProg" onclick="lanceLaJournee()">Ouvrir les portes</button>
    </section>`;
  }

  const bas      = Number(p.total_bas || 0);
  const haut     = Number(p.total_haut || 0);
  const recette  = Number(p.recette_estimee || 0);
  const licences = Number(p.cout_licences || 0);
  const argent   = Number(p.argent_disponible ?? Etat.cinema?.argent ?? 0);
  const payable  = p.licences_payables !== false;
  const benefice = recette - licences - charges;
  const manque   = Math.max(0, licences - argent);

  return `<section class="bilanProg">
    <h2>Prêt à ouvrir</h2>
    <div class="bpSous">Ce que le quartier devrait donner aujourd'hui</div>

    <div class="bpLigne"><span>Spectateurs attendus</span><b>${bas} à ${haut}</b></div>
    <div class="bpLigne"><span>Recette estimée</span><b class="vert">${fmtArgent(recette)}</b></div>
    <div class="bpLigne">
      <span>Licences à payer${manque ? `<small>il manque ${fmtArgent(manque)}</small>` : ""}</span>
      <b class="${payable ? "" : "rouge"}">− ${fmtArgent(licences)}</b></div>
    ${charges ? `<div class="bpLigne"><span>Charges du jour</span>
      <b>− ${fmtArgent(charges)}</b></div>` : ""}

    <div class="bpResultat ${benefice >= 0 ? "bon" : "mauvais"}">
      <b>${benefice >= 0 ? "+" : "−"} ${fmtArgent(Math.abs(benefice))}</b>
      <span>${benefice >= 0
        ? "la journée devrait être bénéficiaire"
        : "la journée s'annonce déficitaire"}</span>
    </div>

    <button class="btnPortesProg" ${payable ? "" : "disabled"} onclick="lanceLaJournee()">
      ${payable ? "Ouvrir les portes" : "Licences impayables"}</button>
  </section>`;
}

/* le mot de Bob, sous le résumé */
function blocBob(){
  return `<div class="blocBobProg">
    <div class="bbTete">${icone("etoile")}</div>
    <p><b>Bob — homme à tout faire</b>${echappe(conseilProg())}</p>
  </div>`;
}

async function lanceLaJournee(){
  const b = document.querySelector(".btnPortesProg");
  if(b){ b.disabled = true; b.textContent = "On ouvre…"; }
  try{
    if(typeof ouvreCinema === "function"){ await ouvreCinema(); return; }
    location.href = "bilan.html";
  }catch(e){
    if(b) b.disabled = false;
    bulleConseil(messageErreur(e));
  }
}

function rendValidation(valide){
  const z = document.getElementById("zoneValidation");
  if(!z) return;
  if(journeeLancee()){
    z.innerHTML = `<div class="programmeValide">${icone("porte")}
      Le cinéma est ouvert — programme verrouillé.
      <button class="btnRouvrir" onclick="location.href='bilan.html'">Voir le bilan</button></div>`;
  }else{
    z.innerHTML = "";
  }
}

function allerAuCatalogue(){
  const b = document.querySelector('#segments button[data-vue="catalogue"]');
  if(b) b.click();
}

/* une séance a-t-elle déjà commencé ? */
function seanceCommencee(s){
  if(!journeeLancee()) return false;
  const now = new Date();
  const [h,m] = String(s.heure||"0:0").split(/[h:]/).map(n=>parseInt(n,10)||0);
  return (now.getHours()*60 + now.getMinutes()) >= (h*60 + m);
}

function capaciteSalle(id){
  const s = (sallesDispo||[]).find(x=>String(x.id) === String(id));
  return s ? Number(s.capacite)||0 : 0;
}
function classeTaux(t){ return t >= 70 ? "haut" : t >= 40 ? "moyen" : "bas"; }

/* ============================================================
   VUE 2 — PROCHAINS FILMS : le catalogue
   ============================================================ */
function rendVueCatalogue(){
  const films = catalogueComplet();
  const ouverts = films.filter(f=>filmDebloque(f));
  const fermes  = films.filter(f=>!filmDebloque(f));
  const cat = catalogueServeur;

  /* le bandeau du haut : où en est la semaine */
  const enTete = cat ? `
    <div class="semaineProg">
      <div class="spGauche">
        <b>Semaine ${cat.semaine}</b>
        <span>${cat.jours_avant_sorties === 7
          ? "Les nouveautés viennent d'arriver"
          : cat.jours_avant_sorties + " jour" + (cat.jours_avant_sorties > 1 ? "s" : "")
            + " avant les prochaines sorties"}</span>
      </div>
      ${(cat.prochaines_sorties || []).length ? `<div class="spDroite">
        <span>La semaine prochaine</span>
        <b>${cat.prochaines_sorties.map(p=>
          echappe(p.titre) + (p.exceptionnel ? " ★" : "")).join(" · ")}</b>
      </div>` : ""}
    </div>` : "";

  /* le tableau, groupé par état plutôt qu'en vrac */
  const groupe = (titre, liste, note) => liste.length ? `
    <div class="grpProg">
      <div class="grpTitre">${titre}<span>${note || ""}</span></div>
      ${liste.map(f=>ligneCatalogue(f)).join("")}
    </div>` : "";

  document.getElementById("tableauProg").innerHTML = enTete +
    groupe("Nouveautés", ouverts.filter(f=>f.statutSortie === "nouveaute"),
           "à ne pas manquer cette semaine") +
    groupe("Productions maison", ouverts.filter(f=>f.maison), "aucune licence à payer") +
    groupe("À l'affiche", ouverts.filter(f=>f.statutSortie === "affiche"),
           "sorties les semaines passées") +
    groupe("Dernière semaine", ouverts.filter(f=>f.statutSortie === "fin_affiche"),
           "elles quittent l'écran dimanche") +
    groupe("Le fonds de reprise", ouverts.filter(f=>f.statutSortie === "reprise"),
           "moins de monde, mais presque rien à payer") +
    groupe("Bientôt", fermes, "ils s'ouvrent avec les niveaux suivants") + `
    <div class="actionsProg">
      <button class="btnOrProg" onclick="allerAuProgramme()">Voir mon programme</button>
      <button class="btnVideProg" onclick="location.href='studio.html'">Mes productions</button>
    </div>`;
  document.getElementById("zoneValidation").innerHTML = "";
}

function ligneCatalogue(f){
  const m = mentionSortie(f);

  /* Un film hors de portée garde sa ligne : voir passer ce qu'on ne
     peut pas encore programmer donne une raison de monter. Avant, il
     n'était qu'un chiffre en bas de page. */
  if(!filmDebloque(f)){
    return `<div class="rangProg verrouProg" onclick="refuseFilm('${f.id}')">
      <span class="rpHeure">Niv ${f.niveauRequis || "?"}</span>
      <span class="rpMid"><b>${echappe(f.titre.toUpperCase())}</b>
        <span>${echappe(f.genre)} • ${fmtDuree(f.duree)}</span></span>
      <span class="rpDr"><b>—</b><span>verrouillé</span></span>
      <span class="rpChev">${icone("porte")}</span>
    </div>`;
  }

  const baisse = f.populariteBase && f.popularite < f.populariteBase;
  return `<div class="rangProg ${f.exceptionnel ? "evenementProg" : ""}"
      onclick="ouvrePanneau('${f.id}')">
    <span class="rpHeure">${f.coutLicence ? fmtArgent(coutLicence(f)) : "—"}</span>
    <span class="rpMid"><b>${echappe(f.titre.toUpperCase())}</b>
      <span>${echappe(f.genre)} • ${fmtDuree(f.duree)}${
        m && !f.maison ? " • " + echappe(m.texte) : ""}</span></span>
    <span class="rpDr"><b class="${classeTaux(f.popularite)}">${f.popularite}</b>
      <span>${baisse ? "au lieu de " + f.populariteBase : "Popularité"}</span></span>
    <span class="rpChev">›</span>
  </div>`;
}

function allerAuProgramme(){
  const b = document.querySelector('#segments button[data-vue="affiche"]');
  if(b) b.click();
}

/* ============================================================
   VUE 3 — ÉVÉNEMENTS : ce qui se passe dans le quartier
   ============================================================ */
async function rendVueEvenements(){
  const piste = document.getElementById("pisteAffiches");
  const tab = document.getElementById("tableauProg");
  if(!piste || !tab) return;
  document.getElementById("zoneValidation").innerHTML = "";

  /* On relit la liste si elle est vide OU si elle date de plus d'une
     minute : un festival qui se termine disparaissait sinon seulement
     au rechargement de la page. */
  const perimee = !evenementsProg.length ||
                  (Date.now() - evenementsProgLe) > 60000;
  if(perimee){
    if(!evenementsProg.length) piste.innerHTML = `<div class="pisteVide">On regarde…</div>`;
    try{
      const r = await rpc("get_active_community_events");   /* sans paramètre */
      evenementsProg = Array.isArray(r) ? r : (r?.evenements || []);
    }catch(e){ evenementsProg = []; }
    evenementsProgLe = Date.now();
  }

  if(!evenementsProg.length){
    piste.innerHTML = `<div class="pisteVide">Rien à l'horizon.<br>
      <small>Le quartier est calme cette semaine.</small></div>`;
    tab.innerHTML = `<div class="videProg">Aucun événement en cours.<br>
      <small>Les festivals reviennent régulièrement, reste à l'écoute.</small></div>
      <div class="actionsProg">
        <button class="btnOrProg" onclick="location.href='evenements.html'">
          Voir les festivals passés</button>
      </div>`;
    return;
  }

  piste.innerHTML = evenementsProg.slice(0, 8).map(e=>carteAffiche({
    genre: e.genre_favori || "Culte",
    titre: e.nom || "Événement",
    ligne: e.actif ? "En cours" : "Bientôt",
    etat: e.heures_restantes ? fmtDureeHeures(e.heures_restantes) : (e.actif ? "En cours" : "À venir"),
    classe: e.actif ? "cours" : "venir",
    action: `location.href='evenements.html'`
  })).join("");

  tab.innerHTML = evenementsProg.map(e=>`
    <div class="rangProg" onclick="location.href='evenements.html'">
      <span class="rpHeure">${e.actif ? "Actif" : "Bientôt"}</span>
      <span class="rpMid"><b>${echappe((e.nom||"Événement").toUpperCase())}</b>
        <span>${echappe(e.description || e.resume || "")}</span></span>
      <span class="rpDr"><b class="${e.actif ? "haut" : "moyen"}">
        ${Number(e.participants||0)}</b><span>participants</span></span>
      <span class="rpChev">›</span>
    </div>`).join("") + `
    <div class="actionsProg">
      <button class="btnOrProg" onclick="location.href='evenements.html'">Participer</button>
      <button class="btnVideProg" onclick="location.href='progression.html'">Mes récompenses</button>
    </div>`;
}

/* ============================================================
   LA CARTE D'AFFICHE, commune aux trois vues
   ============================================================ */
function carteAffiche(o){
  return `<button class="carteAff ${o.classe === "ferme" ? "verrouillee" : ""}"
    ${o.action ? `onclick="${o.action}"` : ""} aria-label="${echappe(o.titre)}">
    <span class="cadreAff">
      ${afficheDuFilm({id:o.id, titre:o.titre, genre:o.genre}, false)}
      <span class="genreEt">${echappe(o.genre)}</span>
      ${o.maison ? `<span class="maisonEt">Maison</span>` : ""}
      ${o.classe === "ferme" ? `<span class="voileVerrou">${icone("porte")}</span>` : ""}
    </span>
    <span class="titreAff">${echappe(o.titre)}</span>
    <span class="ligneAff">${echappe(o.ligne)}</span>
    <span class="etatAff ${o.classe}">${echappe(o.etat)}</span>
  </button>`;
}



/* la bulle de Bob */
function bulleProgTexte(t){
  const el = document.getElementById("bulleProg");
  if(el) texteSur(el, t);
}

/* La validation n'existe plus : ouvrir vaut validation, et c'est le
   serveur qui fait passer les séances. Les deux fonctions qui
   servaient à valider puis à revenir en arrière sont retirées.
   L'XP « programme validé » est désormais donnée à l'ouverture. */

/* ---- exports ---- */
export {
  PLAQUES,
  PRIX_MIN,
  SOUS_TITRES,
  afficherPanneau,
  agranditAffiche,
  allerAuCatalogue,
  allerAuProgramme,
  boutonsProg,
  brancheSegments,
  brouillon,
  bulleConseil,
  bulleProgTexte,
  capaciteSalle,
  carteAffiche,
  catalogueComplet,
  catalogueServeur,
  changePrix,
  changePrixDirect,
  chargeCatalogue,
  chargeFilmsMaison,
  chargeMatin,
  chargePrevisions,
  chargeSallesProg,
  chargeSeances,
  chercheConflit,
  choisitHoraire,
  choisitSalle,
  classeTaux,
  classeTendance,
  conseilDeLaVue,
  conseilProg,
  coutLicence,
  estimeAudience,
  evenementsProg,
  fermeAffiche,
  fermePanneau,
  filmDepuisServeur,
  initProgrammation,
  installeFleches,
  intervalle,
  journeeLancee,
  lanceLaJournee,
  ligneCatalogue,
  limiteSeances,
  majFleches,
  majPanneau,
  mentionSortie,
  modifieSeance,
  ouvrePanneau,
  premierHoraireLibre,
  prepDuJour,
  previsionDe,
  previsionsJour,
  rafraichitPrevisions,
  refuseFilm,
  rendChoixHoraires,
  rendChoixSalles,
  rendValidation,
  rendVue,
  rendVueAffiche,
  rendVueCatalogue,
  rendVueEvenements,
  resumeAvantOuverture,
  sallesDispo,
  seanceCommencee,
  seancesJour,
  supprimeSeance,
  demandeRetrait,
  fermeRetrait,
  trieSeances,
  valideSeance,
  verifieSeance,
  vueProg
};

/* ---- gestionnaires en attribut ---- */
/* Ces fonctions sont appelées depuis des attributs onclick écrits
   dans le HTML généré. Un module ES n'expose rien globalement :
   on les rend accessibles explicitement. */
Object.assign(window, {
  agranditAffiche,
  allerAuCatalogue,
  allerAuProgramme,
  changePrix,
  changePrixDirect,
  choisitHoraire,
  choisitSalle,
  demandeRetrait,
  fermeAffiche,
  fermePanneau,
  fermeRetrait,
  lanceLaJournee,
  modifieSeance,
  ouvrePanneau,
  refuseFilm,
  supprimeSeance,
  valideSeance
});




