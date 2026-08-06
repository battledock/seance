/* État courant du jeu et chargements officiels. */

import { deconnexion, protegerPage, sessionValide } from "./auth.js?v=2ab9afab";
import { activeConfiserieSiBesoin, chargeConfiserie } from "./data/concessions.js?v=2ab9afab";
import { chargePersonnalisation } from "./data/customization.js?v=2ab9afab";
import { compareHeures } from "./data/films.js?v=2ab9afab";
import { chargeJournee, chargeStats, statutJournee } from "./engine/day.js?v=2ab9afab";
import { initNavigation, majHeaderArgent, majStatutHeader } from "./navigation.js?v=2ab9afab";
import { chargeMissions, chargeProgression, majBarreXPHeader, synchroniseDeblocages } from "./progression.js?v=2ab9afab";
import {
  idOperation,
  renouvelleSession,
  rpc,
  sbFetch,
  sessionLocale
} from "./supabase-client.js?v=2ab9afab";

/* ============================================================
   ÉTAT DU JEU — source de vérité unique côté client
   Le contenu vient TOUJOURS de Supabase. Le cache local ne sert
   qu'à afficher rapidement le nom et le logo pendant le chargement ;
   il n'est jamais utilisé pour valider une dépense.
   ============================================================ */
const Etat = {
  session: null,
  cinema: null,          /* cinemas */
  salles: [],            /* salles */
  journee: null,         /* journees (jour courant) */
  seancesJour: [],       /* seances du jour courant */
  progression: null,     /* progression (niveau, xp) */
  deblocages: [],        /* deblocages */
  possessions: [],       /* possessions (personnalisations) */
  perso: null,           /* personnalisation (sélections) */
  confiserie: null,      /* confiserie */
  stats: null,           /* stats_cinema */
  missionsFaites: [],
  reputation: 50,
  charge: false,
  version: 0             /* version optimiste du cinéma */
};
/* nom explicite pour les nouveaux modules ; même objet */
const GameState = Etat;

/* ---------- cache d'affichage, non critique ---------- */
function litCacheAffichage(){
  try{ return JSON.parse(localStorage.getItem("rex_cache") || "null"); }catch(e){ return null; }
}
function ecritCacheAffichage(){
  if(!Etat.cinema) return;
  localStorage.setItem("rex_cache", JSON.stringify({
    id: Etat.cinema.id, nom: Etat.cinema.nom, logo: Etat.cinema.logo,
    niveau: Etat.progression?.niveau || 1, maj: Date.now()
  }));
}

/* ---------- monnaie ---------- */
function fmtArgent(n){ return Math.floor(Number(n)||0).toLocaleString("fr-FR") + " €"; }

/* ============================================================
   CHARGEMENTS — un seul exemplaire de chaque, partagé par les pages
   ============================================================ */
async function chargeCinema(force = false){
  if(Etat.cinema && !force) return Etat.cinema;
  const s = Etat.session || sessionLocale();
  if(!s?.user_id) return null;
  const d = await sbFetch(`cinemas?user_id=eq.${s.user_id}&select=*`);
  if(!Array.isArray(d) || d.length === 0) return Etat.cinema;   /* réseau KO : on garde l'existant */
  Etat.cinema = d[0];
  Etat.version = Number(d[0].version || 1);
  Etat.reputation = Number(d[0].reputation ?? 50);
  ecritCacheAffichage();
  return Etat.cinema;
}

/* ------------------------------------------------------------
   LE CATALOGUE DU JOUR, PARTAGÉ PAR TOUTES LES PAGES

   Les titres, popularités et licences dépendent de la semaine
   d'exploitation : seul le serveur les connaît. Sans ce
   chargement, l'accueil et le bilan retombaient sur une liste
   figée de dix-huit films et ne savaient rien des trente-cinq
   autres — ni titre, ni genre, ni licence.
   ------------------------------------------------------------ */
