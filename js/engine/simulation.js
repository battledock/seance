import { ventesConfiserie } from "../data/concessions.js?v=2ab9afab";
import { compareHeures, filmParId, heureEnMinutes } from "../data/films.js?v=2ab9afab";
import { malusProprete, niveauEquipement, obtenirBonusSalle } from "../data/upgrades.js?v=2ab9afab";
import { salles } from "../rooms.js?v=2ab9afab";

/* ============================================================
   SIMULATION D'UNE JOURNÉE
   ⚠ TEMPORAIRE : tout est calculé côté client pour équilibrer.
   La fonction Supabase `simuler_journee(cinema_id, jour)` prendra
   le relais — voir SQL fourni. Les entrées/sorties sont volontairement
   identiques pour que le basculement soit une simple substitution
   d'appel dans `ouvreCinema()`.
   ============================================================ */

/* ---------- générateur pseudo-aléatoire déterministe (mulberry32) ---------- */
function graineNumerique(str){
  let h = 1779033703 ^ String(str).length;
  for(let i=0;i<String(str).length;i++){
    h = Math.imul(h ^ String(str).charCodeAt(i), 3432918353);
    h = h << 13 | h >>> 19;
  }
  return h >>> 0;
}
function creeRng(graine){
  let a = graineNumerique(graine);
  return function(){
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function entre(rng, min, max){ return min + rng()*(max-min); }

/* ---------- tables d'équilibrage ---------- */
const BONUS_HORAIRES = {
  "08h30":0.42, "10h00":0.55, "11h30":0.60, "13h00":0.70, "13h30":0.72,
  "15h30":0.82, "16h00":0.84, "17h00":0.88, "17h30":0.90, "18h00":0.95,
  "19h00":1.05, "20h00":1.12, "20h30":1.15, "22h15":0.86, "23h00":0.72,
  "00h15":0.52, "01h00":0.40, "02h00":0.30, "03h00":0.22, "09h30":0.48
};
function attractiviteHoraire(heure, film){
  let base = BONUS_HORAIRES[heure] ?? 0.7;
  const h = heureEnMinutes(heure);
  const g = (film.genre||"").toLowerCase();
  /* affinités genre × moment de la journée */
  if(g.includes("animation") && h >= 13*60 && h <= 17*60) base *= 1.22;
  if(g.includes("animation") && h >= 22*60) base *= 0.55;
  if((g.includes("thriller")||g.includes("noir")||g.includes("culte")) && h >= 21*60) base *= 1.20;
  if(g.includes("romance") && h >= 19*60 && h <= 22*60) base *= 1.15;
  if(g.includes("documentaire")) base = base*0.75 + 0.25;      /* plus stable en journée */
  if(g.includes("drame") && h >= 18*60) base *= 1.06;
  return base;
}

const PUBLICS_QUARTIERS = {
  centre:      {familles:.15, etudiants:.20, adultes:.35, seniors:.10, cinephiles:.20},
  residentiel: {familles:.40, etudiants:.08, adultes:.25, seniors:.20, cinephiles:.07},
  etudiant:    {familles:.08, etudiants:.55, adultes:.22, seniors:.05, cinephiles:.10},
  populaire:   {familles:.28, etudiants:.22, adultes:.30, seniors:.12, cinephiles:.08},
  artistique:  {familles:.10, etudiants:.18, adultes:.27, seniors:.10, cinephiles:.35}
};
/* le catalogue utilise des libellés proches : on normalise */
const ALIAS_PUBLIC = {familles:"familles", enfants:"familles", adolescents:"etudiants",
  etudiants:"etudiants", adultes:"adultes", seniors:"seniors", cinephiles:"cinephiles"};

function repartitionPublic(film, cinema){
  const mix = PUBLICS_QUARTIERS[cinema.quartier] || PUBLICS_QUARTIERS.populaire;
  const cibles = [...new Set((film.publicCible||["adultes"]).map(p=>ALIAS_PUBLIC[p]||"adultes"))];
  const parts = {};
  let total = 0;
  cibles.forEach(c=>{ parts[c] = mix[c] || 0.05; total += parts[c]; });
  return {parts, couverture: total};   /* couverture = part de la population visée */
}
function effetQuartier(film, cinema){
  const {couverture} = repartitionPublic(film, cinema);
  /* 0.20 de couverture → 0.86 ; 0.55 → 1.15 */
  return Math.max(.7, Math.min(1.3, 0.72 + couverture*0.8)) * (cinema.mult_frequentation||1);
}

/* facteur global d'équilibrage : un seul curseur pour ajuster toute l'économie */
const CALIBRAGE = 0.78;
const PRIX_RECOMMANDE = 8;
function calculerEffetPrix(prix, prixRecommande = PRIX_RECOMMANDE){
  const d = prix - prixRecommande;
  if(d <= -3) return 1.12;
  if(d <=  2) return 1;
  if(d <=  5) return 0.78;
  if(d <=  8) return 0.50;
  return 0.32;   /* au-delà de 16 €, le quartier boude franchement */
}

/* ---------- événements du jour ---------- */
const EVENEMENTS_JOURNEE = [
  {id:"aucun",    nom:"Journée ordinaire", description:"Rien de particulier. Le quartier vaque à ses affaires.",
   demandeMultiplier:1,    satisfactionModifier:0, poids:34},
  {id:"journal",  nom:"Le journal local parle du cinéma", description:"Un article en page 7, avec une photo floue de Bob.",
   demandeMultiplier:1.08, satisfactionModifier:0, poids:12},
  {id:"pluie",    nom:"Pluie soudaine", description:"Les habitants cherchent une activité à l'abri.",
   demandeMultiplier:1.05, satisfactionModifier:0, poids:12},
  {id:"festival", nom:"Festival dans le quartier", description:"Les rues sont pleines, les curieux poussent la porte.",
   demandeMultiplier:1.06, satisfactionModifier:2, poids:9, bonusCinephiles:1.18},
  {id:"bouche",   nom:"Le bouche-à-oreille fonctionne", description:"On parle de ton cinéma au marché.",
   demandeMultiplier:1.07, satisfactionModifier:1, poids:8},
  {id:"beau",     nom:"Beau temps exceptionnel", description:"Tout le monde est dehors. Personne n'est dedans.",
   demandeMultiplier:0.93, satisfactionModifier:0, poids:12},
  {id:"travaux",  nom:"Travaux dans la rue", description:"Un marteau-piqueur devant l'entrée. Charmant.",
   demandeMultiplier:0.92, satisfactionModifier:-2, poids:8},
  {id:"chauffage",nom:"Panne légère de chauffage", description:"Il fait frais dans la salle. On garde son manteau.",
   demandeMultiplier:1,    satisfactionModifier:-5, poids:5}
];
function tireEvenement(rng){
  const total = EVENEMENTS_JOURNEE.reduce((t,e)=>t+e.poids,0);
  let r = rng()*total;
  for(const e of EVENEMENTS_JOURNEE){ r -= e.poids; if(r<=0) return e; }
  return EVENEMENTS_JOURNEE[0];
}
function evenementParId(id){ return EVENEMENTS_JOURNEE.find(e=>e.id===id) || EVENEMENTS_JOURNEE[0]; }

/* ---------- incidents de séance ---------- */
const INCIDENTS = [
  {id:"son",       texte:"Coupure de son pendant dix minutes. Bob a doublé les dialogues.", satisfaction:-8, recettes:1},
  {id:"siege",     texte:"Un siège a cédé. Le rang 12, évidemment.",                        satisfaction:-5, recettes:1},
  {id:"bruyant",   texte:"Un spectateur a commenté tout le film à voix haute.",             satisfaction:-6, recettes:1},
  {id:"retard",    texte:"Projection en retard de quinze minutes.",                         satisfaction:-7, recettes:0.96},
  {id:"projecteur",texte:"Le projecteur a chauffé. Pause imprévue, entracte improvisé.",    satisfaction:-9, recettes:0.94}
];
const PROBA_INCIDENT = 0.05;

/* ---------- fréquentation d'une séance ---------- */
function calculerSpectateurs({film, salle, cinema, seance, evenement, variation, reputation}){
  const capacite = salle.capacite || 60;
  const populariteFilm  = film.popularite / 100;
  const horaire         = attractiviteHoraire(seance.heure, film);
  const prix            = calculerEffetPrix(Number(seance.prix), PRIX_RECOMMANDE + (obtenirBonusSalle(salle).prixAcceptable||0));
  const effetReputation = 0.65 + (reputation ?? 50) / 200;
  /* bonus centralisés (ameliorations.js) : source unique de vérité */
  const bonus           = obtenirBonusSalle(salle);
  const effetConfort    = 0.86 + niveauEquipement(salle,"sieges") * 0.05;
  const effetEcran      = 0.94 + niveauEquipement(salle,"ecran")  * 0.035;
  const effetSon        = 0.96 + niveauEquipement(salle,"son")    * 0.025;
  const effetProprete   = 0.88 + proprete(salle)/100 * 0.16;
  const effetEtat       = 0.92 + Number(salle.etat ?? 100)/100 * 0.08;
  const effetQ          = effetQuartier(film, cinema);
  let effetEvenement    = evenement.demandeMultiplier;
  if(evenement.bonusCinephiles && (film.publicCible||[]).includes("cinephiles")) effetEvenement *= evenement.bonusCinephiles;
  const effetQualite    = 0.88 + (film.qualite/100) * 0.24;

  const demande = CALIBRAGE * capacite * populariteFilm * horaire * prix * effetReputation
                * effetConfort * effetEcran * effetSon * effetProprete * effetEtat
                * effetQ * effetEvenement * effetQualite * variation;

  return Math.max(0, Math.min(capacite, Math.round(demande)));
}

/* propreté réelle de la salle (entretenue par le joueur) */
function proprete(salle){ return Math.max(0, Math.min(100, Number(salle.proprete ?? 100))); }

/* ---------- satisfaction d'une séance ---------- */
function calculerSatisfaction({film, salle, seance, evenement, incident}){
  /* échelle 0-3 : un équipement d'origine vaut 45/100, le maximum 100 */
  const note = n => 45 + Math.max(0, Math.min(3, n||0)) * 18.33;
  const confort = note(niveauEquipement(salle,"sieges"));
  const ecran   = note(niveauEquipement(salle,"ecran"));
  const son     = note(niveauEquipement(salle,"son"));
  const clim    = note(niveauEquipement(salle,"climatisation"));
  const deco    = note(niveauEquipement(salle,"decoration"));
  const prop    = proprete(salle);
  /* rapport qualité/prix : 100 si prix ≤ recommandé et bon film */
  const attendu = 4 + (film.qualite/100)*10;             /* prix "juste" perçu */
  const rapport = Math.max(0, Math.min(100, 100 - (Number(seance.prix) - attendu)*9));

  let s = film.qualite*0.35 + confort*0.13 + ecran*0.11 + son*0.11
        + clim*0.05 + deco*0.05 + prop*0.10 + rapport*0.10;
  s += evenement.satisfactionModifier || 0;
  s += malusProprete(salle);
  /* la climatisation atténue les événements météo négatifs */
  if((evenement.satisfactionModifier||0) < 0)
    s += Math.abs(evenement.satisfactionModifier) * (obtenirBonusSalle(salle).protectionMeteo||0);
  if(incident) s += incident.satisfaction;
  return Math.max(0, Math.min(100, Math.round(s)));
}

/* ---------- variation de réputation ---------- */
function variationReputation(satMoyenne, salleComplete, incidentMajeur){
  let d = 0;
  if(satMoyenne < 40) d = -3;
  else if(satMoyenne < 60) d = -1;
  else if(satMoyenne < 75) d = 0;
  else if(satMoyenne < 90) d = 1;
  else d = 2;
  if(salleComplete) d += 1;
  if(incidentMajeur) d -= 1;
  return d;
}

/* ============================================================
   SIMULATION COMPLÈTE — déterministe à partir de la graine
   ============================================================ */
function simuleJournee({cinema, salles, seances, reputation, graine}){
  const rng = creeRng(graine);
  const evenement = tireEvenement(rng);

  const resultats = seances
    .slice().sort((a,b)=>compareHeures(a.heure,b.heure))
    .map(s=>{
      const film  = filmParId(s.film_id) || {titre:s.film_id, popularite:40, qualite:50, genre:"Drame", publicCible:["adultes"]};
      const salle = salles.find(x=>String(x.id)===String(s.salle_id)) || {capacite:60, confort:1, ecran:1, son:1, deco:1};
      const variation = entre(rng, .90, 1.10);
      const risque    = obtenirBonusSalle(salle).risqueIncident;
      const incident  = rng() < risque ? INCIDENTS[Math.floor(rng()*INCIDENTS.length)] : null;

      const spectateurs = calculerSpectateurs({film, salle, cinema, seance:s, evenement, variation, reputation});
      const satisfaction = calculerSatisfaction({film, salle, seance:s, evenement, incident});
      const brut = Math.round(spectateurs * Number(s.prix) * (incident ? incident.recettes : 1));
      const licence = Number(s.cout_licence||0);
      const {parts} = repartitionPublic(film, cinema);
      const conf = (typeof ventesConfiserie === "function")
        ? ventesConfiserie(spectateurs, satisfaction, rng) : {articles:0, recettes:0, marge:0, detail:{}};

      /* répartition estimée des spectateurs par public */
      const somme = Object.values(parts).reduce((t,v)=>t+v,0) || 1;
      const publics = {};
      Object.entries(parts).forEach(([k,v])=>{ publics[k] = Math.round(spectateurs * v/somme); });

      return {
        seance_id: s.id, heure: s.heure, film_id: s.film_id, titre: film.titre,
        salle: s.salle, salle_id: s.salle_id, capacite: salle.capacite,
        prix: Number(s.prix), spectateurs, satisfaction,
        brut, licence, net: brut + conf.marge - licence,
        confiserie: conf,
        complete: spectateurs >= salle.capacite,
        incident_id: incident ? incident.id : null,
        incident_texte: incident ? incident.texte : null,
        publics
      };
    });

  const totalSpectateurs = resultats.reduce((t,r)=>t+r.spectateurs, 0);
  const brut    = resultats.reduce((t,r)=>t+r.brut, 0);
  const confRec = resultats.reduce((t,r)=>t+(r.confiserie?.recettes||0), 0);
  const confCout= resultats.reduce((t,r)=>t+((r.confiserie?.recettes||0)-(r.confiserie?.marge||0)), 0);
  const confArt = resultats.reduce((t,r)=>t+(r.confiserie?.articles||0), 0);
  const licences= resultats.reduce((t,r)=>t+r.licence, 0);
  const satMoy  = resultats.length ? Math.round(resultats.reduce((t,r)=>t+r.satisfaction,0)/resultats.length) : 0;
  const complete= resultats.some(r=>r.complete);
  const incidentMajeur = resultats.some(r=>r.incident_id === "projecteur");
  let dRep      = variationReputation(satMoy, complete, incidentMajeur);
  /* écran restauré et belle décoration peuvent ajouter +1, une seule fois par jour */
  const bonusRep = Math.min(1, Math.max(...(salles.length?salles.map(x=>obtenirBonusSalle(x).reputation):[0])));
  if(satMoy >= 70 && bonusRep > 0) dRep += 1;

  const meilleur = resultats.slice().sort((a,b)=>b.satisfaction-a.satisfaction)[0] || null;
  const remplie  = resultats.slice().sort((a,b)=>(b.spectateurs/b.capacite)-(a.spectateurs/a.capacite))[0] || null;

  return {
    evenement, resultats,
    total_spectateurs: totalSpectateurs,
    recettes_brutes: brut,
    recettes_confiserie: confRec,
    cout_confiserie: confCout,
    articles_confiserie: confArt,
    cout_licences: licences,
    benefice_net: brut + confRec - confCout - licences,
    satisfaction_moyenne: satMoy,
    variation_reputation: dRep,
    meilleur_film: meilleur ? meilleur.titre : null,
    seance_plus_remplie: remplie ? remplie.seance_id : null,
    salle_complete: complete
  };
}

/* ---------- commentaire de Bob sur la journée ---------- */
function bobBilan(b, cinema){
  if(b.total_spectateurs === 0)
    return "Personne. Pas un chat. J'ai passé la journée à balayer un hall vide en sifflotant.";
  if(b.benefice_net < 0)
    return "On a perdu de l'argent aujourd'hui. Ça arrive. Baisse un peu les prix, ou vise les créneaux du soir.";
  if(b.satisfaction_moyenne >= 90)
    return "Les gens sont sortis en applaudissant. J'ai failli pleurer dans le popcorn.";
  if(b.satisfaction_moyenne >= 75)
    return "Belle journée, patron. Ils reviendront, et ils amèneront du monde.";
  if(b.satisfaction_moyenne >= 60)
    return "Correct. Personne n'a râlé, personne n'a chanté. C'est déjà ça.";
  return "Bof. Il faudrait soigner le confort, ou choisir des films un peu plus solides.";
}

/* ---------- barème d'XP de la journée ---------- */
const XP_JOURNEE = {
  ouverture:        {montant:10, libelle:"Cinéma ouvert",            unique:"jour"},
  journee_terminee: {montant:20, libelle:"Journée terminée",         unique:"jour"},
  premiere_journee: {montant:40, libelle:"Première journée terminée",unique:"global"},
  par_seance:       {montant:5,  libelle:"Séance jouée",             unique:"seance"},
  salle_complete:   {montant:15, libelle:"Salle complète",           unique:"seance"},
  belle_satisfaction:{montant:10,libelle:"Satisfaction supérieure à 80", unique:"jour"},
  cent_spectateurs: {montant:20, libelle:"100 spectateurs en une journée", unique:"jour"},
  record:           {montant:15, libelle:"Nouveau record de fréquentation", unique:"jour"}
};

/* ---- exports ---- */
export {
  ALIAS_PUBLIC,
  BONUS_HORAIRES,
  CALIBRAGE,
  EVENEMENTS_JOURNEE,
  INCIDENTS,
  PRIX_RECOMMANDE,
  PROBA_INCIDENT,
  PUBLICS_QUARTIERS,
  XP_JOURNEE,
  attractiviteHoraire,
  bobBilan,
  calculerEffetPrix,
  calculerSatisfaction,
  calculerSpectateurs,
  creeRng,
  effetQuartier,
  entre,
  evenementParId,
  graineNumerique,
  proprete,
  repartitionPublic,
  simuleJournee,
  tireEvenement,
  variationReputation
};
