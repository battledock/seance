/* ============================================================
   SÉANCE v2 — L'ACCÈS AU SERVEUR

   Toutes les tables du v2 refusent l'écriture directe : chaque
   action passe par une fonction SECURITY DEFINER qui vérifie le
   propriétaire avant d'agir. Ce module n'est donc qu'une façade
   au-dessus de rpc().

   On réutilise la couche réseau existante, qui sait déjà
   réessayer les coupures transitoires.
   ============================================================ */

import { appelSecurise, rpc, sessionLocale } from "./supabase-client.js?v=becf21cb";

/* ---------- l'état courant, tenu en mémoire ---------- */
const V2 = {
  cinemaId: null,
  etat: null,
  offre: null,
  journeeId: null
};

/* Un appel qui renvoie soit la donnée, soit une erreur lisible.
   Les fonctions serveur renvoient {erreur:"CODE"} plutôt que de
   lever : on distingue donc la panne réseau du refus métier. */
async function appel(nom, params = {}){
  const r = await appelSecurise(() => rpc(nom, params), {rechargeApresErreur:false});
  if(!r.ok) return {erreur:"RESEAU", message:r.message};
  const d = r.data;
  if(d && d.erreur) return d;
  return {ok:true, data:d};
}

/* ---------- lecture ---------- */

async function chargeEtat(){
  if(!V2.cinemaId){
    const c = await monCinema();
    if(!c) return null;
  }
  const r = await appel("v2_etat", {p_cinema_id: V2.cinemaId});
  if(r.erreur) return null;
  V2.etat = r.data;
  V2.journeeId = r.data.journee_en_cours || null;
  return r.data;
}

/* Le cinéma du joueur, ou null s'il n'en a pas encore : c'est ce
   qui décide entre l'écran de création et le jeu. */
async function monCinema(){
  const r = await appelSecurise(
    () => requeteTable("v2_cinemas?select=id,nom,jour&limit=1"),
    {rechargeApresErreur:false});
  if(!r.ok || !Array.isArray(r.data) || r.data.length === 0) return null;
  V2.cinemaId = r.data[0].id;
  return r.data[0];
}

/* lecture directe d'une table protégée par RLS */
async function requeteTable(chemin){
  const s = sessionLocale();
  const rep = await fetch(
    "https://zpfkekiavlfphialvphi.supabase.co/rest/v1/" + chemin, {
      headers: {
        apikey: SB_ANON,
        Authorization: "Bearer " + (s?.access_token || SB_ANON),
        Accept: "application/json"
      }
    });
  if(!rep.ok) throw new Error("HTTP " + rep.status);
  return rep.json();
}
const SB_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpwZmtla2lhdmxmcGhpYWx2cGhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU3Mjc4MzIsImV4cCI6MjEwMTMwMzgzMn0.ORa4y_AMjuWbxboKm3o6Jn7ryYjkOm4mSgLa2Schv98";

async function chargeOffre(){
  const r = await appel("v2_offre", {p_cinema_id: V2.cinemaId});
  if(r.erreur) return null;
  V2.offre = r.data;
  return r.data;
}

async function chargePostesInstallation(){
  return requeteTable("v2_installation_postes?select=*&order=ordre");
}

async function chargeSeancesDuJour(){
  if(!V2.journeeId) return [];
  return requeteTable(
    "v2_seances?journee_id=eq." + V2.journeeId +
    "&select=id,heure,salle_id,sortie_id,spectateurs,refuses&order=heure");
}

async function previsionJournee(){
  if(!V2.journeeId) return null;
  const r = await appel("v2_prevision_journee", {p_journee_id: V2.journeeId});
  return r.erreur ? null : r.data;
}

async function bilan(journeeId){
  const r = await appel("v2_bilan", {p_journee_id: journeeId || V2.journeeId});
  return r.erreur ? null : r.data;
}

async function constructionsPossibles(){
  const r = await appel("v2_constructions_possibles", {p_cinema_id: V2.cinemaId});
  return r.erreur ? null : r.data;
}

/* ---------- actions ---------- */

async function creerCinema(nom, quartier, postes){
  const r = await appel("v2_creer_cinema",
    {p_nom: nom, p_quartier: quartier, p_postes: postes});
  if(r.ok) V2.cinemaId = r.data.cinema_id;
  return r;
}

const signerLicence = (sortieId, duree) =>
  appel("v2_signer_licence",
    {p_cinema_id: V2.cinemaId, p_sortie_id: sortieId, p_duree: duree ?? null});

const rendreLicence = (licenceId) =>
  appel("v2_rendre_licence", {p_licence_id: licenceId});

const poserSeance = (salleId, sortieId, heure) =>
  appel("v2_poser_seance", {p_cinema_id: V2.cinemaId, p_salle_id: salleId,
                            p_sortie_id: sortieId, p_heure: heure});

const retirerSeance = (seanceId) =>
  appel("v2_retirer_seance", {p_seance_id: seanceId});

const peutOuvrir = () =>
  appel("v2_peut_ouvrir", {p_cinema_id: V2.cinemaId});

/* L'ouverture est irréversible : elle fige les séances, encaisse,
   use les salles, fait bouger les étoiles et vieillir les films. */
async function ouvrirLesPortes(){
  const j = V2.journeeId;
  if(!j) return {erreur:"AUCUNE_JOURNEE"};
  const r = await appel("v2_cloture_journee", {p_journee_id: j});
  if(r.ok) await chargeEtat();
  return r;
}

