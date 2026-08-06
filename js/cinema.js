/* L'accueil : façade vivante, héros, statut du jour. */

import { phraseFrequentation, phraseNiveau, phraseRecette } from "./ambiance.js?v=2ab9afab";
import { compareHeures, filmParId } from "./data/films.js?v=2ab9afab";
import {
  chargeJournee,
  ouvreCinema,
  passeAuJourSuivant,
  statutJournee,
  verifieOuverture
} from "./engine/day.js?v=2ab9afab";
import { animeLeCinema, bobMeteo } from "./facade/life.js?v=2ab9afab";
import { dessineHallEvolutif } from "./facade/lobby.js?v=2ab9afab";
import { spawnPassant } from "./facade/pedestrians.js?v=2ab9afab";
import { dessineFacadeEvolutive } from "./facade/render.js?v=2ab9afab";
import { animeLaVitalite, remarqueVitalite } from "./facade/vitality.js?v=2ab9afab";
import { Etat, chargeSallesEtat, fmtArgent, statutCinema } from "./game-state.js?v=2ab9afab";
import { bandeauEvenement } from "./pages/parts/events.js?v=2ab9afab";
import { niveauActuel, progressionVersSuivant } from "./progression.js?v=2ab9afab";
import { salles } from "./rooms.js?v=2ab9afab";
import { appelSecurise, rpc, sbFetch } from "./supabase-client.js?v=2ab9afab";
import { echappe, texteSur } from "./ui/emblems.js?v=2ab9afab";
import { A } from "./ui/genre-posters.js?v=2ab9afab";
import { icone } from "./ui/icons.js?v=2ab9afab";
import { salleEnCoupe } from "./ui/room-view.js?v=2ab9afab";

/* Accueil vivant du cinéma (jeu.html) */

const CONSEILS_BOB = [
  "La façade, c'est ton premier film. Les gens la regardent avant d'acheter le billet.",
  "Pense à programmer des séances. Un cinéma sans séance, c'est juste un couloir avec des fauteuils.",
  "Le popcorn se vend mieux quand ça sent le popcorn. Science exacte.",
  "Le quartier parle de toi. En bien pour l'instant. Faisons durer.",
  "Un jour tu produiras tes propres films. J'ai gardé ma caméra au chaud, au cas où.",
  "Balaye entre les rangs 3 et 4. C'est toujours entre les rangs 3 et 4.",
  "La réputation monte lentement et descend vite. Comme moi dans l'escalier de la cabine."
];

const EVENEMENTS_JOUR = [
  {ic:"journal", txt:"Le journal du quartier mentionne ton ouverture."},
  {ic:"cloche", txt:"Un pigeon a tenté d'entrer. Bob a géré. Fièrement."},
  {ic:"spectateurs", txt:"Beau temps : les gens flânent devant la façade."},
  {ic:"billet", txt:"Un enfant a demandé si le cinéma faisait aussi les anniversaires."},
  {ic:"outil", txt:"Bob a nettoyé le hall. Il précise : « à fond »."}
];

let vueCourante = "facade";

async function initAccueil(){
  const c = Etat.cinema;
  try{ await chargeSeancesAccueil(); }catch(e){ Etat.seancesJour = []; }
  try{ await chargeJournee(); }catch(e){}
  try{ await chargeSallesEtat(); }catch(e){}

  /* deux lectures de plus : ce qui sort cette semaine, et ce que
     le cinéma est devenu. Elles ne bloquent pas l'affichage. */
  chargeSorties();
  chargeStyle();

  rendActionPrincipale();
  brancheOnglets();
  rendVueCine();
  rendJournalAccueil();
  rendChiffres();
  rendEvenement();   /* asynchrone : il se remplit quand il peut */

  /* Bob dit une seule chose : l'état du cinéma, ou le temps qu'il fait */
  const surEtat = (typeof remarqueVitalite === "function") ? remarqueVitalite() : null;
  const surMeteo = Math.random() < .3 && typeof bobMeteo === "function";
  parleBob(surEtat && Math.random() < .55 ? surEtat
           : surMeteo ? bobMeteo() : remarqueBob());
  if(typeof bandeauEvenement === "function") bandeauEvenement();

  /* la façade continue de vivre, mais seulement quand on la regarde */
  let phaseCourante = phaseSelonHeure();
  setInterval(()=>{
    const p = phaseSelonHeure();
    if(p !== phaseCourante){ phaseCourante = p; if(vueCourante === "facade") rendVueCine(); }
  }, 60000);
}

/* ------------------------------------------------------------
   LES SORTIES DE LA SEMAINE
   L'information qui donne envie de revenir était enfermée dans
   l'onglet catalogue. Elle remonte ici, en une ligne.
   ------------------------------------------------------------ */
async function chargeSorties(){
  const el = document.getElementById("bandeauSorties");
  if(!el) return;
  const appel = await appelSecurise(
    () => rpc("get_catalogue", {p_cinema_id: Etat.cinema.id}),
    {rechargeApresErreur: false});
  if(!appel.ok || !appel.data || appel.data.success !== true){ el.innerHTML = ""; return; }
  const d = appel.data.data || {};
  const nouv = d.nouveautes || [];
  const suite = d.prochaines_sorties || [];
  const jours = Number(d.jours_avant_sorties);

  /* trois cas : elles viennent d'arriver, elles approchent, ou rien à dire */
  let titre, detail, evenement = false;
  if(nouv.length && jours >= 6){
    evenement = nouv.some(f => f.exceptionnel);
    titre = nouv.length + " nouveauté" + (nouv.length > 1 ? "s" : "") + " à l'affiche";
    detail = nouv.map(f => f.titre).join(" · ");
  }else if(suite.length){
    evenement = suite.some(f => f.exceptionnel);
    titre = jours <= 1 ? "Les sorties arrivent demain"
          : jours + " jours avant les prochaines sorties";
    detail = suite.map(f => f.titre + (f.exceptionnel ? " ★" : "")).join(" · ");
  }else{ el.innerHTML = ""; return; }

  el.innerHTML = `
    <button class="bandeauSorties ${evenement ? "evenement" : ""}"
      onclick="location.href='programmation.html'">
      ${icone("pellicule")}
      <span><b>${echappe(titre)}</b><small>${echappe(detail)}</small></span>
      <span class="bsChev">›</span>
    </button>`;
}

