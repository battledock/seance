/* Niveaux, XP, déblocages, missions. */

import { activeConfiserieSiBesoin, inaugurationConfiserie } from "./data/concessions.js?v=2ab9afab";
import { chargePersonnalisation } from "./data/customization.js?v=2ab9afab";
import { AMELIORATIONS } from "./data/upgrades.js?v=2ab9afab";
import { Etat } from "./game-state.js?v=2ab9afab";
import { rpc, sbFetch } from "./supabase-client.js?v=2ab9afab";
import { celebreNiveau } from "./ui/celebration.js?v=2ab9afab";
import { echappe } from "./ui/emblems.js?v=2ab9afab";
import { icone } from "./ui/icons.js?v=2ab9afab";

/* ------------------------------------------------------------
   LE NOM DU CINÉMA
   Les textes de progression disaient « Le Rex » — le nom du jeu,
   pas celui du joueur. Un patron dont la salle s'appelle Le Club
   lisait « Le Rex devient un complexe » et ne s'y reconnaissait pas.
   ------------------------------------------------------------ */
/* un libellé peut être une chaîne ou une fonction qui dépend du cinéma */
function texteLibelle(v){
  return typeof v === "function" ? v() : (v || "");
}

function nomDuCinema(){
  const n = (Etat && Etat.cinema && Etat.cinema.nom || "").trim();
  return n || "Ton cinéma";
}

/* ============================================================
   PROGRESSION — niveaux, XP, déblocages, montée de niveau
   Extensible : ajouter des entrées dans NIVEAUX suffit (11 → 50).
   ============================================================ */