async function chargeCatalogueJour(){
  try{
    if(!Etat.cinema || !Etat.cinema.id) return;
    const r = await rpc("get_catalogue", {p_cinema_id: Etat.cinema.id});
    if(!r || r.success !== true) return;
    const d = r.data || {};
    Etat.catalogueJour = [].concat(d.nouveautes || [], d.a_l_affiche || [], d.reprises || [])
      .map(e => ({
        id: e.film_id, titre: e.titre, genre: e.genre,
        duree: Number(e.duree) || 100,
        popularite: Number(e.popularite), populariteBase: Number(e.popularite_base),
        qualite: Number(e.qualite),
        coutLicence: Number(e.cout_licence), licenceBase: Number(e.licence_base),
        niveauRequis: Number(e.niveau_requis) || 1,
        publicCible: e.public_cible || ["adultes"],
        statutSortie: e.statut, semaineExploitation: e.semaine_exploitation,
        exceptionnel: !!e.exceptionnel, tendance: e.tendance
      }));
    Etat.semaineJeu = d.semaine;
    Etat.joursAvantSorties = d.jours_avant_sorties;
  }catch(e){ /* le secours reste la liste figée */ }
}

/* ------------------------------------------------------------
   LES PALIERS DU STUDIO

   Le studio et ses genres de production ont leurs propres niveaux,
   décidés côté serveur. Les recopier dans le client serait repartir
   dans la dérive qu'on vient de corriger : on les lit.
   ------------------------------------------------------------ */
async function chargePaliersStudio(){
  try{
    const [g, t] = await Promise.all([
      sbFetch("production_genres?select=cle,libelle,niveau_requis&order=niveau_requis"),
      sbFetch("production_talents?select=id,nom,role,popularite,cout,niveau_requis&order=niveau_requis")
    ]);
    if(Array.isArray(g) && g.length) Etat.paliersStudio = g;
    if(Array.isArray(t) && t.length) Etat.talentsStudio = t;
  }catch(e){ /* la liste s'affichera sans le studio */ }
}

/* ------------------------------------------------------------
   LES CAMPAGNES D'AFFICHAGE
   ------------------------------------------------------------ */
/* les charges du jour : le journal de l'accueil les annonce */
async function chargeCharges(){
  try{
    if(!Etat.cinema || !Etat.cinema.id) return;
    const d = await rpc("rex_charges_jour", {p_cinema_id: Etat.cinema.id});
    if(d) Etat.charges = d;
  }catch(e){}
}

async function chargePersonnel(){
  try{
    if(!Etat.cinema || !Etat.cinema.id) return;
    const r = await rpc("get_personnel", {p_cinema_id: Etat.cinema.id});
    if(r && r.success === true) Etat.personnel = r.data;
  }catch(e){}
}

async function chargeSoirees(){
  try{
    if(!Etat.cinema || !Etat.cinema.id) return;
    const r = await rpc("get_soirees", {p_cinema_id: Etat.cinema.id});
    if(r && r.success === true) Etat.soirees = r.data;
  }catch(e){ /* l'écran s'affichera sans */ }
}

async function chargeCampagnes(){
  try{
    if(!Etat.cinema || !Etat.cinema.id) return;
    const r = await rpc("get_campagnes", {p_cinema_id: Etat.cinema.id});
    if(r && r.success === true) Etat.campagnes = r.data;
  }catch(e){ /* l'écran s'affichera sans */ }
}

async function chargeSallesEtat(){
  if(!Etat.cinema) return [];
  const d = await sbFetch(`salles?cinema_id=eq.${Etat.cinema.id}&select=*&order=cree_le`);
  if(Array.isArray(d)) Etat.salles = d;
  return Etat.salles;
}

async function chargeSeancesEtat(){
  if(!Etat.cinema) return [];
  const d = await sbFetch(`seances?cinema_id=eq.${Etat.cinema.id}&jour=eq.${Etat.cinema.jour}&select=*`);
  if(Array.isArray(d)){
    Etat.seancesJour = d.slice().sort((a,b)=>
      (typeof compareHeures === "function" ? compareHeures(a.heure,b.heure) : String(a.heure).localeCompare(String(b.heure))));
  }
  return Etat.seancesJour;
}

/* ============================================================
   INITIALISATION COMMUNE — une seule fonction pour toutes les pages
   ============================================================ */
