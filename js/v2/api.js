/* ============================================================
   SÉANCE v2 — L'ACCÈS AU SERVEUR

   Toutes les tables du v2 refusent l'écriture directe : chaque
   action passe par une fonction SECURITY DEFINER qui vérifie le
   propriétaire avant d'agir. Ce module n'est donc qu'une façade
   au-dessus de rpc().

   On réutilise la couche réseau existante, qui sait déjà
   réessayer les coupures transitoires.
   ============================================================ */

/* ------------------------------------------------------------
   COUCHE RÉSEAU AUTONOME

   Le v2 n'emprunte rien au v1 : supabase-client.js tire toute la
   chaîne de l'ancien jeu — état global, authentification,
   navigation — et nous allons le supprimer. Ce module se suffit
   donc à lui-même : une clé, une session, un fetch qui réessaie.
   ------------------------------------------------------------ */

const SB_URL = "https://zpfkekiavlfphialvphi.supabase.co";
const SB_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpwZmtla2lhdmxmcGhpYWx2cGhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU3Mjc4MzIsImV4cCI6MjEwMTMwMzgzMn0.ORa4y_AMjuWbxboKm3o6Jn7ryYjkOm4mSgLa2Schv98";
const DELAI = 12000;

function sessionLocale(){
  try{ return JSON.parse(localStorage.getItem("rex_session") || "null"); }
  catch(e){ return null; }
}

function entetes(){
  const s = sessionLocale();
  return {
    "apikey": SB_ANON,
    "Authorization": "Bearer " + (s?.access_token || SB_ANON),
    "Content-Type": "application/json",
    "Accept": "application/json"
  };
}

/* Une coupure de réseau n'est pas une panne : sur un téléphone,
   une requête rate régulièrement pour des raisons qui n'ont rien
   à voir avec le jeu. On réessaie deux fois avant d'abandonner. */
async function reseau(url, options = {}, essai = 0){
  const ctrl = new AbortController();
  const minuteur = setTimeout(() => ctrl.abort(), DELAI);
  let rep;
  try{
    rep = await fetch(url, {...options, headers: entetes(), signal: ctrl.signal});
  }catch(e){
    clearTimeout(minuteur);
    const transitoire = e.name === "AbortError" || e.name === "TypeError";
    if(transitoire && essai < 2){
      await new Promise(r => setTimeout(r, 400 * Math.pow(2, essai)));
      return reseau(url, options, essai + 1);
    }
    throw e;
  }
  clearTimeout(minuteur);
  if(rep.status >= 500 && essai < 2){
    await new Promise(r => setTimeout(r, 400 * Math.pow(2, essai)));
    return reseau(url, options, essai + 1);
  }
  if(!rep.ok){
    const t = await rep.text().catch(() => "");
    throw new Error("HTTP " + rep.status + " " + t.slice(0, 120));
  }
  if(rep.status === 204) return null;
  return rep.json();
}

const rpc = (nom, params) =>
  reseau(SB_URL + "/rest/v1/rpc/" + nom, {method:"POST", body: JSON.stringify(params || {})});

/* lecture d'une table, protégée par RLS côté serveur */
const requeteTable = (chemin) => reseau(SB_URL + "/rest/v1/" + chemin);

/* même contrat que l'ancien appelSecurise : {ok, data} ou {ok:false, message} */
async function appelSecurise(operation){
  try{ return {ok:true, data: await operation()}; }
  catch(e){ return {ok:false, message: e.message || "réseau"}; }
}

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
  const r = await appelSecurise(() => rpc(nom, params));
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
    () => requeteTable("v2_cinemas?select=id,nom,jour&limit=1"));
  if(!r.ok || !Array.isArray(r.data) || r.data.length === 0) return null;
  V2.cinemaId = r.data[0].id;
  return r.data[0];
}


async function chargeOffre(){
  const r = await appel("v2_offre", {p_cinema_id: V2.cinemaId});
  if(r.erreur) return null;
  V2.offre = r.data;
  return r.data;
}

async function chargePostesInstallation(){
  return requeteTable("v2_installation_postes?select=*&order=ordre");
}

/* Le prix du niveau suivant, pour chaque équipement. Sans lui, le
   joueur touche « améliorer » sans savoir ce que ça coûte — et
   découvre la dépense une fois qu'elle est faite. */