const NIVEAUX = [
  {n:1,  xp:0,    titre:"La première séance", recompenses:[
    {cle:"programmation",  ic:"pellicule", nom:"Programmation des séances", desc:"Choisis films, horaires et prix", auto:true},
    {cle:"salle_standard", ic:"fauteuil",  nom:"Une salle standard",        desc:"60 places, un projecteur, beaucoup d'espoir", auto:true}]},
  {n:2,  xp:100,  titre:"Le nom s'allume",        recompenses:[
    {cle:"enseigne",       ic:"batiment",  nom:"Personnalisation de l'enseigne", desc:"Change le nom et le style lumineux"},
    {cle:"affiche_3",      ic:"pellicule", nom:"Troisième vitrine",              desc:"Un emplacement d'affiche de plus sur la façade"}]},
  {n:3,  xp:250,  titre:"Le hall prend vie",       recompenses:[
    {cle:"deco_hall",      ic:"etoile",    nom:"Personnalisation du hall",       desc:"Plantes, cadres, tapis, comptoir"},
    {cle:"deco_salle_1",   ic:"etoile",    nom:"Décoration de salle I",          desc:"Cadres et affiches anciennes en salle"}]},
  {n:4,  xp:450,  titre:"Un peu de confort",        recompenses:[
    {cle:"confort_1",      ic:"fauteuil",  nom:"Confort I",                      desc:"Fauteuils restaurés · +4 satisfaction"},
    {cle:"couleurs_sieges",ic:"etoile",    nom:"Couleurs de fauteuils",          desc:"Velours rouge, bordeaux, bleu nuit, vert bouteille"}]},
  {n:5,  xp:700,  titre:"La confiserie",        recompenses:[
    {cle:"confiserie",     ic:"billet",    nom:"La confiserie",                  desc:"Popcorn et boissons : une nouvelle caisse qui sonne"}],
    ceremonie:"Inauguration de la confiserie"},
  {n:6,  xp:1000, titre:"Le trottoir s'anime",        recompenses:[
    {cle:"deco_exterieur", ic:"maison",    nom:"Décors extérieurs",              desc:"Bancs, lampadaires, pots de fleurs, guirlande"},
    {cle:"ventilation_1",  ic:"outil",     nom:"Ventilation I",                  desc:"Achetable en salle · moins d'incidents de chaleur"},
    {cle:"extension_1",    ic:"batiment",  nom:"Première extension",             desc:"+10 places dans une salle"}]},
  {n:7,  xp:1350, titre:"Nouvelle façade",          recompenses:[
    {cle:"facade_couleurs",ic:"outil",     nom:"Peinture de façade",             desc:"Bleu nuit, vert impérial, crème, art déco"},
    {cle:"deco_salle_2",   ic:"etoile",    nom:"Décoration de salle II",         desc:"Moulures art déco en salle"}]},
  {n:8,  xp:1750, titre:"Nouveaux genres",    recompenses:[
    {cle:"genre_comedie",  ic:"pellicule", nom:"Genre : Comédie",                desc:"Nouveaux films au catalogue"},
    {cle:"genre_romance",  ic:"pellicule", nom:"Genre : Romance",                desc:"Nouveaux films au catalogue"}]},
  {n:9,  xp:2200, titre:"L'image retrouve son éclat",  recompenses:[
    {cle:"ecran_sup",      ic:"camera",    nom:"Écran restauré",                 desc:"+3 satisfaction · +1 réputation possible"}]},
  {n:10, xp:2700, titre:"Deux salles",        recompenses:[
    {cle:"salle_2",        ic:"fauteuil",  nom:"Deuxième salle",                 desc:"Un vrai complexe : deux salles à programmer"},
    {cle:"creneaux_6",     ic:"horloge",   nom:"Six créneaux par jour",          desc:"Davantage de séances, davantage de spectateurs"},
    {cle:"plaque_quartier",ic:"etoile",    nom:"Plaque « Cinéma reconnu »",      desc:"Récompense exclusive à réclamer", reclamer:true}],
    ceremonie:"Ouverture de la deuxième salle", palier:true},
  {n:11, xp:3250,  titre:"Glacier",           recompenses:[
    {cle:"confiserie_2",   ic:"billet",    nom:"Glaces et boissons fraîches",    desc:"La confiserie s'agrandit · marges en hausse"}]},
  {n:12, xp:3850,  titre:"Recruteur",         recompenses:[
    {cle:"equipe_caissier",ic:"spectateurs",nom:"Engager un caissier",           desc:"Les files avancent · satisfaction en hausse"}]},
  {n:13, xp:4500,  titre:"Affichiste",        recompenses:[
    {cle:"affiche_4",      ic:"pellicule", nom:"Quatrième vitrine",              desc:"Encore une affiche sur la façade"},
    {cle:"affiche_perso",  ic:"etoile",    nom:"Affiches personnalisées",        desc:"Dessine les affiches de tes propres films"}]},
  {n:14, xp:5200,  titre:"Sonorisateur",      recompenses:[
    {cle:"son_surround",   ic:"cloche",    nom:"Son surround",                   desc:"Niveau de son maximal débloqué"}]},
  {n:15, xp:5950,  titre:"Animateur",         recompenses:[
    {cle:"soirees_theme",  ic:"etoile",    nom:"Soirées à thème",                desc:"Nuit du frisson, marathon comédie : gros pics de fréquentation"}],
    ceremonie:"Première soirée à thème"},
  {n:16, xp:6750,  titre:"Curateur",          recompenses:[
    {cle:"genre_docu",     ic:"pellicule", nom:"Genre : Documentaire",           desc:"Public fidèle, petites salles bien remplies"},
    {cle:"genre_anim",     ic:"pellicule", nom:"Genre : Animation",              desc:"Les familles arrivent le mercredi"}]},
  {n:17, xp:7600,  titre:"Éclairagiste",      recompenses:[
    {cle:"neons_facade",   ic:"outil",     nom:"Néons animés",                   desc:"La façade s'anime la nuit · attire les passants"}]},
  {n:18, xp:8500,  titre:"Confiseur II",      recompenses:[
    {cle:"confiserie_3",   ic:"billet",    nom:"Nachos et bonbons",              desc:"Le comptoir déborde · nouvelle source de revenus"}]},
  {n:19, xp:9450,  titre:"Panoramique",       recompenses:[
    {cle:"ecran_pano",     ic:"camera",    nom:"Écran panoramique",              desc:"Format large · attrait des séances en hausse"}]},
  {n:20, xp:10450, titre:"Exploitant",        recompenses:[
    {cle:"salle_3",        ic:"fauteuil",  nom:"Troisième salle",                desc:"Trois programmations en parallèle"},
    {cle:"creneaux_8",     ic:"horloge",   nom:"Huit créneaux par jour",         desc:"Séances du matin et de la nuit"}],
    ceremonie:"Ouverture de la troisième salle", palier:true},
  {n:21, xp:12025, titre:"Chef de cabine",    recompenses:[
    {cle:"equipe_projo",   ic:"camera",    nom:"Engager un projectionniste",     desc:"Fini les bobines à l'envers · moins d'incidents"}]},
  {n:22, xp:13675, titre:"Afficheur public",  recompenses:[
    {cle:"marketing_quartier",ic:"journal",nom:"Affichage dans le quartier",     desc:"Campagnes locales · fréquentation en hausse"}]},
  {n:23, xp:15400, titre:"Programmateur II",  recompenses:[
    {cle:"genre_thriller", ic:"pellicule", nom:"Genre : Thriller",               desc:"Séances tardives très demandées"},
    {cle:"genre_western",  ic:"pellicule", nom:"Genre : Western",                desc:"Le quartier a des goûts anciens"}]},
  {n:24, xp:17200, titre:"Cafetier",          recompenses:[
    {cle:"bar_hall",       ic:"billet",    nom:"Bar à l'ancienne",               desc:"Les gens arrivent plus tôt et repartent plus tard"}]},
  {n:25, xp:19075, titre:"Ciné-clubiste",     recompenses:[
    {cle:"cine_club",      ic:"etoile",    nom:"Ciné-club hebdomadaire",         desc:"Un rendez-vous fixe · fidélité en forte hausse"}],
    ceremonie:"Fondation du ciné-club"},
  {n:26, xp:21025, titre:"Producteur",        recompenses:[
    {cle:"studio_pro",     ic:"camera",    nom:"Matériel professionnel",         desc:"Studio : qualité des films nettement supérieure"}]},
  {n:27, xp:23050, titre:"Maître tapissier",  recompenses:[
    {cle:"sieges_club",    ic:"fauteuil",  nom:"Fauteuils club",                 desc:"Confort maximal · satisfaction au plafond"}]},
  {n:28, xp:25150, titre:"Bâtisseur",         recompenses:[
    {cle:"parvis",         ic:"maison",    nom:"Parvis aménagé",                 desc:"Marquise lumineuse et esplanade devant l'entrée"}]},
  {n:29, xp:27325, titre:"Négociateur",       recompenses:[
    {cle:"partenariat",    ic:"piece",     nom:"Partenariat distributeur",       desc:"Locations de films 20 % moins chères"}]},
  {n:30, xp:29575, titre:"Complexe",          recompenses:[
    {cle:"salle_4",        ic:"fauteuil",  nom:"Quatrième salle",                desc:"Un vrai complexe de quartier"},
    {cle:"salle_vip",      ic:"etoile",    nom:"Places premium",                 desc:"Un rang privilégié, vendu plus cher"}],
    ceremonie:() => nomDuCinema() + " devient un complexe", palier:true},
  {n:31, xp:31900, titre:"Hôte",              recompenses:[
    {cle:"equipe_accueil", ic:"spectateurs",nom:"Agent d'accueil",               desc:"Personne ne se perd · satisfaction en hausse"}]},
  {n:32, xp:34300, titre:"Éclectique",        recompenses:[
    {cle:"genre_musical",  ic:"pellicule", nom:"Genre : Musical",                desc:"Le public chante en sortant. Bob aussi."},
    {cle:"genre_fantastique",ic:"pellicule",nom:"Genre : Fantastique",           desc:"Créatures, mondes, budgets délirants"}]},
  {n:33, xp:36775, titre:"Directeur de casting",recompenses:[
    {cle:"studio_acteurs", ic:"etoile",    nom:"Acteurs connus",                 desc:"Tes films attirent bien au-delà du quartier"}]},
  {n:34, xp:39325, titre:"Restaurateur",      recompenses:[
    {cle:"lustre",         ic:"etoile",    nom:"Le grand lustre restauré",       desc:"La pièce d'origine, retrouvée au grenier"}]},
  {n:35, xp:41950, titre:"Découvreur",        recompenses:[
    {cle:"avant_premieres",ic:"pellicule", nom:"Avant-premières",                desc:"Les films avant tout le monde · réputation en flèche"}],
    ceremonie:"Première avant-première"},
  {n:36, xp:45910, titre:"Styliste",          recompenses:[
    {cle:"facade_styles",  ic:"outil",     nom:"Styles de façade",               desc:"Art déco, moderne, classique : change tout l'extérieur"}]},
  {n:37, xp:49980, titre:"Restaurateur II",   recompenses:[
    {cle:"confiserie_4",   ic:"billet",    nom:"Menus et formules",              desc:"Panier moyen en forte hausse"}]},
  {n:38, xp:54160, titre:"Ingénieur du son",  recompenses:[
    {cle:"son_dolby",      ic:"cloche",    nom:"Son immersif",                   desc:"Les murs tremblent · attrait maximal"}]},
  {n:39, xp:58450, titre:"Conservateur",      recompenses:[
    {cle:"fresques",       ic:"etoile",    nom:"Fresques d'origine",             desc:"Les peintures murales de 1932, dégagées"}]},
  {n:40, xp:62850, titre:"Grand exploitant",  recompenses:[
    {cle:"salle_5",        ic:"fauteuil",  nom:"Cinquième salle",                desc:"Le Rex n'a plus rien d'un cinéma de quartier"},
    {cle:"creneaux_10",    ic:"horloge",   nom:"Dix créneaux par jour",          desc:"Séances en continu, du matin à l'aube"}],
    ceremonie:() => "Cinq salles à " + nomDuCinema(), palier:true},
  {n:41, xp:67360, titre:"Régisseur",         recompenses:[
    {cle:"equipe_regie",   ic:"outil",     nom:"Régisseur général",              desc:"Travaux deux fois plus rapides"}]},
  {n:42, xp:71980, titre:"Cinéphile",         recompenses:[
    {cle:"genre_noir",     ic:"pellicule", nom:"Genre : Film noir",              desc:"Imperméables, pluie, trahisons"},
    {cle:"genre_culte",    ic:"pellicule", nom:"Genre : Science-fiction culte",  desc:"Séances de minuit, public déguisé"}]},
  {n:43, xp:76710, titre:"Réalisateur",       recompenses:[
    {cle:"studio_exterieur",ic:"camera",   nom:"Tournages en extérieur",         desc:"Le quartier entier devient un décor"}]},
  {n:44, xp:81550, titre:"Panoramiste",       recompenses:[
    {cle:"terrasse",       ic:"maison",    nom:"Terrasse sur le toit",           desc:"Projections en plein air l'été"}]},
  {n:45, xp:86500, titre:"Festivalier",       recompenses:[
    {cle:"festival",       ic:"etoile",    nom:"Festival du quartier",           desc:"Une semaine par an · affluence record"}],
    ceremonie:"Naissance du festival"},
  {n:46, xp:91560, titre:"Projectionniste d'art",recompenses:[
    {cle:"ecran_geant",    ic:"camera",    nom:"Écran géant",                    desc:"La plus grande toile de la ville"}]},
  {n:47, xp:96730, titre:"Distributeur",      recompenses:[
    {cle:"studio_distrib", ic:"piece",     nom:"Distribution nationale",         desc:"Tes films sortent dans d'autres cinémas · revenus passifs"}]},
  {n:48, xp:102010,titre:"Monument",          recompenses:[
    {cle:"classement",     ic:"batiment",  nom:"Salle classée",                  desc:"Le Rex entre au patrimoine · réputation permanente"}]},
  {n:49, xp:107400,titre:"Passeur",           recompenses:[
    {cle:"ecole",          ic:"spectateurs",nom:"École de cinéma",               desc:"Tu formes la relève · bonus sur toute la production"}]},
  {n:50, xp:112900,titre:"Palace",            recompenses:[
    {cle:"palace",         ic:"etoile",    nom:"Le palace du quartier",     desc:"Tout est débloqué. Le vieux cinéma est devenu une légende."}],
    ceremonie:() => nomDuCinema() + " est une légende", palier:true}
];