/* ------------------------------------------------------------
   LE STYLE DU CINÉMA
   Ce que le jeu retient de la façon de jouer. Il n'apparaissait
   nulle part alors que c'est le portrait du joueur.
   ------------------------------------------------------------ */
async function chargeStyle(){
  const el = document.getElementById("vueStyle");
  if(!el) return;
  const appel = await appelSecurise(
    () => rpc("get_cinema_memory", {p_cinema_id: Etat.cinema.id}),
    {rechargeApresErreur: false});
  if(!appel.ok || !appel.data || appel.data.success !== true){ el.innerHTML = ""; return; }
  const d = appel.data.data || {};
  /* avant quatre journées observées, le cinéma n'a pas encore de style :
     l'annoncer trop tôt serait faux */
  if(Number(d.jours_observes) < 4){ el.innerHTML = ""; return; }
  el.innerHTML = `<span class="blason">${icone("etoile")}
    ${echappe(d.style_nom || "")}</span>`;
}

/* ---------- les trois vues du cinéma ---------- */
function brancheOnglets(){
  document.querySelectorAll("#vueOnglets button").forEach(b=>{
    b.addEventListener("click", ()=>{
      if(vueCourante === b.dataset.v) return;
      document.querySelectorAll("#vueOnglets button").forEach(x=>{
        x.classList.remove("on"); x.setAttribute("aria-selected","false"); });
      b.classList.add("on"); b.setAttribute("aria-selected","true");
      vueCourante = b.dataset.v;
      placeCurseurVue();
      rendVueCine();
    });
  });
  placeCurseurVue();
  window.addEventListener("resize", placeCurseurVue);

  /* Les polices arrivent après le premier rendu : mesurer avant leur
     chargement donne une largeur fausse, et le curseur déborde de la
     carte. On repositionne quand elles sont prêtes. */
  if(document.fonts && document.fonts.ready)
    document.fonts.ready.then(placeCurseurVue).catch(()=>{});
  requestAnimationFrame(placeCurseurVue);
}

/* le velours glisse d'un onglet à l'autre au lieu de sauter */
function placeCurseurVue(){
  const cur = document.getElementById("vueCurseur");
  const actif = document.querySelector("#vueOnglets button.on");
  if(!cur || !actif) return;
  cur.style.width = actif.offsetWidth + "px";
  cur.style.transform = "translateX(" + actif.offsetLeft + "px)";
}

function rendVueCine(){
  const c = Etat.cinema;
  const cible = document.getElementById("vueCine");
  if(!cible) return;
  const niveau = (typeof niveauActuel === "function") ? niveauActuel() : 1;

  if(vueCourante === "facade"){
    dessineFacade(c, {cible:"vueCine"});
    if(typeof animeLeCinema === "function") animeLeCinema();
    if(typeof animeLaVitalite === "function") animeLaVitalite();
  }
  else if(vueCourante === "hall"){
    cible.innerHTML = dessineHallEvolutif({
      niveau, phase: phaseSelonHeure(),
      confiserie: !!(Etat.confiserie && Etat.confiserie.active),
      boissons: Number(Etat.confiserie?.niveau_boissons || 0),
      salles: (Etat.salles || []).length,
      reputation: Number(c.reputation || 50),
      seances: (Etat.seancesJour || []).slice(0,3)
        .map(s => String(s.heure || "").toUpperCase().replace("H", "H"))
    });
  }
  else{
    const salle = (Etat.salles || [])[0];
    cible.innerHTML = salle && typeof salleEnCoupe === "function"
      ? salleEnCoupe(salle)
      : `<div class="vueVide">Aucune salle construite.</div>`;
  }
  rendEtatVue();
}

/* le bandeau d'état, posé sur la vue */
function rendEtatVue(){
  /* L'état ne tient plus dans une pastille de coin : il se pose sur
     le dessin, dans le dégradé, comme un générique. */
  const el = document.getElementById("surScene");
  if(!el) return;
  const p = etatDuJour();
  const n = (Etat.seancesJour || []).length;
  el.innerHTML = `
    <span class="ssEt">${p.moment}</span>
    <h2>${echappe(p.titre)}</h2>
    <p>${echappe(p.phrase)}</p>`;
}

/* ------------------------------------------------------------
   LE JOURNAL DU MATIN

   Tout ce qu'on a construit — charges, sorties, entretien — se
   retrouvait éparpillé sur trois écrans. Ici il tient en quatre
   lignes, avant la décision.
   ------------------------------------------------------------ */