const nettoyer   = (salleId) => appel("v2_nettoyer", {p_salle_id: salleId});
const reparer    = (salleId) => appel("v2_reparer",  {p_salle_id: salleId});
const agrandir   = (salleId) => appel("v2_agrandir", {p_salle_id: salleId});
const apercuAgrandissement = (salleId) =>
  appel("v2_apercu_agrandissement", {p_salle_id: salleId});
const ameliorer  = (salleId, equipement) =>
  appel("v2_ameliorer", {p_salle_id: salleId, p_equipement: equipement});
const construire = (type, nom) =>
  appel("v2_construire_salle", {p_cinema_id: V2.cinemaId, p_type: type, p_nom: nom ?? null});
const embaucher  = (poste) =>
  appel("v2_embaucher", {p_cinema_id: V2.cinemaId, p_poste: poste});
const congedier  = (id) => appel("v2_congedier", {p_personnel_id: id});
const reapprovisionner = (montant) =>
  appel("v2_reapprovisionner", {p_cinema_id: V2.cinemaId, p_montant: montant});
const reviserTarifs = (t) =>
  appel("v2_reviser_tarifs", {p_cinema_id: V2.cinemaId,
    p_plein: t.plein, p_etudiant: t.etudiant, p_senior: t.senior,
    p_enfant: t.enfant, p_matinee: t.matinee});

/* ---------- messages d'erreur ---------- */
/* Les codes du serveur sont faits pour le code, pas pour le
   joueur. On les traduit ici, une bonne fois. */
const MESSAGES = {
  RESEAU:                     "La connexion a lâché. Réessayez.",
  CINEMA_NON_AUTORISE:        "Ce cinéma n'est pas le vôtre.",
  CINEMA_EXISTANT:            "Vous avez déjà un cinéma.",
  BUDGET_DEPASSE:             "Vous dépassez les quinze mille euros.",
  NOM_VIDE:                   "Il faut un nom à votre cinéma.",
  SALLE_TROP_PETITE:          "Votre salle est trop petite pour ce film.",
  DECOUVERT_REFUS_DISTRIBUTEUR:"À découvert, le distributeur ne vous confie plus les gros titres.",
  DEJA_SIGNE:                 "Vous avez déjà ce film à l'affiche.",
  FILM_RETIRE:                "Ce film n'est plus en exploitation.",
  LICENCE_MANQUANTE:          "Il faut d'abord signer la licence.",
  CRENEAU_OCCUPE:             "Une autre séance occupe déjà ce créneau.",
  HEURE_IMPOSSIBLE:           "On ne projette pas à cette heure-là.",
  SALLE_EN_TRAVAUX:           "La salle est en travaux.",
  SALLE_FERMEE:               "Cette salle est fermée.",
  ENGAGEMENT_EN_COURS:        "Le distributeur vous engage encore quelques jours.",
  ENGAGEMENT_NON_TENU:        "Il manque des séances imposées par le distributeur.",
  AUCUNE_SEANCE:              "Programmez au moins une séance avant d'ouvrir.",
  TRESORERIE_INSUFFISANTE:    "Votre trésorerie n'y suffit pas.",
  REPUTATION_INSUFFISANTE:    "Votre réputation ne le permet pas encore.",
  MAXIMUM_ATTEINT:            "Huit salles, c'est le maximum.",
  NIVEAU_MAXIMUM:             "Cet équipement est déjà au maximum.",
  TAILLE_MAXIMUM:             "La salle ne peut pas grandir davantage.",
  DEJA_PROPRE:                "La salle est déjà propre.",
  DEJA_EN_ETAT:               "La salle est en bon état.",
  REVISION_VERROUILLEE:       "Vos tarifs sont fixés pour quelques jours encore.",
  TARIF_HORS_BORNES:          "Un tarif doit rester entre 4 et 30 €.",
  PAS_DE_COMPTOIR:            "Vous n'avez pas de comptoir.",
  DEJA_JOUEE:                 "Cette journée est déjà close.",
  POSTE_OBLIGATOIRE:          "Ce poste ne peut pas être supprimé."
};
function messageErreurV2(r){
  if(!r || !r.erreur) return "";
  const base = MESSAGES[r.erreur] || "Quelque chose n'a pas fonctionné.";
  /* certaines erreurs portent le détail qui aide vraiment */
  if(r.erreur === "SALLE_TROP_PETITE" && r.requis)
    return `Ce film demande ${r.requis} places, votre plus grande salle en a ${r.salle ?? r.disponible}.`;
  if(r.erreur === "TRESORERIE_INSUFFISANTE" && r.cout)
    return `Il vous manque ${Math.round(r.cout - (r.disponible ?? 0))} €.`;
  if(r.erreur === "REVISION_VERROUILLEE" && r.dans_jours)
    return `Prochaine révision dans ${r.dans_jours} jour(s).`;
  if(r.erreur === "CRENEAU_OCCUPE" && r.par)
    return `${r.par} occupe déjà ce créneau à ${r.a}.`;
  if(r.erreur === "ENGAGEMENT_EN_COURS" && r.libre_au_jour)
    return `Vous êtes engagé jusqu'au jour ${r.libre_au_jour}.`;
  return base;
}

export {
  V2, appel, chargeEtat, monCinema, chargeOffre, chargePostesInstallation,
  chargeSeancesDuJour, previsionJournee, bilan, constructionsPossibles,
  creerCinema, signerLicence, rendreLicence, poserSeance, retirerSeance,
  peutOuvrir, ouvrirLesPortes, nettoyer, reparer, agrandir,
  apercuAgrandissement, ameliorer, construire, embaucher, congedier,
  reapprovisionner, reviserTarifs, messageErreurV2, requeteTable
};