/* ---- gains d'XP par action ---- */
const XP = {
  seance:        15,   /* programmer une séance */
  spectateur:    1,    /* par spectateur accueilli */
  salle_pleine:  50,   /* une salle complète sur une séance */
  amelioration:  30,   /* amélioration d'une salle */
  nouvelle_salle:150,
  film_produit:  80,
  objectif:      120,
  succes:        200
};

/* ---- lecture de l'état ---- */
function niveauActuel(){ return Etat.progression?.niveau || 1; }
function xpActuel(){ return Etat.progression?.xp || 0; }
function infoNiveau(n){ return NIVEAUX.find(x=>x.n===n) || NIVEAUX[NIVEAUX.length-1]; }
function seuilNiveau(n){ const i = NIVEAUX.find(x=>x.n===n); return i ? i.xp : Infinity; }
function niveauMax(){ return NIVEAUX[NIVEAUX.length-1].n; }

/* progression vers le niveau suivant, en % */
function progressionVersSuivant(){
  const n = niveauActuel();
  if(n >= niveauMax()) return {pct:100, reste:0, borneBas:seuilNiveau(n), borneHaut:seuilNiveau(n)};
  const bas = seuilNiveau(n), haut = seuilNiveau(n+1);
  const pct = Math.max(0, Math.min(100, ((xpActuel()-bas) / (haut-bas)) * 100));
  return {pct, reste: Math.max(0, haut - xpActuel()), borneBas:bas, borneHaut:haut};
}