function rendJournalAccueil(){
  const el = document.getElementById("journalAcc");
  if(!el) return;
  const L = [];

  const m = Etat.journee && Etat.journee.meteo;
  const cat = typeof rex_meteo !== "undefined" ? null : null;
  if(m) L.push({i:"meteo", t: phraseMeteo(m), d:"La demande du jour s'en ressent"});

  const ch = Etat.charges;
  if(ch && Number(ch.total) > 0)
    L.push({i:"piece", t: fmtArgent(ch.total) + " de charges aujourd'hui",
            d: ch.detail || ""});

  const camp = Etat.campagnes && Etat.campagnes.en_cours;
  if(camp) L.push({i:"journal", t: camp.nom + " en cours",
    d: "+" + Math.round((Number(camp.effet) - 1) * 100) + " % de fréquentation · "
       + camp.jours_restants + " jour(s) restant(s)"});

  const sale = (Etat.salles || []).find(s => Number(s.proprete) < 70 || Number(s.etat) < 60);
  if(sale) L.push({i:"batiment", t: sale.nom + " demande un coup de balai",
    d: "Propreté " + Math.round(Number(sale.proprete)) + " % — la satisfaction en pâtira",
    alerte:true});

  if(!L.length) L.push({i:"etoile", t:"Rien à signaler ce matin",
    d:"Le quartier est calme, la salle est prête"});

  el.innerHTML = L.map(l=>`
    <div class="jlAcc ${l.alerte ? "alerte" : ""}">${icone(l.i)}
      <span><b>${echappe(l.t)}</b>${l.d ? `<small>${echappe(l.d)}</small>` : ""}</span>
    </div>`).join("");
}

function phraseMeteo(id){
  return ({clair:"Beau temps sur le quartier", nuages:"Ciel couvert",
    pluie:"Il pleut sur le quartier", vent:"Du vent aujourd'hui",
    brume:"Brume sur le port"})[id] || "Le temps est incertain";
}

/* ce que le cinéma raconte de lui-même, ce soir */
function etatDuJour(){
  const n = (Etat.seancesJour || []).length;
  const st = typeof statutJournee === "function" ? statutJournee() : "draft";
  if(st === "completed") return {moment:"Ce soir", titre:"Les portes sont fermées",
    phrase:"La journée est finie. Le bilan t'attend."};
  if(st === "running") return {moment:"En ce moment", titre:"La séance a commencé",
    phrase:"Le projecteur tourne. On verra le résultat tout à l'heure."};
  if(n === 0) return {moment:"Ce soir", titre:"Rien à l'affiche",
    phrase:"Le marquee est éteint. Le quartier passe devant sans s'arrêter."};
  return {moment:"Ce soir", titre: n + " séance" + (n > 1 ? "s" : "") + " au programme",
    phrase:"Les affiches sont posées. Il ne reste qu'à ouvrir."};
}

/* ---------- les trois chiffres ---------- */
/* L'anneau se remplit en neuf dixièmes de seconde plutôt que
   d'apparaître déjà plein : on voit la valeur arriver. */
function anneauChiffre(pct, couleur){
  const c = Math.max(0, Math.min(100, pct));
  const tour = 106.8;
  return `<svg viewBox="0 0 40 40" aria-hidden="true">
    <circle cx="20" cy="20" r="17" fill="none" stroke="rgba(36,26,18,.1)" stroke-width="3.4"/>
    <circle cx="20" cy="20" r="17" fill="none" stroke="${couleur}" stroke-width="3.4"
      stroke-linecap="round" transform="rotate(-90 20 20)"
      stroke-dasharray="${tour}" stroke-dashoffset="${tour}">
      <animate attributeName="stroke-dashoffset" from="${tour}"
        to="${(tour * (1 - c/100)).toFixed(1)}" dur="0.9s" fill="freeze"
        calcMode="spline" keySplines="0.2 0.9 0.3 1" keyTimes="0;1"/>
    </circle></svg>`;
}

function rendChiffres(){
  const c = Etat.cinema;
  const niveau = (typeof niveauActuel === "function") ? niveauActuel() : 1;
  const versSuivant = (typeof progressionVersSuivant === "function")
    ? Math.round(progressionVersSuivant() * 100) : 0;
  const sat = Number(Etat.journee?.satisfaction_moyenne ?? 0);

  const el0 = document.getElementById("chiffres");
  if(el0) el0.innerHTML = `
    <button class="chiffre" onclick="location.href='profil.html'">
      ${anneauChiffre(Number(c.reputation) || 0, "#8c2331")}
      <b>${Number(c.reputation) || 0}</b><span>Réputation</span></button>
    <button class="chiffre" onclick="location.href='progression.html'">
      ${anneauChiffre(versSuivant, "#c9982f")}
      <b>${niveau}</b><span>Niveau</span></button>
    <button class="chiffre" onclick="location.href='bilan.html'">
      ${anneauChiffre(sat, "#2f7d4a")}
      <b>${sat > 0 ? sat + " %" : "—"}</b><span>Satisfaction</span></button>`;
}


/* ================== FAÇADE VIVANTE (cycle du ciel + programme réel) ================== */
const PHASES = {
  matin:{
    ciel:["#7fb2d9","#b8d8ec","#eef6f2"],
    astre:{type:"soleil", x:78, y:56, r:15, c:"#fff3c2", halo:"#fff3c2"},
    voisins:"#c9bda6", fenVois:"#9ab0bf", fenOp:.5,
    mur:["#b06078","#96485e","#7c3a4e"],
    vitre:["#9cc0da","#c2dcea","#8cb0ca"],
    halo:0, lumieres:false, etoiles:false,
    trottoir:"#cbbda2", joint:"#a6947a", ombre:.14,
    ambiance:"oiseaux", note:"MATIN · 7h — le cinéma dort encore, le quartier s'éveille"
  },
  aprem:{
    ciel:["#5f9fd6","#8fc3e8","#d8ecf6"],
    astre:{type:"soleil", x:352, y:44, r:17, c:"#ffe9a0", halo:"#ffe9a0"},
    voisins:"#d8c9b0", fenVois:"#8fa8bc", fenOp:.7,
    mur:["#a8506a","#8c3a52","#742e42"],
    vitre:["#7fa8cc","#a8cce4","#6f98bc"],
    halo:0, lumieres:false, etoiles:false,
    trottoir:"#c9baa0", joint:"#a08c6a", ombre:.18,
    ambiance:"nuages", note:"APRÈS-MIDI · 15h — ouvert, séances de journée"
  },
  aube:{
    ciel:["#3a2c5e","#8a5484","#e8956a"],
    astre:{type:"soleil", x:215, y:118, r:22, c:"#ffd98a", halo:"#ff9a5c"},
    voisins:"#4b3852", fenVois:"#ffd98a", fenOp:.85,
    mur:["#7c3450","#61283e","#4c1f30"],
    vitre:["#6a5a8c","#9a7ca8","#54476e"],
    halo:.35, lumieres:true, etoiles:"peu",
    trottoir:"#5c4a54", joint:"#3f3340", ombre:.3,
    ambiance:"aucune", note:"CRÉPUSCULE · 20h — l'heure dorée, les enseignes s'allument"
  },
  nuit:{
    ciel:["#05070f","#141a38","#232c54"],
    astre:{type:"lune", x:374, y:44, r:16},
    voisins:"#10152b", fenVois:"#f2c96a", fenOp:.85,
    mur:["#4f2545","#341629","#26101e"],
    vitre:["#22305a","#3d548c","#1a2547"],
    halo:.5, lumieres:true, etoiles:"plein",
    trottoir:"#0a0d1c", joint:"#1c2440", ombre:0,
    ambiance:"aucune", note:"NUIT · 22h — la pleine séance, le quartier converge"
  }
};


