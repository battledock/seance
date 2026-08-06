import { Etat } from "../game-state.js?v=2ab9afab";
import { debloque, niveauActuel } from "../progression.js?v=2ab9afab";
import { salles } from "../rooms.js?v=2ab9afab";

/* ============================================================
   CATALOGUE DE FILMS — données fictives, titres originaux
   niveauRequis pilote le verrouillage (voir progression.js)
   duree en MINUTES, popularite/qualite sur 100
   ============================================================ */
const CATALOGUE_FILMS = [
  /* ---------- disponibles dès le niveau 1 ---------- */
  {id:"film_001", titre:"La Nuit des Comètes", genre:"Drame", duree:105, popularite:62, qualite:70,
   coutLicence:120, niveauRequis:1, publicCible:["adultes","seniors"], couleurAffiche:"#7c1c2e",
   resume:"Une nuit étrange bouleverse la vie d'un quartier."},
  {id:"film_002", titre:"Le Phare de Trois-Vents", genre:"Drame", duree:118, popularite:55, qualite:76,
   coutLicence:135, niveauRequis:1, publicCible:["adultes"], couleurAffiche:"#1f3a5c",
   resume:"Un gardien de phare reçoit une lettre vieille de quarante ans."},
  {id:"film_003", titre:"Les Voleurs de Marées", genre:"Aventure", duree:127, popularite:71, qualite:64,
   coutLicence:160, niveauRequis:1, publicCible:["adultes","adolescents"], couleurAffiche:"#1d5c52",
   resume:"Trois frères partent chercher une épave que personne n'a jamais trouvée."},
  {id:"film_004", titre:"Cap sur les Nuages", genre:"Aventure", duree:96, popularite:66, qualite:58,
   coutLicence:110, niveauRequis:1, publicCible:["familles","adolescents"], couleurAffiche:"#b5722a",
   resume:"Un dirigeable, une carte fausse et beaucoup trop d'optimisme."},
  {id:"film_005", titre:"Petit Poulpe", genre:"Animation", duree:84, popularite:78, qualite:72,
   coutLicence:145, niveauRequis:1, publicCible:["familles","enfants"], couleurAffiche:"#4a3f8c",
   resume:"Un poulpe timide traverse l'océan pour retrouver sa famille."},
  {id:"film_006", titre:"La Fabrique à Nuages", genre:"Animation", duree:79, popularite:69, qualite:66,
   coutLicence:125, niveauRequis:1, publicCible:["enfants","familles"], couleurAffiche:"#2e7a8c",
   resume:"Dans une usine oubliée, deux enfants apprennent à fabriquer la pluie."},
  {id:"film_007", titre:"Calanques", genre:"Documentaire", duree:82, popularite:44, qualite:81,
   coutLicence:70, niveauRequis:1, publicCible:["adultes","seniors"], couleurAffiche:"#2a6b6b",
   resume:"Un an de lumière et de roche, filmé au ras de l'eau."},
  {id:"film_008", titre:"Ceux du Marché", genre:"Documentaire", duree:74, popularite:38, qualite:77,
   coutLicence:60, niveauRequis:1, publicCible:["seniors","adultes"], couleurAffiche:"#6b5a2a",
   resume:"Quatre commerçants, une halle, cinquante ans d'histoires."},
  {id:"film_009", titre:"L'Escalier B", genre:"Thriller familial", duree:99, popularite:73, qualite:68,
   coutLicence:150, niveauRequis:1, publicCible:["familles","adolescents"], couleurAffiche:"#3a2a52",
   resume:"Quelqu'un monte l'escalier chaque nuit. Personne ne redescend jamais."},
  {id:"film_010", titre:"Le Secret du Grenier", genre:"Thriller familial", duree:91, popularite:64, qualite:61,
   coutLicence:115, niveauRequis:1, publicCible:["familles","enfants"], couleurAffiche:"#52301f",
   resume:"Une malle fermée, une clé perdue, un été qui ne finit pas."},

  /* ---------- niveau 8 : comédie et romance ---------- */
  {id:"film_011", titre:"Tonton fait du Ski", genre:"Comédie", duree:92, popularite:80, qualite:59,
   coutLicence:180, niveauRequis:8, publicCible:["familles","adultes"], couleurAffiche:"#c07a1f",
   resume:"Il n'a jamais vu de neige. Cela se remarque dès la première minute."},
  {id:"film_012", titre:"Le Balcon d'en Face", genre:"Romance", duree:111, popularite:76, qualite:73,
   coutLicence:190, niveauRequis:8, publicCible:["adultes"], couleurAffiche:"#a83a5c",
   resume:"Deux voisins, un balcon, quinze ans de retard."},
  {id:"film_013", titre:"La Fille du Kiosque", genre:"Romance", duree:98, popularite:70, qualite:69,
   coutLicence:170, niveauRequis:8, publicCible:["adultes","seniors"], couleurAffiche:"#8c3a6b",
   resume:"Elle vend des journaux. Il achète le même chaque jour, sans savoir lire."},

  /* ---------- déblocages plus tardifs ---------- */
  {id:"film_014", titre:"Impasse de la Pluie", genre:"Film noir", duree:104, popularite:74, qualite:84,
   coutLicence:230, niveauRequis:42, publicCible:["adultes"], couleurAffiche:"#22262e",
   resume:"Il pleut du début à la fin, et personne ne dit la vérité."},
  {id:"film_015", titre:"Poussière d'Ouest", genre:"Western", duree:128, popularite:58, qualite:75,
   coutLicence:200, niveauRequis:23, publicCible:["adultes","seniors"], couleurAffiche:"#8c5a2a",
   resume:"Un cheval, un chapeau, trois répliques."},
  {id:"film_016", titre:"La Fanfare du Port", genre:"Musical", duree:115, popularite:82, qualite:71,
   coutLicence:240, niveauRequis:32, publicCible:["familles","adultes"], couleurAffiche:"#b53a4a",
   resume:"Tout le quartier chante, y compris ceux qui ne devraient pas."},
  {id:"film_017", titre:"La Tour Sans Fin", genre:"Fantastique", duree:141, popularite:86, qualite:78,
   coutLicence:300, niveauRequis:32, publicCible:["adolescents","adultes"], couleurAffiche:"#3a2a6b",
   resume:"Elle monte, monte, monte. Le budget aussi."},
  {id:"film_018", titre:"Planète Beta 9", genre:"Culte", duree:96, popularite:90, qualite:52,
   coutLicence:260, niveauRequis:42, publicCible:["adolescents","adultes"], couleurAffiche:"#1f5c3a",
   resume:"Séance de minuit. Le public récite les dialogues à voix haute."}
];