/* API centrale : une récompense est-elle acquise à ce niveau ? */
function estDebloque(cleRecompense, niveauJoueur){
  const n = niveauJoueur ?? niveauActuel();
  return NIVEAUX.some(niv => niv.n <= n && niv.recompenses.some(r => r.cle === cleRecompense));
}
/* raccourci historique, conservé : utilise le niveau courant */
function debloque(cle){ return estDebloque(cle); }
/* toutes les récompenses acquises */
function recompensesAcquises(niveauJoueur){
  const n = niveauJoueur ?? niveauActuel();
  return NIVEAUX.filter(niv=>niv.n<=n).flatMap(niv=>niv.recompenses.map(r=>({...r, niveau:niv.n})));
}
function recompenseParCle(cle){
  for(const niv of NIVEAUX){
    const r = niv.recompenses.find(x=>x.cle===cle);
    if(r) return {...r, niveau:niv.n};
  }
  return null;
}
/* à quel niveau une fonctionnalité arrive-t-elle ? */
function niveauDe(cle){
  const niv = NIVEAUX.find(x => x.recompenses.some(r => r.cle === cle));
  return niv ? niv.n : null;
}

/* ---- chargement / création ---- */
async function chargeProgression(force = false){
  if(Etat.progression && !force){ /* déjà chargé */ }
  try{
    const d = await sbFetch(`progression?cinema_id=eq.${Etat.cinema.id}&select=*`);
    if(Array.isArray(d) && d.length){ Etat.progression = d[0]; return d[0]; }
    const res = await sbFetch("progression", {method:"POST", body:{cinema_id:Etat.cinema.id, niveau:1, xp:0, evenements:[]}});
    Etat.progression = (Array.isArray(res) && res[0]) || {niveau:1, xp:0, evenements:[]};
  }catch(e){ Etat.progression = Etat.progression || {niveau:1, xp:0, evenements:[]}; }
  if(!Array.isArray(Etat.progression.evenements)) Etat.progression.evenements = [];
  return Etat.progression;
}

/* ============================================================
   ÉVÉNEMENTS D'XP — chaque événement n'est compté qu'UNE fois.
   Empêche de gagner de l'XP en supprimant puis recréant des séances.
   Les montants sont à 0 pour l'instant : la distribution sera activée
   à l'étape « simulation de journée ».
   ============================================================ */
const EVENEMENTS_XP = {
  PROGRAMME_VALIDE:            {xp:0, unique:"jour",  libelle:"Programme composé"},
  PREMIERE_SEANCE_PROGRAMMEE:  {xp:0, unique:"global",libelle:"Première séance programmée"},
  TROIS_SEANCES_PROGRAMMEES:   {xp:0, unique:"global",libelle:"Trois séances le même jour"},
  NOUVEAU_FILM_PROGRAMME:      {xp:0, unique:"valeur",libelle:"Nouveau film à l'affiche"}
};

/* clé stockée : "PROGRAMME_VALIDE:j4" (par jour), "NOUVEAU_FILM_PROGRAMME:film_003" (par valeur) */
function cleEvenement(nom, valeur){
  const e = EVENEMENTS_XP[nom]; if(!e) return nom;
  if(e.unique === "jour")   return nom + ":j" + (Etat.cinema?.jour || 1);
  if(e.unique === "valeur") return nom + ":" + (valeur ?? "");
  return nom;
}
function evenementDejaFait(nom, valeur){
  return (Etat.progression?.evenements || []).includes(cleEvenement(nom, valeur));
}
async function declencheEvenement(nom, valeur){
  const e = EVENEMENTS_XP[nom];
  if(!e || evenementDejaFait(nom, valeur)) return false;
  const p = Etat.progression || (Etat.progression = {niveau:1, xp:0, evenements:[]});
  p.evenements = [...(p.evenements||[]), cleEvenement(nom, valeur)];
  try{
    await sbFetch(`progression?cinema_id=eq.${Etat.cinema.id}`,
      {method:"PATCH", body:{evenements:p.evenements}, prefer:"return=minimal"});
  }catch(err){}
  if(e.xp > 0) await gagneXP(e.xp, e.libelle);
  return true;
}

/* ---- gain d'XP : cœur du système ---- */
async function gagneXP(montant, raison){
  if(!montant || montant <= 0) return;
  const avant = niveauActuel();
  const p = Etat.progression || (Etat.progression = {niveau:1, xp:0});
  p.xp += Math.round(montant);

  /* montées de niveau en cascade */
  const gagnes = [];
  while(p.niveau < niveauMax() && p.xp >= seuilNiveau(p.niveau + 1)){
    p.niveau++;
    gagnes.push(infoNiveau(p.niveau));
  }
  /* l'XP officielle est écrite par le serveur ; ici on ne fait qu'afficher */

  bulleXP(montant, raison);
  majBarreXPHeader();
  /* les niveaux s'affichent dans l'ordre, sans écraser les paliers intermédiaires */
  for(const niv of gagnes){
    await montreMonteeNiveau(niv);
    try{ await synchroniseDeblocages(); }catch(e){}
    if(niv.recompenses.some(r=>r.cle === "confiserie") && typeof activeConfiserieSiBesoin === "function"){
      const ouvert = await activeConfiserieSiBesoin();
      if(ouvert && typeof inaugurationConfiserie === "function") inaugurationConfiserie();
    }
  }
  return {avant, apres:p.niveau, gagnes};
}

/* petite bulle « +15 XP » qui monte */
function bulleXP(montant, raison){
  const d = document.createElement("div");
  d.className = "bulleXP";
  d.innerHTML = `<b>+${Math.round(montant)} XP</b>${raison?`<small>${raison}</small>`:""}`;
  document.body.appendChild(d);
  setTimeout(()=>d.remove(), 2200);
}