function phaseSelonHeure(){
  const h = new Date().getHours();
  if(h>=6 && h<11) return "matin";
  if(h>=11 && h<18) return "aprem";
  if(h>=18 && h<21) return "aube";
  return "nuit";
}


const COULEURS_GENRE = {
  "Frisson":["#2a1535","#6a3d8c"], "Comédie":["#8c5a1f","#e8a04a"],
  "Drame":["#1f3a5c","#5c88b8"], "Action":["#6e1424","#c83a4a"],
  "SF":["#0f2a38","#2e8ca8"], "Classique":["#3a3126","#8a7a5c"],
  "défaut":["#8c2331","#c86a4a"]
};


/* séances converties pour la façade */
function seancesFacade(){
  return (Etat.seancesJour || []).map(s=>{
    const f = (typeof filmParId==="function" && filmParId(s.film_id)) || {titre:s.film_id, genre:"défaut"};
    return {heure:(s.heure||"").toUpperCase(), titre:f.titre, genre:f.genre||"défaut"};
  });
}

/* affiche de cinéma miniature avec titre réel */
function afficheFilm(x, seance){
  if(!seance){
    return `
    <path d="M${x+66} 224 L${x+62} 306 L${x+66} 310 Z" fill="#000" opacity=".3"/>
    <rect x="${x}" y="222" width="66" height="88" rx="4" fill="#241a12" stroke="#caa24a" stroke-width="3"/>
    <rect x="${x+7}" y="229" width="52" height="60" fill="#1c1626"/>
    <text x="${x+33}" y="255" text-anchor="middle" font-size="16" fill="#8a6c2a">?</text>
    <text x="${x+33}" y="272" text-anchor="middle" font-size="7" fill="#8a6c2a" font-family="Courier New" letter-spacing="1">PROCHAINEMENT</text>
    <text x="${x+33}" y="303" text-anchor="middle" font-size="8" fill="#f2e8d5" font-family="Courier New" letter-spacing="1">BIENTOT</text>`;
  }
  const cg = COULEURS_GENRE[seance.genre] || COULEURS_GENRE["défaut"];
  /* titre découpé en lignes de ~11 caractères */
  const mots = seance.titre.toUpperCase().split(" ");
  const lignes = [];
  let l = "";
  mots.forEach(m=>{ if((l+" "+m).trim().length<=11){ l=(l+" "+m).trim(); } else { lignes.push(l); l=m; } });
  if(l) lignes.push(l);
  const affTitre = lignes.slice(0,3).map((t,i)=>
    `<text x="${x+33}" y="${252+i*9}" text-anchor="middle" font-size="7.5" font-weight="bold" fill="#fdf3d2" font-family="Georgia" letter-spacing=".5">${t}</text>`).join("");
  return `
    <path d="M${x+66} 224 L${x+62} 306 L${x+66} 310 Z" fill="#000" opacity=".3"/>
    <rect x="${x}" y="222" width="66" height="88" rx="4" fill="#241a12" stroke="#caa24a" stroke-width="3"/>
    <rect x="${x+7}" y="229" width="52" height="60" fill="${cg[0]}"/>
    <path d="M${x+7} 289 L${x+7} 269 Q${x+33} 258 ${x+59} 269 L${x+59} 289 Z" fill="${cg[1]}" opacity=".8"/>
    <circle cx="${x+18}" cy="238" r="4" fill="#f7dd9a" opacity=".9"/>
    ${affTitre}
    <path d="M${x+9} 231 L${x+26} 287" stroke="#fff" stroke-opacity=".13" stroke-width="7"/>
    <rect x="${x+11}" y="292" width="44" height="10" rx="2" fill="#fdf8ea"/>
    <text x="${x+33}" y="299.5" text-anchor="middle" font-size="7" font-weight="bold" fill="#241a12" font-family="Courier New" letter-spacing="1">${seance.heure}</text>
    <text x="${x+33}" y="318" text-anchor="middle" font-size="7.5" fill="#f2e8d5" font-family="Courier New" letter-spacing="1">A L'AFFICHE</text>`;
}


/* Rendu de la façade. Le dessin vit dans facade-evo.js ; ici on rassemble
   l'état du jeu et on choisit la cible.
   opts : {cible, seances, phase, niveau} */