async function initialiserJeu({onglet = "jeu", cinemaRequis = true} = {}){
  const garde = await protegerPage({cinemaRequis});
  if(!garde) return null;

  /* chargements parallèles : un échec isolé ne bloque jamais la page */
  await Promise.all([
    chargeProgression(),
    chargeSallesEtat(),
    chargeSeancesEtat(),
    chargeJournee(),
    chargePersonnalisation(),
    chargeConfiserie(),
    chargeStats(),
    chargeMissions(),
    chargeCatalogueJour(),
    chargePaliersStudio(),
    chargeCampagnes(),
    chargeSoirees(),
    chargePersonnel(),
    chargeCharges()
  ].map(p => p.catch(()=>null)));

  await synchroniseDeblocages().catch(e=>console.warn("[Rex] deblocages", e));
  await activeConfiserieSiBesoin().catch(e=>console.warn("[Rex] confiserie", e));
  await rafraichirClassement().catch(()=>null);

  /* trophées et profil public tenus à jour par le serveur */
  rpc("verifier_trophees", {p_cinema_id: Etat.cinema.id})
    .catch(e=>console.warn("[Rex] trophees", e));
  Etat.charge = true;
  ecritCacheAffichage();
  initNavigation(onglet);
  installeResynchronisation();
  return Etat;
}

/* recharge tout depuis Supabase — après une erreur ou un retour d'arrière-plan */
async function rafraichirEtat(){
  const avant = {
    argent: Number(Etat.cinema?.argent || 0),
    niveau: Etat.progression?.niveau || 1,
    jour: Etat.cinema?.jour || 1
  };
  await chargeCinema(true);
  await Promise.all([
    chargeProgression(true), chargeSallesEtat(), chargeSeancesEtat(), chargeJournee(true),
    chargeCatalogueJour()
  ].map(p => (p && p.catch) ? p.catch(()=>null) : p));

  if(typeof majHeaderArgent === "function") majHeaderArgent();
  if(typeof majBarreXPHeader === "function") majBarreXPHeader();
  if(typeof majStatutHeader === "function") majStatutHeader();

  return {
    argentChange: Number(Etat.cinema?.argent || 0) !== avant.argent,
    niveauChange: (Etat.progression?.niveau || 1) !== avant.niveau,
    jourChange: (Etat.cinema?.jour || 1) !== avant.jour
  };
}

/* ---------- resynchronisation au retour dans l'application ---------- */
let derniereSynchro = Date.now();
function installeResynchronisation(){
  if(window.__resyncInstalle) return;
  window.__resyncInstalle = true;
  const resync = async ()=>{
    if(document.hidden) return;
    if(Date.now() - derniereSynchro < 20000) return;   /* pas à chaque micro-retour */
    derniereSynchro = Date.now();
    if(!sessionValide()){ const n = await renouvelleSession(); if(!n){ deconnexion(); return; } }
    await rafraichirEtat().catch(()=>null);
  };
  document.addEventListener("visibilitychange", resync);
  window.addEventListener("focus", resync);
}

/* ============================================================
   ÉCRITURES SUR LE CINÉMA
   Les colonnes sensibles (argent, jour, réputation) passent par une
   opération économique tracée ; les autres sont écrites directement.
   ============================================================ */
/* colonnes que le joueur peut encore écrire directement ;
   argent, jour, réputation, capacité et niveau sont refusés par le serveur */
const CHAMPS_LIBRES = ["devise","directeur","logo","nom"];

async function majCinema(champs){
  const refuses = Object.keys(champs).filter(k=>!CHAMPS_LIBRES.includes(k));
  if(refuses.length){
    /* on met à jour l'affichage, la base sera corrigée au prochain rafraîchissement */
    Object.assign(Etat.cinema, champs);
    return true;
  }
  const avant = {...Etat.cinema};
  Object.assign(Etat.cinema, champs);
  ecritCacheAffichage();
  try{
    const r = await sbFetch("cinemas?id=eq." + Etat.cinema.id, {
      method:"PATCH", body:{...champs, maj_le:new Date().toISOString()}, prefer:"return=minimal"
    });
    if(r === false) throw new ErreurJeu("SERVEUR");
    return true;
  }catch(e){
    /* on ne laisse pas l'écran mentir : on remet l'état d'avant puis on recharge */
    Etat.cinema = avant;
    await chargeCinema(true).catch(()=>null);
    if(typeof majHeaderArgent === "function") majHeaderArgent();
    throw e;
  }
}

/* dépense contrôlée : vérifie les fonds sur les données officielles
   fraîchement rechargées, puis débite et journalise en une passe. */
async function depense({montant, categorie, salle_id, details}){
  const r = await rpc("operation_economique", {
    p_cinema_id: Etat.cinema.id, p_montant: -Math.abs(montant), p_categorie: categorie,
    p_salle_id: salle_id || null, p_details: details || null, p_operation_id: idOperation()
  });
  if(!r?.success){
    if(r?.code === "INSUFFICIENT_FUNDS") throw new ErreurJeu("FONDS");
    throw new ErreurJeu("SERVEUR");
  }
  Etat.cinema.argent = r.data.argent;
  Etat.version = r.data.version;
  if(typeof majHeaderArgent === "function") majHeaderArgent();
  return r.data.argent;
}