/* ---- son de réussite (WebAudio, sans fichier) ---- */
function sonNiveau(){
  try{
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const notes = [523.25, 659.25, 783.99, 1046.5];   /* do mi sol do */
    notes.forEach((f,i)=>{
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "triangle"; o.frequency.value = f;
      const t = ctx.currentTime + i*0.13;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(.22, t+0.03);
      g.gain.exponentialRampToValueAtTime(.001, t+0.55);
      o.connect(g); g.connect(ctx.destination);
      o.start(t); o.stop(t+0.6);
    });
    setTimeout(()=>ctx.close(), 1600);
  }catch(e){}
}

/* ---- phrases de Bob, une par niveau ---- */
const BOB_NIVEAUX = {
  2:"Niveau 2 ! Tu peux enfin toucher à l'enseigne. La mienne clignotait en morse, c'était pas voulu.",
  3:"Niveau 3 ! Le hall va pouvoir respirer. J'ai une plante en plastique depuis 1994, elle a survécu à tout.",
  4:"Niveau 4 ! Des sièges corrects. Le rang 12 va devoir apprendre à se taire.",
  5:"Niveau 5 ! LA CONFISERIE. Patron, c'est là que le cinéma gagne vraiment sa vie. Et moi mon popcorn.",
  6:"Niveau 6 ! Des bancs, des lampadaires… les gens vont attendre dehors sans râler. Révolution.",
  7:"Niveau 7 ! On repeint la façade. J'ai des idées. Beaucoup d'idées. Certaines sont raisonnables.",
  8:"Niveau 8 ! Comédie et romance au catalogue. Le quartier va pleurer et rire le même soir.",
  9:"Niveau 9 ! Un vrai écran. On va enfin voir les visages, pas juste des formes qui parlent.",
  10:"Niveau 10 ! UNE DEUXIÈME SALLE. Je répète : DEUX. SALLES. J'ai la larme à l'œil, c'est la poussière.",
  11:"Niveau 11 ! Des glaces. Je teste la qualité chaque soir. C'est mon métier.",
  12:"Niveau 12 ! Un caissier ! Je ne suis plus seul. Enfin, je surveille quand même.",
  13:"Niveau 13 ! Tes propres affiches. Je pose si tu veux. Gratuitement. Enfin, presque.",
  14:"Niveau 14 ! Le son vient de partout maintenant. Même de derrière. Surtout de derrière.",
  15:"Niveau 15 ! Les soirées à thème ! J'ai déjà mon costume. Ne demande pas lequel.",
  16:"Niveau 16 ! Documentaires et animation. Les mercredis vont être bruyants. Dans le bon sens.",
  17:"Niveau 17 ! Des néons ! La rue entière saura qu'on est ouverts. Les voisins aussi.",
  18:"Niveau 18 ! Nachos. Le sol va coller pendant dix ans. Ça vaut le coup.",
  19:"Niveau 19 ! Écran panoramique. On voit enfin les acteurs jusqu'aux épaules.",
  20:"Niveau 20 ! TROIS SALLES. Je vais devoir courir. Je cours mal. Mais je cours.",
  21:"Niveau 21 ! Un vrai projectionniste. Je garde la cabine en cas de doute. Ou de nostalgie.",
  22:"Niveau 22 ! On affiche dans tout le quartier. Même chez le boucher. Il a négocié deux places.",
  23:"Niveau 23 ! Thriller et western. Le quartier va dormir mal et marcher les jambes arquées.",
  24:"Niveau 24 ! Un bar. Dans MON hall. J'ai attendu ça vingt ans.",
  25:"Niveau 25 ! Le ciné-club ! Tous les jeudis. J'ai déjà préparé mon discours d'ouverture. Il fait 40 minutes.",
  26:"Niveau 26 ! Du vrai matériel. Ma caméra à manivelle part à la retraite. Avec les honneurs.",
  27:"Niveau 27 ! Fauteuils club. Les gens vont s'endormir. C'est le prix du confort.",
  28:"Niveau 28 ! Un parvis ! On peut faire la queue avec dignité maintenant.",
  29:"Niveau 29 ! Le distributeur nous fait des prix. J'ai juste souri beaucoup. Ça a marché.",
  30:"Niveau 30 ! QUATRE SALLES. On n'est plus un cinéma de quartier, patron. On est une institution.",
  31:"Niveau 31 ! Un agent d'accueil. Plus personne ne se perdra en cherchant les toilettes.",
  32:"Niveau 32 ! Musicals et fantastique. Je chante déjà. Personne ne m'a demandé.",
  33:"Niveau 33 ! Des acteurs connus dans NOS films. J'ai un petit rôle. Muet. Mais un rôle.",
  34:"Niveau 34 ! Le grand lustre ! Il était au grenier depuis 1961. Il pesait une tonne. Littéralement.",
  35:"Niveau 35 ! Des avant-premières. On voit les films avant les autres. Je ne dirai rien. Promis.",
  36:"Niveau 36 ! On peut tout repeindre. Toute la façade. J'ai encore des idées. Toujours.",
  37:"Niveau 37 ! Des menus. Les gens mangent un repas complet devant un film. C'est ça, le progrès.",
  38:"Niveau 38 ! Le son fait trembler les murs. Le rang 12 a définitivement cédé. Paix à lui.",
  39:"Niveau 39 ! Les fresques de 1932 ! Elles étaient sous huit couches de peinture beige. Huit.",
  40:"Niveau 40 ! CINQ SALLES. Je me souviens quand tu es arrivé, avec ta clé et ton air perdu.",
  41:"Niveau 41 ! Un régisseur. Les travaux vont deux fois plus vite. Je supervise toujours, évidemment.",
  42:"Niveau 42 ! Film noir et séances de minuit. Le public vient déguisé. Moi aussi. Toujours.",
  43:"Niveau 43 ! On tourne dans la rue. Le boulanger veut être figurant. Il a un texte de six lignes.",
  44:"Niveau 44 ! Une terrasse ! Du cinéma en plein air l'été. Sous les étoiles. Les vraies, cette fois.",
  45:"Niveau 45 ! UN FESTIVAL. Notre festival. Le quartier a son nom sur les affiches.",
  46:"Niveau 46 ! L'écran le plus grand de la ville. On voit les pores. C'est peut-être trop.",
  47:"Niveau 47 ! Nos films passent ailleurs. Ailleurs ! Des gens qu'on ne connaît pas nous regardent.",
  48:() => "Niveau 48 ! " + nomDuCinema() + " est classé. Personne ne pourra jamais le démolir. Jamais.",
  49:"Niveau 49 ! Une école. Des gamins vont apprendre ici. Comme moi, en son temps. En pire.",
  50:() => "Niveau 50. Patron… regarde ce qu'on a fait. " + nomDuCinema()
        + ". Une légende. Merci."
};
function phraseBob(n){
  /* certains messages dépendent du nom du cinéma : ce sont des fonctions */
  return texteLibelle(BOB_NIVEAUX[n])
    || `Niveau ${n} ! Le cinéma monte, et moi je suis toujours là. Fidèle comme le rang 12.`;
}