async function chargeTarifsEquipement(){
  const l = await requeteTable(
    "v2_tarifs_equipement?select=equipement,niveau,cout,nom&order=equipement,niveau");
  const m = {};
  for(const t of l){
    (m[t.equipement] = m[t.equipement] || {})[t.niveau] = {cout:Number(t.cout), nom:t.nom};
  }
  return m;
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

/* Le monde tourne même quand le joueur ne joue pas : des films
   sortent aux dates prévues. On rattrape au chargement, sinon un
   titre réservé reste à zéro jusqu'à la prochaine clôture. */
/* Toutes les salles en chantier : on n'est pas fautif, on est en
   travaux. Faire relâche fait passer la journée — les charges
   tombent quand même, comme dans la vraie vie. */
const faireRelache = () =>
  appel("v2_faire_relache", {p_cinema_id: V2.cinemaId});

const synchronise = () =>
  appel("v2_synchronise", {p_cinema_id: V2.cinemaId});

/* Ce que le compte doit expliquer : d'où viennent les étoiles,
   combien de spectateurs couvrent les charges, et ce qui arrive
   dans les jours à venir. */
const decompteEtoiles = () =>
  appel("v2_decompte_etoiles", {p_cinema_id: V2.cinemaId});
const seuilRentabilite = () =>
  appel("v2_seuil", {p_cinema_id: V2.cinemaId});
/* La confiserie : deuxième pilier du métier, longtemps calculé
   sans jamais être montré ni pilotable. */
/* Ce qu'une salle produit et ce que son état lui coûte : les
   jauges seules ne disaient pas s'il fallait agrandir, équiper
   ou simplement nettoyer. */
const sallesDetail = () =>
  appel("v2_salles_detail", {p_cinema_id: V2.cinemaId});

const confiserieEtat = () =>
  appel("v2_confiserie_etat", {p_cinema_id: V2.cinemaId});
const installerComptoir = () =>
  appel("v2_installer_comptoir", {p_cinema_id: V2.cinemaId});
const ameliorerConfiserie = (quoi) =>
  appel("v2_ameliorer_confiserie", {p_cinema_id: V2.cinemaId, p_quoi: quoi});

const echeances = () =>
  appel("v2_echeances", {p_cinema_id: V2.cinemaId});

/* L'historique des journées closes, pour la courbe. */
async function historique(n){
  return requeteTable("v2_journees?statut=eq.jouee"
    + "&select=jour,spectateurs,refuses,recette_guichet,resultat"
    + "&order=jour.desc&limit=" + (n || 30));
}

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
  PAS_ENCORE_SORTI:           "Ce film n'est pas encore sorti.",
  LICENCE_MANQUANTE:          "Il faut d'abord signer la licence.",
  CRENEAU_OCCUPE:             "Une autre séance occupe déjà ce créneau.",
  HEURE_IMPOSSIBLE:           "On ne projette pas à cette heure-là.",
  SALLE_EN_TRAVAUX:           "La salle est en travaux.",
  TOUT_EN_TRAVAUX:            "Toutes vos salles sont en chantier.",
  SEANCES_PROGRAMMEES:        "Retirez vos séances avant de faire relâche.",
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
  COMPTOIR_EXISTANT:          "Vous avez déjà un comptoir.",
  RESERVE_PLEINE:             "Votre réserve est pleine.",
  DEJA_INSTALLE:              "C'est déjà installé.",
  AMELIORATION_INCONNUE:      "Cette amélioration n'existe pas.",
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
  if(r.erreur === "SALLE_EN_TRAVAUX" && r.rouvre_au_jour)
    return `La salle rouvre au jour ${r.rouvre_au_jour}.`;
  if(r.erreur === "PAS_ENCORE_SORTI" && r.dans_jours)
    return `La copie arrive dans ${r.dans_jours} jour(s), au jour ${r.jour_sortie}.`;
  if(r.erreur === "CRENEAU_OCCUPE" && r.par)
    return `${r.par} occupe déjà ce créneau à ${r.a}.`;
  if(r.erreur === "ENGAGEMENT_EN_COURS" && r.libre_au_jour)
    return `Vous êtes engagé jusqu'au jour ${r.libre_au_jour}.`;
  return base;
}

export {
  V2, appel, chargeEtat, monCinema, chargeOffre, chargePostesInstallation,
  chargeSeancesDuJour, previsionJournee, bilan, constructionsPossibles,
  chargeTarifsEquipement, creerCinema, signerLicence, rendreLicence, poserSeance, retirerSeance,
  peutOuvrir, synchronise, faireRelache, ouvrirLesPortes,
  decompteEtoiles, seuilRentabilite, echeances, historique,
  confiserieEtat, installerComptoir, ameliorerConfiserie, sallesDetail, nettoyer, reparer, agrandir,
  apercuAgrandissement, ameliorer, construire, embaucher, congedier,
  reapprovisionner, reviserTarifs, messageErreurV2, requeteTable
};