/* ============================================================
   STATUT TEMPS RÉEL DU CINÉMA
   Le cinéma vit à l'heure du téléphone : ouvert de 13h00 à 23h30,
   fermé la nuit, partiellement fermé si des salles sont en travaux.
   ============================================================ */
const OUVERTURE = {h:13, m:0};
const FERMETURE = {h:23, m:30};

/* Les horaires d'affichage du cinéma. Ils servent à raconter — la
   dernière séance, l'ambiance du soir — mais ne bloquent jamais le jeu :
   on joue quand on veut, y compris à trois heures du matin. */
function estOuvertMaintenant(){
  const n = new Date();
  const mins = n.getHours()*60 + n.getMinutes();
  return mins >= OUVERTURE.h*60 + OUVERTURE.m && mins < FERMETURE.h*60 + FERMETURE.m;
}

function sallesEnTravaux(){
  const now = Date.now();
  return (Etat.salles || []).filter(s =>
    s.travaux_fin && new Date(s.travaux_fin).getTime() > now);
}

/* L'état du cinéma suit la partie, pas l'horloge du téléphone.
   {code, pastille, libelle} — pastille : ouvert | ferme | travaux */
function statutCinema(){
  const travaux = sallesEnTravaux();
  const total = (Etat.salles || []).length || 1;
  const seances = Etat.seancesJour || [];
  const jour = (typeof statutJournee === "function") ? statutJournee() : "draft";

  if(travaux.length >= total && total > 0){
    return {code:"travaux_total", pastille:"travaux",
      libelle:"Fermé pour travaux — " + travaux.map(t=>t.nom).join(", ")};
  }
  if(travaux.length > 0 && jour === "running"){
    return {code:"travaux_partiel", pastille:"travaux",
      libelle:"Ouvert — travaux en " + travaux.map(t=>t.nom).join(" et ")};
  }
  if(jour === "running"){
    return {code:"ouvert", pastille:"ouvert",
      libelle:"Ouvert — les portes sont grandes ouvertes"};
  }
  if(jour === "completed"){
    return {code:"termine", pastille:"ferme",
      libelle:"Journée terminée — le bilan t'attend"};
  }
  /* Il n'y a plus de programme « à valider » : dès qu'une séance
     existe et que les licences sont payables, le cinéma peut ouvrir. */
  if(seances.length){
    const licences = seances.reduce((t,x)=>t + Number(x.cout_licence||0), 0);
    if(Number(Etat.cinema && Etat.cinema.argent) < licences)
      return {code:"cher", pastille:"travaux",
        libelle:"Licences trop chères — il manque de l'argent"};
    return {code:"pret", pastille:"ouvert",
      libelle:"Prêt à ouvrir — " + seances.length + " séance"
              + (seances.length > 1 ? "s" : "") + " au programme"};
  }
  return {code:"ferme", pastille:"ferme", libelle:"Fermé — aucune séance au programme"};
}

function fmtCompte(ms){
  const t = Math.max(0, Math.ceil(ms/1000));
  return Math.floor(t/60) + "m " + String(t%60).padStart(2,"0") + "s";
}


/* scores de classement recalculés au chargement, sans bloquer la page */
async function rafraichirClassement(){
  if(!Etat.cinema) return;
  try{ await rpc("refresh_all_leaderboard_scores", {p_cinema_id: Etat.cinema.id}); }
  catch(e){ console.warn("[Rex] classement", e); }
}

/* ---- exports ---- */
export {
  CHAMPS_LIBRES,
  Etat,
  FERMETURE,
  GameState,
  OUVERTURE,
  chargeCampagnes,
  chargeCatalogueJour,
  chargeCharges,
  chargeCinema,
  chargePaliersStudio,
  chargePersonnel,
  chargeSallesEtat,
  chargeSeancesEtat,
  chargeSoirees,
  depense,
  derniereSynchro,
  ecritCacheAffichage,
  estOuvertMaintenant,
  fmtArgent,
  fmtCompte,
  initialiserJeu,
  installeResynchronisation,
  litCacheAffichage,
  majCinema,
  rafraichirClassement,
  rafraichirEtat,
  sallesEnTravaux,
  statutCinema
};