/* ---- fenêtre de montée de niveau ---- */
/* La montée de niveau passe par la grande cérémonie visuelle.
   L'ancienne carte reste en secours si le module n'est pas chargé. */
function montreMonteeNiveau(niv){
  if(typeof celebreNiveau === "function") return celebreNiveau(niv);
  return montreMonteeNiveauSimple(niv);
}

function montreMonteeNiveauSimple(niv){
  return new Promise(resolve=>{
    sonNiveau();
    const o = document.createElement("div");
    o.className = "voileNiveau";
    o.innerHTML = `
      <div class="carteNiveau ${niv.palier?'palier':''}">
        <div class="rayons"></div>
        <div class="niveauChiffre"><span>NIVEAU</span><b>${niv.n}</b></div>
        <div class="niveauTitre">${niv.titre}</div>
        ${niv.ceremonie ? `<div class="niveauCeremonie">${echappe(texteLibelle(niv.ceremonie))}</div>` : ""}
        <div class="niveauBob">
          <span class="bobRond"><svg viewBox="30 40 60 60">
            <circle cx="60" cy="70" r="26" fill="#f0c9a0"/>
            <path d="M40 78 Q50 86 60 79 Q70 86 80 78 Q72 92 60 84 Q48 92 40 78" fill="#4a3527"/>
            <path d="M44 60 Q51 55 57 59 M63 59 Q69 55 76 60" stroke="#4a3527" stroke-width="4" fill="none" stroke-linecap="round"/>
            <circle cx="51" cy="66" r="2.6" fill="#1c1210"/><circle cx="69" cy="66" r="2.6" fill="#1c1210"/>
            <path d="M34 56 Q60 34 86 56 L86 50 Q60 28 34 50 Z" fill="#571520"/>
            <rect x="52" y="44" width="16" height="7" rx="2" fill="#e8b84b"/>
          </svg></span>
          <span class="bobDit">${phraseBob(niv.n)}</span>
        </div>
        ${niv.recompenses.length ? `
          <div class="titreRecompenses">Débloqué</div>
          <div class="listeRecompenses">
            ${niv.recompenses.map((r,i)=>`
              <div class="recompense" style="animation-delay:${.35 + i*.18}s">
                ${icone(r.ic)}
                <span><b>${r.nom}</b><small>${r.desc}</small></span>
              </div>`).join("")}
          </div>` : ""}
        <button class="btnOr btnNiveau">${niv.recompenses.length ? "Découvrir" : "Continuer"}</button>
      </div>`;
    document.body.appendChild(o);
    o.querySelector(".btnNiveau").onclick = ()=>{
      o.classList.add("sortie");
      setTimeout(()=>{ o.remove(); resolve(); }, 320);
    };
  });
}

/* ---- barre d'XP dans le header ---- */
function majBarreXPHeader(){
  const b = document.getElementById("xpBarre");
  const n = document.getElementById("xpNiv");
  if(!b) return;
  const p = progressionVersSuivant();
  b.style.width = p.pct + "%";
  if(n) n.textContent = "niv " + niveauActuel();
}


/* ============================================================
   REGISTRE DES DÉBLOCAGES (player_unlocks)
   Permet de savoir ce qui a été attribué, vu, réclamé.
   Sert aussi de rattrapage pour les parties antérieures.
   ============================================================ */
async function chargeDeblocages(){
  try{
    const d = await sbFetch(`deblocages?cinema_id=eq.${Etat.cinema.id}&select=*`);
    Etat.deblocages = Array.isArray(d) ? d : [];
  }catch(e){ Etat.deblocages = Etat.deblocages || []; }
  return Etat.deblocages;
}
function deblocageEnregistre(cle){
  return (Etat.deblocages||[]).find(d=>d.cle===cle);
}

/* crée les entrées manquantes pour le niveau actuel — idempotent */
async function synchroniseDeblocages(){
  await chargeDeblocages();
  const attendues = recompensesAcquises();
  const manquantes = attendues.filter(r=>!deblocageEnregistre(r.cle));
  if(manquantes.length === 0) return [];
  for(const r of manquantes){
    try{
      await sbFetch("deblocages", {method:"POST", prefer:"return=minimal", body:{
        cinema_id: Etat.cinema.id, user_id: Etat.session?.user_id,
        cle: r.cle, niveau: r.niveau,
        vu_le: null, reclame_le: r.reclamer ? null : new Date().toISOString()
      }});
      Etat.deblocages.push({cle:r.cle, niveau:r.niveau, reclame_le:r.reclamer?null:new Date().toISOString()});
    }catch(e){}   /* 409 = déjà présent */
  }
  return manquantes;
}