function dessineFacade(c, opts = {}){
  const cible = document.getElementById(opts.cible || "facade");
  if(!cible) return;
  const seances = opts.seances
    ? opts.seances.map(x=>({heure:x.heure, titre:x.titre, genre:x.genre || "défaut"}))
    : seancesFacade();
  const niveau = opts.niveau != null ? opts.niveau
    : (typeof niveauActuel === "function" ? niveauActuel() : 1);
  cible.innerHTML = dessineFacadeEvolutive({
    phase: opts.phase || phaseSelonHeure(),
    niveau, nom: c.nom, logo: c.logo, seances
  });
}


/* ---- séquence d'allumage à l'arrivée ---- */
function allumage(c){
  const ens = document.querySelector("#facade text");
  if(!ens || phaseSelonHeure()==="matin" || phaseSelonHeure()==="aprem"){ ditBonjour(c); spawnSpectateur(); return; }
  ens.style.opacity = "0";
  setTimeout(()=>{
    ens.style.transition = "opacity .18s";
    let n = 0;
    const t = setInterval(()=>{
      ens.style.opacity = ens.style.opacity === "1" ? ".25" : "1";
      if(++n >= 5){ clearInterval(t); ens.style.opacity = "1"; ditBonjour(c); }
    }, 160);
  }, 500);
  spawnSpectateur();
}

/* Les passants viennent de passants.js : silhouettes articulées,
   trois plans, reflet au sol quand il fait nuit. */
function spawnSpectateur(){
  const p = phaseSelonHeure();
  spawnPassant(p === "nuit" || p === "crepuscule");
}

/* ==== ÉTAT DU JOUR ==== */
async function chargeSeancesAccueil(){
  const c = Etat.cinema;
  const data = await sbFetch(`seances?cinema_id=eq.${c.id}&jour=eq.${c.jour}&select=*&order=heure`);
  Etat.seancesJour = Array.isArray(data) ? data : [];
}
function statsDuJour(){
  const seances = (Etat.seancesJour || [])
    .slice().sort((a,b)=>compareHeures(a.heure,b.heure))
    .map(s=>{
      const f = (typeof filmParId==="function" && filmParId(s.film_id)) || {titre:s.film_id, genre:"défaut"};
      return {heure:s.heure, titre:f.titre, genre:f.genre, salle:s.salle || "Salle 1",
              duree:s.duree_min, prix:s.prix, statut:s.statut};
    });
  const base = Etat.jourStats || { spectateurs:0, recettes:0, satisfaction:null, ouvert:false };
  return { ...base, seances };
}

/* ==== ACTION PRINCIPALE : évolue selon la situation ==== */
/* Le bouton principal ne mène jamais dans le vide : à chaque situation
   correspond une action possible. L'heure du téléphone n'y intervient pas. */
/* Un seul bouton, qui reprend là où le joueur s'est arrêté.
   L'accueil n'est plus traversé au milieu de la boucle : on y va
   pour regarder son cinéma, et on en repart une fois. */
function actionPrincipale(){
  const st = statsDuJour();
  const rt = statutCinema();
  const sj = (typeof statutJournee === "function") ? statutJournee() : "draft";

  if(rt.code === "travaux_total")
    return {ic:"outil", titre:"Travaux en cours",
            sous:"Le cinéma rouvrira à la fin du chantier", url:"salles.html"};

  if(sj === "running")
    return {ic:"journal", titre:"Voir le bilan de la journée",
            sous:"La journée est jouée — Bob t'attend", url:"bilan.html"};

  if(sj === "completed")
    return {ic:"horloge", titre:"Passer au jour suivant",
            sous:"La journée est close — on remet le compteur à zéro",
            url:null, action:"jourSuivant"};

  /* le matin a-t-il déjà été lu ? le serveur le sait, on le mémorise ici */
  const matinLu = Etat.journee && Etat.journee.preparee_le;

  if(!matinLu)
    return {ic:"cloche", titre:"Commencer la journée",
            sous:"Bob a des nouvelles du quartier", url:"preparation.html"};

  if(st.seances.length === 0)
    return {ic:"pellicule", titre:"Composer le programme",
            sous:"Le marquee est vide, le quartier attend", url:"programmation.html"};

  const licences = (Etat.seancesJour||[]).reduce((t,x)=>t+Number(x.cout_licence||0),0);
  return {ic:"porte", titre:"Ouvrir les portes",
          sous:`${st.seances.length} séance(s) · licences ${fmtArgent(licences)}`,
          url:"programmation.html"};
}

function rendActionPrincipale(){
  const a = actionPrincipale();
  const el = document.getElementById("actionPrincipale");
  if(!el) return;
  el.innerHTML = `
    <span class="agIco">${icone(a.ic)}</span>
    <span class="agTxt"><b>${echappe(a.titre)}</b><small>${echappe(a.sous)}</small></span>
    <span class="agFleche">›</span>`;
  el.onclick = ()=>{
    if(a.url){ location.href = a.url; return; }
    if(a.action === "ouvrir") confirmeOuverture();
    else if(a.action === "jourSuivant" && typeof passeAuJourSuivant === "function")
      passeAuJourSuivant();
  };
}