/* ============================================================
   HORAIRES — grille de départ, extensible par la progression
   ============================================================ */
const HORAIRES_BASE = ["10h00","13h00","15h30","18h00","20h30","23h00"];
const HORAIRES_TOT  = ["08h30"];                 /* creneaux_8 */
const HORAIRES_NUIT = ["01h00","03h00"];         /* creneaux_10 */

/* structure prête pour des horaires personnalisés plus tard */
function horairesDisponibles(){
  let h = [...HORAIRES_BASE];
  if(typeof debloque === "function"){
    if(debloque("creneaux_8"))  h = [...HORAIRES_TOT, ...h];
    if(debloque("creneaux_10")) h = [...HORAIRES_TOT, ...HORAIRES_BASE, ...HORAIRES_NUIT];
  }
  return [...new Set(h)].sort(compareHeures);
}

/* ---------- utilitaires horaires ---------- */
function heureEnMinutes(h){                       /* "18h00" → 1080 */
  const m = String(h).match(/(\d{1,2})h(\d{2})/);
  return m ? parseInt(m[1],10)*60 + parseInt(m[2],10) : 0;
}
function minutesEnHeure(min){                     /* 1185 → "19h45" */
  const m = ((min % 1440) + 1440) % 1440;
  return String(Math.floor(m/60)).padStart(2,"0") + "h" + String(m%60).padStart(2,"0");
}
function compareHeures(a,b){ return heureEnMinutes(a) - heureEnMinutes(b); }
function fmtDuree(min){
  const h = Math.floor(min/60), m = min%60;
  return h ? (h + "h" + String(m).padStart(2,"0")) : (m + " min");
}

const NETTOYAGE_MIN = 20;                         /* temps de remise en état */
/* ------------------------------------------------------------
   RETROUVER UN FILM PAR SON IDENTIFIANT

   CATALOGUE_FILMS est une liste figée de dix-huit titres, écrite
   avant que le catalogue serveur n'en compte cinquante-trois. Un
   film récent n'y figurait pas : le chercher là revenait à ne rien
   trouver — le clic sortait en silence, et les lignes du programme
   comme le bilan affichaient un identifiant brut.

   On interroge donc d'abord ce que le serveur a envoyé pour
   aujourd'hui : il porte les vraies popularités, licences et
   niveaux requis. La liste figée ne sert plus que de secours,
   quand le serveur n'a rien dit.
   ------------------------------------------------------------ */
function filmParId(id){
  if(String(id).startsWith("maison_") && Array.isArray(Etat?.filmsMaisonCat))
    return Etat.filmsMaisonCat.find(f=>f.id===id);

  /* On ne va PAS chercher la page de programmation : elle importe
     déjà ce fichier, et l'inverse créerait un cycle d'imports —
     avec des liaisons indéfinies au chargement. Le catalogue du
     jour est déposé dans Etat par game-state, accessible partout. */
  if(Array.isArray(Etat?.catalogueJour)){
    const f = Etat.catalogueJour.find(x=>String(x.id) === String(id));
    if(f) return f;
  }
  return CATALOGUE_FILMS.find(f=>f.id===id);
}
function filmDebloque(f){ return f.maison || (f.niveauRequis||1) <= (typeof niveauActuel==="function" ? niveauActuel() : 1); }

/* limite quotidienne — formule évolutive */
function obtenirLimiteSeances(cinema, salles){
  const base = Math.max(1, (salles||[]).length) * 3;
  let bonus = 0;
  if(typeof debloque === "function"){
    if(debloque("creneaux_6"))  bonus += 1;
    if(debloque("creneaux_8"))  bonus += 1;
    if(debloque("creneaux_10")) bonus += 2;
  }
  return base + bonus;
}

/* durée en heures, lisible : « 3 j 4 h », « 12 h », « 40 min » */
function fmtDureeHeures(h){
  const j = Math.floor(h/24), r = h % 24;
  if(j >= 1) return j + " jour" + (j>1?"s":"") + (r ? " " + r + " h" : "");
  return Math.max(0, h) + " heure" + (h>1?"s":"");
}

/* ---- exports ---- */
export {
  CATALOGUE_FILMS,
  HORAIRES_BASE,
  HORAIRES_NUIT,
  HORAIRES_TOT,
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
};