/* récompenses à réclamer, non encore prises */
function recompensesAReclamer(){
  return recompensesAcquises().filter(r=>r.reclamer && !(deblocageEnregistre(r.cle)?.reclame_le));
}
async function reclameRecompense(cle){
  const r = recompenseParCle(cle);
  if(!r || !r.reclamer) return false;
  const d = deblocageEnregistre(cle);
  if(d?.reclame_le) return false;
  try{
    const rep = await rpc("reclamer_recompense", {p_cinema_id: Etat.cinema.id, p_cle: cle});
    if(!rep?.success) return false;
    if(d) d.reclame_le = new Date().toISOString();
    await chargePersonnalisation();
    return true;
  }catch(e){ return false; }
}

/* ============================================================
   MISSIONS DE DÉCOUVERTE — une par déblocage majeur, non répétables
   ============================================================ */
const MISSIONS = [
  {cle:"m_sieges",     niveau:4,  xp:20,  titre:"Restaurer les fauteuils",          dep:"confort_1",       url:"salles.html"},
  {cle:"m_popcorn",    niveau:5,  xp:30,  titre:"Vendre 20 popcorns",               dep:"confiserie",      url:"jeu.html"},
  {cle:"m_comedie",    niveau:8,  xp:25,  titre:"Programmer une comédie",           dep:"genre_comedie",   url:"programmation.html"},
  {cle:"m_ecran",      niveau:9,  xp:20,  titre:"Restaurer l'écran",                dep:"ecran_sup",       url:"salles.html"},
  {cle:"m_salle2",     niveau:10, xp:100, titre:"Construire la deuxième salle",     dep:"salle_2",         url:"salles.html"}
];
function missionsOuvertes(){
  return MISSIONS.filter(m=>estDebloque(m.dep) && !missionFaite(m.cle));
}
function missionFaite(cle){ return (Etat.missionsFaites||[]).includes(cle); }

async function chargeMissions(){
  try{
    const d = await sbFetch(`xp_events?cinema_id=eq.${Etat.cinema.id}&type=eq.mission&select=cle_unique`);
    Etat.missionsFaites = (Array.isArray(d)?d:[]).map(x=>String(x.cle_unique).split(":").pop());
  }catch(e){ Etat.missionsFaites = Etat.missionsFaites || []; }
  return Etat.missionsFaites;
}

/* valide une mission une seule fois (protégée par xp_events.cle_unique) */
async function accomplitMission(cle){
  const m = MISSIONS.find(x=>x.cle===cle);
  if(!m || missionFaite(cle)) return false;
  let r;
  try{ r = await rpc("accomplir_mission", {p_cinema_id: Etat.cinema.id, p_mission: cle}); }
  catch(e){ return false; }
  if(!r?.success) return false;
  Etat.missionsFaites = [...(Etat.missionsFaites||[]), cle];
  await chargeProgression(true);
  majBarreXPHeader();
  bulleXP(r.data.xp, "Mission");
  toastMission(m);
  const avant = r.data.niveau_avant, apres = r.data.niveau;
  for(let n = avant + 1; n <= apres; n++){
    await montreMonteeNiveau(infoNiveau(n));
    await synchroniseDeblocages().catch(()=>null);
  }
  return true;
}
function toastMission(m){
  const d = document.createElement("div");
  d.className = "toastMission";
  d.innerHTML = `${icone("etoile")}<span><b>Mission accomplie</b>${m.titre}</span><span class="tmXp">+${m.xp} XP</span>`;
  document.body.appendChild(d);
  setTimeout(()=>d.remove(), 3600);
}

/* ============================================================
   LES DÉBLOCAGES RÉELS

   La table NIVEAUX décrit ce qu'on VOULAIT offrir. Elle a été
   écrite d'un bloc, puis les mécaniques ont bougé sans elle :
   sur soixante-sept récompenses annoncées, neuf seulement
   conditionnaient quelque chose, et quatre paliers d'équipement
   sur sept indiquaient un niveau faux — le son immersif était
   annoncé au 38, il arrive au 19.

   On cesse donc de recopier. Chaque déblocage est désormais LU
   là où il est réellement décidé :

     · les équipements   → AMELIORATIONS, champ niveauJoueurRequis
     · les salles        → les tarifs de construction
     · les genres        → le catalogue du jour, film le moins exigeant
     · la 4DX            → son propre palier

   Ce qui n'a de mécanique nulle part est marqué « prévu » et
   présenté comme tel : un horizon annoncé, pas une promesse.
   ============================================================ */

/* ce que l'on obtient EXACTEMENT à ce niveau — rien de promis */
function deblocagesDuNiveau(n){
  return deblocagesReels().filter(d => Number(d.niv) === Number(n));
}