/* ==== CONFIRMATION D'OUVERTURE ==== */
function confirmeOuverture(){
  const v = verifieOuverture();
  if(!v.ok){
    parleBob("« " + v.msg + " »");
    if(v.code === "argent")
      parleBob("« " + v.msg + " Il faut " + fmtArgent(v.licences) + ", tu n'as que " + fmtArgent(Etat.cinema.argent) + ". »");
    return;
  }
  const n = (Etat.seancesJour||[]).length;
  const o = document.createElement("div");
  o.className = "voileConfirm";
  o.innerHTML = `
    <div class="carteConfirm">
      <div class="ccIco">${icone("porte","icoConfirm")}</div>
      <div class="ccTitre">Ouvrir le cinéma ?</div>
      <div class="ccTexte">Une fois le cinéma ouvert, le programme ne pourra plus être modifié.</div>
      <div class="ccResume">
        <span>${n} séance${n>1?"s":""} programmée${n>1?"s":""}</span>
        <span>Coûts de licence : <b>${fmtArgent(v.licences)}</b></span>
      </div>
      <div class="ccBoutons">
        <button class="btnAnnuler" id="ccAnnuler">Annuler</button>
        <button class="btnOr btnOuvrir" id="ccOuvrir">Ouvrir les portes</button>
      </div>
    </div>`;
  document.body.appendChild(o);
  o.querySelector("#ccAnnuler").onclick = ()=>{ o.classList.add("sortie"); setTimeout(()=>o.remove(),260); };
  o.querySelector("#ccOuvrir").onclick = async ()=>{
    o.querySelector("#ccOuvrir").disabled = true;
    o.querySelector("#ccOuvrir").textContent = "Bob ouvre…";
    o.remove();
    await ouvreCinema();
  };
}

/* ==== STATUT + RÉSUMÉ NARRATIF ==== */
function rendStatut(c){
  /* la refonte de l'accueil a retiré cet élément : on ne fait rien s'il manque */
  if(!document.getElementById("statutCine")) return;
  const st = statutCinema();
  const el1 = document.getElementById("statutCine");
  if(el1) el1.innerHTML = `
    <span class="pastille ${st.pastille}"></span>
    ${st.libelle}
    <span class="statutJour">Jour ${c.jour}</span>`;
}
setInterval(()=>{ if(document.getElementById("statutCine")) rendStatut(Etat.cinema); }, 15000);
function rendResume(c){
  /* la refonte de l'accueil a retiré cet élément : on ne fait rien s'il manque */
  if(!document.getElementById("resumeJour")) return;
  const st = statsDuJour();
  const j = Etat.journee;
  if(j && j.resultats){
    const b = j.resultats;
    const el2 = document.getElementById("resumeJour");
    if(el2) el2.innerHTML = 
      ligneResume("spectateurs", `<b>${b.total_spectateurs} spectateurs</b> sont venus aujourd'hui`) +
      ligneResume("piece", `<b>${fmtArgent(b.recettes_brutes)}</b> de recettes`) +
      ligneResume("etoile", `Satisfaction : <b>${b.satisfaction_moyenne} %</b>`) +
      ligneResume("journal", `Le bilan t'attend.`);
    return;
  }
  const lignes = [];
  lignes.push(ligneResume("spectateurs",
    st.spectateurs > 0 ? `<b>${st.spectateurs} spectateurs</b> sont venus aujourd'hui`
                       : `Personne n'est encore venu aujourd'hui`));
  lignes.push(ligneResume("piece",
    st.recettes > 0 ? `<b>${fmtArgent(st.recettes)}</b> de recettes`
                    : `La caisse contient <b>${fmtArgent(c.argent)}</b>`));
  if(st.satisfaction !== null)
    lignes.push(ligneResume("etoile", `Satisfaction : <b>${st.satisfaction} %</b>`));
  lignes.push(ligneResume("maison", `Le loyer du ${nomQuartier(c.quartier).toLowerCase()} coûte <b>${fmtArgent(c.loyer)}</b> par jour`));
  const el3 = document.getElementById("resumeJour");
  if(el3) el3.innerHTML = lignes.join("");
}
function ligneResume(ic, html){
  return `<div class="ligneRecit">${icone(ic)}<span>${html}</span></div>`;
}
const NOMS_QUARTIERS = {centre:"Centre-ville",residentiel:"Quartier résidentiel",etudiant:"Quartier étudiant",populaire:"Quartier populaire",artistique:"Quartier artistique"};
function nomQuartier(q){ return NOMS_QUARTIERS[q] || q; }

/* ==== SÉANCES ==== */
/* Le programme du jour prend la forme d'un panneau lumineux :
   ampoules, heures en pastilles dorées, titres sur fond sombre. */
function rendSeances(){
  const amp = document.getElementById("psAmpoules");
  if(amp && !amp.children.length) amp.innerHTML = "<i></i>".repeat(9);

  const st = statsDuJour();
  const el = document.getElementById("listeSeances");
  if(!el) return;
  if(st.seances.length === 0){
    el.innerHTML = `<div class="psVide">Le panneau est éteint.<br>
      <small>Aucune séance au programme aujourd'hui.</small></div>`;
    return;
  }
  el.innerHTML = st.seances.slice(0, 6).map(s =>
    `<div class="psLigne">
      <span class="psHeure">${echappe(s.heure)}</span>
      <span class="psTitre" data-t="${echappe(s.titre)}"></span>
      <span class="psSalle">${echappe(s.salle || "")}</span>
    </div>`).join("");
  [...el.querySelectorAll(".psTitre")].forEach(n=>texteSur(n, n.dataset.t));
}

/* ==== ÉVÉNEMENT ==== */
/* ------------------------------------------------------------
   LE BANDEAU DU JOUR
   Il montrait un texte tiré au hasard dans une liste, sans rapport
   avec la journée réelle — et écrivait dans un élément que la
   refonte de l'accueil a supprimé.

   Il affiche désormais la météo et l'événement officiels, ceux-là
   mêmes que la simulation applique. S'il n'y a rien à dire, il ne
   dit rien : un jour ordinaire n'a pas besoin de bandeau.
   ------------------------------------------------------------ */