/* les récompenses qui existent vraiment, avec leur palier exact */
function deblocagesReels(){
  const out = [];

  /* 1. les équipements de salle
     On parcourt TOUS les paliers, pas seulement ceux qui ont une
     clé de progression : la climatisation n'en avait aucune, ses
     trois paliers disparaissaient de la liste. */
  if(typeof AMELIORATIONS === "object"){
    Object.entries(AMELIORATIONS).forEach(([cleEquip, a])=>{
      (a.niveaux || []).forEach((n, i)=>{
        if(i === 0) return;                       /* le palier de départ */
        const niv = Number(n.niveauJoueurRequis) || 1;
        if(niv <= 1) return;                      /* rien à annoncer */
        const cle = (a.cleProgression || [])[i - 1] || (cleEquip + "_" + i);
        out.push({
          cle, ic: a.icone || "outil",
          nom: n.nom,
          desc: (n.desc || "") + " · " + a.nom + " palier " + i,
          niv, ou: "Salles"
        });
      });
    });
  }

  /* 2. les salles supplémentaires */
  const NIVEAU_SALLE = {2:10, 3:20, 4:30, 5:40};
  const PLACES_SALLE = {2:50, 3:60, 4:70, 5:80};
  Object.entries(NIVEAU_SALLE).forEach(([i, niv])=>{
    out.push({
      cle: "salle_" + i, ic: "fauteuil",
      nom: ["", "", "Deuxième salle", "Troisième salle",
            "Quatrième salle", "Cinquième salle"][i],
      desc: PLACES_SALLE[i] + " places de plus · une programmation en parallèle",
      niv, ou: "Salles"
    });
  });

  /* 3. la salle 4DX */
  out.push({cle:"salle_4dx", ic:"etoile", nom:"Salle 4DX",
    desc:"Fauteuils sur vérins, effets d'eau et de vent · le public accepte 6 € de plus",
    niv:15, ou:"Salles"});

  /* 4. le studio et ses genres de production */
  const st = Array.isArray(Etat?.paliersStudio) ? Etat.paliersStudio : null;
  if(st && st.length){
    const ouverture = Math.min(...st.map(g => Number(g.niveau_requis) || 1));
    out.push({cle:"studio", ic:"camera", nom:"Le studio de production",
      desc:"Tourne tes propres films : scénario, réalisateur, acteurs, budget",
      niv: ouverture, ou:"Studio"});
    st.forEach(g=>{
      const n = Number(g.niveau_requis) || 1;
      if(n <= ouverture) return;         /* disponible dès l'ouverture */
      out.push({cle:"prod_" + g.cle, ic:"camera",
        nom:"Production : " + g.libelle,
        desc:"Un genre de plus à tourner au studio",
        niv:n, ou:"Studio"});
    });
  }

  /* 4b. les talents du studio, qui arrivent par vagues */
  const tal = Array.isArray(Etat?.talentsStudio) ? Etat.talentsStudio : null;
  if(tal && tal.length){
    const ouverture = Math.min(...tal.map(t => Number(t.niveau_requis) || 1));
    const ROLE = {acteur:"Acteur", realisateur:"Réalisateur", technicien:"Technicien"};
    /* une entrée par palier, pas une par personne : sinon la liste
       se remplit de neuf lignes identiques au même niveau */
    const paliers = {};
    tal.forEach(t=>{
      const n = Number(t.niveau_requis) || 1;
      if(n <= ouverture) return;
      paliers[n] = paliers[n] || [];
      paliers[n].push(t);
    });
    Object.entries(paliers).forEach(([n, gens])=>{
      const roles = [...new Set(gens.map(g => ROLE[g.role] || g.role))];
      const vedette = gens.reduce((a,b)=>
        (Number(b.popularite)||0) > (Number(a.popularite)||0) ? b : a);
      out.push({cle:"talents_" + n, ic:"etoile",
        nom: Number(n) >= 33 ? "Talents de renom" : "Talents confirmés",
        desc: roles.join(", ") + " — " + vedette.nom
              + (Number(vedette.popularite) > 40 ? ", un nom qui remplit les salles" : ""),
        niv: Number(n), ou:"Studio"});
    });
  }

  /* 4c. les campagnes d'affichage */
  const camps = Etat?.campagnes && Array.isArray(Etat.campagnes.formules)
    ? Etat.campagnes.formules : null;
  if(camps && camps.length){
    const paliers = {};
    camps.forEach(f=>{ (paliers[f.niveau_requis] = paliers[f.niveau_requis] || []).push(f); });
    Object.entries(paliers).forEach(([n, fs])=>{
      out.push({cle:"campagne_" + n, ic:"journal",
        nom: fs.length > 1 ? "Campagnes d'affichage" : fs[0].nom,
        desc: fs.map(f => f.nom + " · " + f.cout + " € · " + f.gain).join(" — "),
        niv: Number(n), ou:"Quartier"});
    });
  }

  /* 5. les genres de films, lus dans le catalogue du jour */
  const cat = Array.isArray(Etat?.catalogueJour) ? Etat.catalogueJour : null;
  if(cat && cat.length){
    const parGenre = {};
    cat.forEach(f=>{
      const g = f.genre; if(!g) return;
      const n = Number(f.niveauRequis) || 1;
      if(!parGenre[g] || n < parGenre[g].niv) parGenre[g] = {niv:n, nb:1};
      else parGenre[g].nb += 1;
    });
    Object.entries(parGenre).forEach(([g, v])=>{
      if(v.niv <= 1) return;          /* disponible depuis toujours */
      out.push({cle:"genre_" + g.toLowerCase().replace(/\s+/g,"_"), ic:"pellicule",
        nom:"Genre : " + g, desc:"De nouveaux films au catalogue",
        niv:v.niv, ou:"Programmation"});
    });
  }

  return out.sort((a,b)=>a.niv - b.niv || a.nom.localeCompare(b.nom));
}

/* ---- exports ---- */
export {
  BOB_NIVEAUX,
  EVENEMENTS_XP,
  MISSIONS,
  NIVEAUX,
  XP,
  accomplitMission,
  bulleXP,
  chargeDeblocages,
  chargeMissions,
  chargeProgression,
  cleEvenement,
  deblocageEnregistre,
  deblocagesDuNiveau,
  deblocagesReels,
  debloque,
  declencheEvenement,
  estDebloque,
  evenementDejaFait,
  gagneXP,
  infoNiveau,
  majBarreXPHeader,
  missionFaite,
  missionsOuvertes,
  montreMonteeNiveau,
  montreMonteeNiveauSimple,
  niveauActuel,
  niveauDe,
  niveauMax,
  nomDuCinema,
  phraseBob,
  progressionVersSuivant,
  reclameRecompense,
  recompenseParCle,
  recompensesAReclamer,
  recompensesAcquises,
  seuilNiveau,
  sonNiveau,
  synchroniseDeblocages,
  texteLibelle,
  toastMission,
  xpActuel
};