async function rendEvenement(){
  const el = document.getElementById("bandeauEvenement");
  if(!el) return;

  const appel = await appelSecurise(
    () => rpc("get_day_context", {p_cinema_id: Etat.cinema.id}),
    {rechargeApresErreur: false});
  if(!appel.ok || !appel.data || appel.data.success !== true){ el.innerHTML = ""; return; }

  const d = appel.data.data || {};
  const meteo = d.meteo || {};
  const ev = d.evenement || {};
  const redondant = (meteo.id === "clair" && ev.id === "beau")
                 || (meteo.id === "pluie" && ev.id === "pluie");
  const montrerEv = ev.id && ev.id !== "aucun" && !redondant;

  el.innerHTML = `
    <div class="bandeauJour">
      <div class="bjLigne">${icone("meteo")}
        <span><b>${echappe(meteo.nom || "")}</b>
          <small>${echappe(meteo.phrase || "")}</small></span></div>
      ${montrerEv ? `<div class="bjLigne">${icone("journal")}
        <span><b>${echappe(ev.nom)}</b>
          <small>${echappe(ev.description || "")}</small></span></div>` : ""}
    </div>`;
}

/* ============================================================
   FAÇADE PUBLIQUE — même fonction, données du profil visité
   ============================================================ */
function rendreFacadePublique(cible, d){
  const cinema = {nom:d.nomCinema, logo:d.logo || "★", quartier:d.quartier};
  dessineFacade(cinema, {
    cible,
    niveau: Number(d.niveau) || 1,
    seances: (d.films || []).map(f=>({heure:f.heure, titre:f.titre, genre:f.genre}))
  });
}

/* décors du trottoir, choisis dans personnalisation.html */
function decorsExterieurs(A, lum){
  const d = A.exterieur || [];
  let out = "";
  if(d.includes("banc")) out += `
    <rect x="46" y="382" width="34" height="4" rx="2" fill="#6b4a2a"/>
    <rect x="49" y="386" width="3" height="9" fill="#4a3520"/><rect x="74" y="386" width="3" height="9" fill="#4a3520"/>
    <rect x="46" y="376" width="34" height="3" rx="1.5" fill="#7d5730"/>`;
  if(d.includes("lampadaire")) out += `
    <rect x="352" y="378" width="5" height="30" rx="2.5" fill="url(#orX)"/>
    <circle cx="354.5" cy="374" r="7" fill="${lum?'#ffdf9a':'#8a7a5c'}" opacity="${lum?'.95':'.5'}"/>
    ${lum?`<circle cx="354.5" cy="374" r="14" fill="#ffdf9a" opacity=".18"/>`:""}`;
  if(d.includes("pot")) out += `
    <ellipse cx="330" cy="396" rx="11" ry="5" fill="#5c4a2a"/>
    <path d="M330 392 q-6 -10 0 -14 q6 4 0 14" fill="#3d6b3a"/>
    <path d="M326 391 q-7 -6 -3 -11 q6 3 3 11" fill="#4a7d46"/>`;
  if(d.includes("panneau")) out += `
    <path d="M96 396 L110 366 L124 396 Z" fill="none" stroke="#5c4720" stroke-width="2.5"/>
    <rect x="99" y="370" width="22" height="20" rx="1.5" fill="#241a12"/>
    <path d="M102 375 h16 M102 380 h13 M102 385 h16" stroke="#caa24a" stroke-width="1"/>`;
  if(d.includes("guirlande")) out += `
    <path d="M120 202 Q167 220 215 206 Q263 220 310 202" stroke="${lum?'#caa24a':'#6e5a48'}" stroke-width="1.6" fill="none"/>
    ${[138,166,194,215,238,266,292].map((x,i)=>{
      const y = 209 + Math.round(7*Math.sin((i/6)*Math.PI));
      return lum ? `<circle cx="${x}" cy="${y}" r="2.8" fill="#ffdf9a" class="clignote" style="animation-delay:${i*.2}s"/>`
                 : `<circle cx="${x}" cy="${y}" r="2.8" fill="#6e5a48" opacity=".6"/>`;
    }).join("")}`;
  return out;
}

/* plaque de niveau apposée près de l'entrée */
function plaqueFacade(A){
  if(!A.plaque) return "";
  return `<g transform="translate(300 250)">
    <rect x="0" y="0" width="46" height="26" rx="3" fill="url(#orX)" stroke="#5c4720" stroke-width="1.5"/>
    <text x="23" y="11" text-anchor="middle" font-family="Courier New" font-size="5.5"
      letter-spacing=".6" fill="#3a2408">CINEMA RECONNU</text>
    <text x="23" y="20" text-anchor="middle" font-family="Courier New" font-size="5.5"
      letter-spacing=".6" fill="#3a2408">DU QUARTIER</text>
  </g>`;
}

/* ---- Bob ---- */
function parleBob(t){
  const p = document.getElementById("bulleTexteAccueil");
  if(p){ texteSur(p, String(t).replace(/^«\s*|\s*»$/g, "")); return; }
  const b = document.getElementById("bulleAccueil");
  const txt = document.getElementById("bulleTexteAccueil");
  b.classList.add("fondu");
  setTimeout(()=>{txt.textContent = t; b.classList.remove("fondu")},180);
}
function ditBonjour(c){
  const st = statsDuJour();
  /* on ne valide plus : soit il y a un programme, soit il n'y en a pas */
  if(st.seances.length && !(Etat.journee && Etat.journee.preparee_le)){
    parleBob(`Le programme est là, ${c.directeur}, mais je ne t'ai pas encore dit le temps qu'il fait.`);
    return;
  }
  if(st.seances.length === 0)
    parleBob(`${c.directeur}… le marquee est vide. Un cinéma sans séance, c'est un couloir avec des fauteuils. On programme ?`);
  else
    parleBob(`Bienvenue chez toi, ${c.directeur}. ${c.nom}, jour ${c.jour}. Ça sonne bien, non ?`);
}


/* ============================================================
   LE HÉROS DE L'ACCUEIL
   Une phrase d'ambiance devant, les chiffres derrière.
   ============================================================ */
function rendHero(a){
  /* la refonte de l'accueil a retiré cet élément : on ne fait rien s'il manque */
  if(!document.getElementById("heroChiffres")) return;
  const c = Etat.cinema;
  const st = statutCinema();
  const seances = (Etat.seancesJour || []).length;
  const niveau = (typeof niveauActuel === "function") ? niveauActuel() : 1;

  texteSur(document.getElementById("heroSurtitre"), "Jour " + c.jour + " · " + st.libelle.split(" — ")[0]);
  texteSur(document.getElementById("heroTitre"), a.titre);

  let phrase;
  const j = Etat.journee;
  if(j?.statut === "running" && j.resultats){
    const r = j.resultats;
    phrase = phraseFrequentation(r.total_spectateurs, capaciteTotale())
           + " " + phraseRecette(r.benefice_net);
  }else if(seances === 0){
    phrase = "L'écran est encore éteint. Il attend un programme.";
  }else{
    phrase = seances + " séance" + (seances>1?"s":"") + " au programme. "
           + phraseNiveau(niveau);
  }
  texteSur(document.getElementById("heroPhrase"), phrase);

  const el4 = document.getElementById("heroChiffres");
  if(el4) el4.innerHTML = `
    <div><b>${fmtArgent(c.argent)}</b><span>en caisse</span></div>
    <div><b>${c.reputation}</b><span>réputation</span></div>
    <div><b>${seances}</b><span>séance${seances>1?"s":""}</span></div>`;
}

function capaciteTotale(){
  return (Etat.salles || []).reduce((n,s)=>n + (Number(s.capacite)||0), 0) || 60;
}


/* ============================================================
   BOB VIT SA VIE — remarques d'ambiance selon le moment
   ============================================================ */
const REMARQUES_BOB = {
  matin: ["Il est tôt. Le hall sent encore le produit d'entretien. J'aime bien.",
          "Les oiseaux sont déjà debout. Eux non plus n'ont pas de projecteur à régler.",
          "Café pris, bobines vérifiées. Enfin, café pris."],
  apresmidi: ["L'après-midi, c'est le public des habitués. Ils connaissent leur rang.",
              "Il fait bon dans la salle. Presque trop, on va en perdre un ou deux au rang 8.",
              "Le trottoir est calme. Ça viendra vers dix-huit heures."],
  soir: ["C'est l'heure. Les gens sortent, ils cherchent une lumière. On en a une.",
         "L'enseigne s'allume. Petit frisson à chaque fois, même après vingt ans.",
         "Belle soirée pour une séance. Je le dis toutes les soirées, mais là je le pense."],
  nuit: ["La dernière séance, c'est ma préférée. Moins de monde, plus de silence.",
         "À cette heure-ci, on ne vient pas par hasard. On vient pour le film.",
         "La ville dort. Nous, on projette."]
};
const REMARQUES_ETAT = {
  sale: "Le sol colle un peu au rang 4. Je dis ça, je ne dis rien.",
  usee: "Un fauteuil grince. Deux, en fait. Ils se répondent.",
  vide: "Aucune séance au programme. L'écran fait la tête.",
  pleine: "Hier soir on a refusé du monde. Le quartier parle de nous."
};

function remarqueBob(){
  const salles = Etat.salles || [];
  const propSale = salles.some(s=>Number(s.proprete||100) < 55);
  const usee = salles.some(s=>Number(s.etat||100) < 60);
  const vide = (Etat.seancesJour||[]).length === 0;
  const comble = Etat.journee?.resultats?.salle_complete;

  /* les remarques utiles passent devant les remarques d'ambiance */
  if(vide) return REMARQUES_ETAT.vide;
  if(propSale) return REMARQUES_ETAT.sale;
  if(usee) return REMARQUES_ETAT.usee;
  if(comble) return REMARQUES_ETAT.pleine;

  const h = new Date().getHours();
  const moment = h < 11 ? "matin" : h < 17 ? "apresmidi" : h < 22 ? "soir" : "nuit";
  const liste = REMARQUES_BOB[moment];
  return liste[Math.floor(Math.random() * liste.length)];
}


/* ---------- bandeau météo, discret sous la façade ---------- */
function rendBandeauMeteo(meteo){
  const el = document.getElementById("bandeauMeteo");
  if(!el || !meteo) return;
  const ICO = {clair:"etoile", nuages:"maison", pluie:"cloche", brume:"porte", vent:"pellicule"};
  const NOM = {clair:"Beau temps", nuages:"Ciel couvert", pluie:"Pluie",
               brume:"Brume", vent:"Vent"};
  el.innerHTML = icone(ICO[meteo] || "etoile") + "<span></span>";
  texteSur(el.querySelector("span"), NOM[meteo] || "");
}

/* ---- exports ---- */
export {
  CONSEILS_BOB,
  COULEURS_GENRE,
  EVENEMENTS_JOUR,
  NOMS_QUARTIERS,
  PHASES,
  REMARQUES_BOB,
  REMARQUES_ETAT,
  actionPrincipale,
  afficheFilm,
  allumage,
  anneauChiffre,
  brancheOnglets,
  capaciteTotale,
  chargeSeancesAccueil,
  chargeSorties,
  chargeStyle,
  confirmeOuverture,
  decorsExterieurs,
  dessineFacade,
  ditBonjour,
  etatDuJour,
  initAccueil,
  ligneResume,
  nomQuartier,
  parleBob,
  phaseSelonHeure,
  phraseMeteo,
  placeCurseurVue,
  plaqueFacade,
  remarqueBob,
  rendActionPrincipale,
  rendBandeauMeteo,
  rendChiffres,
  rendEtatVue,
  rendEvenement,
  rendHero,
  rendJournalAccueil,
  rendResume,
  rendSeances,
  rendStatut,
  rendVueCine,
  rendreFacadePublique,
  seancesFacade,
  spawnSpectateur,
  statsDuJour,
  vueCourante
};
