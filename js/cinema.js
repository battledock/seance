/* L'accueil : façade vivante, héros, statut du jour. */

import { phraseFrequentation, phraseNiveau, phraseRecette } from "./ambiance.js?v=144ee666";
import { compareHeures, filmParId } from "./data/films.js?v=144ee666";
import {
  chargeJournee,
  ouvreCinema,
  passeAuJourSuivant,
  statutJournee,
  verifieOuverture
} from "./engine/day.js?v=144ee666";
import { animeLeCinema, bobMeteo } from "./facade/life.js?v=144ee666";
import { dessineHallEvolutif } from "./facade/lobby.js?v=144ee666";
import { spawnPassant } from "./facade/pedestrians.js?v=144ee666";
import { dessineFacadeEvolutive } from "./facade/render.js?v=144ee666";
import { animeLaVitalite, remarqueVitalite } from "./facade/vitality.js?v=144ee666";
import { Etat, chargeSallesEtat, fmtArgent, statutCinema } from "./game-state.js?v=144ee666";
import { bandeauEvenement } from "./pages/parts/events.js?v=144ee666";
import { niveauActuel, progressionVersSuivant } from "./progression.js?v=144ee666";
import { salles } from "./rooms.js?v=144ee666";
import { appelSecurise, rpc, sbFetch } from "./supabase-client.js?v=144ee666";
import { echappe, texteSur } from "./ui/emblems.js?v=144ee666";
import { A } from "./ui/genre-posters.js?v=144ee666";
import { icone } from "./ui/icons.js?v=144ee666";
import { salleEnCoupe } from "./ui/room-view.js?v=144ee666";

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

/* ============================================================
   INIT ACCUEIL — version immersive
   Le cinéma EST l'interface. Plus de cartes, le monde remplit
   l'écran. Le HUD est transparent, superposé au ciel.
   ============================================================ */
async function initAccueil(){
  const c = Etat.cinema;
  try{ await chargeSeancesAccueil(); }catch(e){ Etat.seancesJour = []; }
  try{ await chargeJournee(); }catch(e){}
  try{ await chargeSallesEtat(); }catch(e){}

  /* chargements non bloquants */
  chargeSorties();
  chargeStyle();

  /* ---- HUD transparent ---- */
  rendHud();

  /* ---- la façade remplit l'écran ---- */
  rendFacadeImmersive();
  surveilleTaille();

  /* ---- classe de phase sur le conteneur ---- */
  majPhaseClasse();

  /* ---- la vie du cinéma ---- */
  if(typeof animeLeCinema === "function") animeLeCinema();
  if(typeof animeLaVitalite === "function") animeLaVitalite();

  /* le trottoir reste vivant tant qu'on regarde */
  peupleLaRue();

  /* cycle de phase */
  let phaseCourante = phaseSelonHeure();
  setInterval(()=>{
    const p = phaseSelonHeure();
    if(p !== phaseCourante){
      phaseCourante = p;
      rendFacadeImmersive();
      majPhaseClasse();
    }
  }, 60000);
}

/* ---- HUD minimal ---- */
function rendHud(){
  const c = Etat.cinema || {};
  const niveau = (typeof niveauActuel === "function") ? niveauActuel() : 1;
  const versSuivant = (typeof progressionVersSuivant === "function")
    ? progressionVersSuivant() : 0;

  const nom = document.getElementById("hudNom");
  if(nom) nom.textContent = c.nom || "";

  const niv = document.getElementById("hudNiv");
  if(niv) niv.textContent = "niv. " + niveau;

  const arg = document.getElementById("hudArgent");
  if(arg) arg.textContent = fmtArgent(c.argent);

  const xp = document.getElementById("hudXpBarre");
  if(xp) setTimeout(()=>{ xp.style.width = Math.round(versSuivant * 100) + "%"; }, 100);
}

/* ---- mise à jour de l'argent dans le HUD ---- */
function majHudArgent(){
  const el = document.getElementById("hudArgent");
  if(el && Etat.cinema) el.textContent = fmtArgent(Etat.cinema.argent);
}

/* ------------------------------------------------------------
   LA FAÇADE IMMERSIVE

   Le dessin ne s'adapte plus par rognage : on mesure la zone
   réellement disponible et le rendu recompose son cadre. Sur un
   téléphone très allongé, le ciel et la route s'étirent ; sur un
   écran court, ils se resserrent. Le cinéma, lui, garde toujours
   la même présence.
   ------------------------------------------------------------ */
function ratioScene(){
  const cible = document.getElementById("sceneFacade");
  if(!cible) return 0.48;
  const r = cible.getBoundingClientRect();
  if(!r.width || !r.height) return 0.48;
  return r.width / r.height;
}

function rendFacadeImmersive(){
  const c = Etat.cinema;
  const cible = document.getElementById("sceneFacade");
  if(!cible) return;
  const niveau = (typeof niveauActuel === "function") ? niveauActuel() : 1;
  const r = ratioScene();
  ratioDessine = r;
  dessineFacade(c, {
    cible: "sceneFacade",
    phase: phaseSelonHeure(),
    niveau,
    ratio: r
  });
}

/* ------------------------------------------------------------
   REDESSINER, MAIS SEULEMENT QUAND IL LE FAUT

   Sur mobile, la barre d'adresse qui se replie déclenche un
   « resize » de quelques pixels. Redessiner à chaque fois faisait
   clignoter la façade au chargement — on voyait le décor bouger
   et les pigeons disparaître, parce que le second dessin arrivait
   avec des données que le premier n'avait pas encore.

   On ne redessine donc que si la forme du cadre a réellement
   changé, et jamais pour un écart négligeable.
   ------------------------------------------------------------ */
let minuteurRedessin = null;
let ratioDessine = null;

function surveilleTaille(){
  const relance = ()=>{
    clearTimeout(minuteurRedessin);
    minuteurRedessin = setTimeout(()=>{
      const r = ratioScene();
      if(ratioDessine !== null && Math.abs(r - ratioDessine) < 0.04) return;
      rendFacadeImmersive();
      if(typeof animeLeCinema === "function") animeLeCinema();
      if(typeof animeLaVitalite === "function") animeLaVitalite();
    }, 320);
  };
  window.addEventListener("resize", relance);
  window.addEventListener("orientationchange", relance);
}

/* ---- classe de phase pour adapter le HUD ---- */
function majPhaseClasse(){
  const scene = document.querySelector(".sceneJeu");
  if(!scene) return;
  scene.classList.remove("phaseMatin","phaseAprem","phaseSoir","phaseNuit");
  const p = phaseSelonHeure();
  if(p === "matin") scene.classList.add("phaseMatin");
  else if(p === "aprem") scene.classList.add("phaseAprem");
}


/* ============================================================
   FONCTIONS CONSERVÉES — utilisées par d'autres pages ou
   par la logique de jeu. Rien n'est supprimé.
   ============================================================ */

/* ------------------------------------------------------------
   LES SORTIES DE LA SEMAINE
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

async function chargeStyle(){
  const el = document.getElementById("vueStyle");
  if(!el) return;
  const appel = await appelSecurise(
    () => rpc("get_cinema_memory", {p_cinema_id: Etat.cinema.id}),
    {rechargeApresErreur: false});
  if(!appel.ok || !appel.data || appel.data.success !== true){ el.innerHTML = ""; return; }
  const d = appel.data.data || {};
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
  if(document.fonts && document.fonts.ready)
    document.fonts.ready.then(placeCurseurVue).catch(()=>{});
  requestAnimationFrame(placeCurseurVue);
}

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

function rendEtatVue(){
  const el = document.getElementById("surScene");
  if(!el) return;
  const p = etatDuJour();
  el.innerHTML = `
    <span class="ssEt">${p.moment}</span>
    <h2>${echappe(p.titre)}</h2>
    <p>${echappe(p.phrase)}</p>`;
}

function rendJournalAccueil(){
  const el = document.getElementById("journalAcc");
  if(!el) return;
  const L = [];
  const m = Etat.journee && Etat.journee.meteo;
  if(m) L.push({i:"meteo", t: phraseMeteo(m), d:"La demande du jour s'en ressent"});
  const ch = Etat.charges;
  if(ch && Number(ch.total) > 0)
    L.push({i:"piece", t: fmtArgent(ch.total) + " de charges aujourd'hui", d: ch.detail || ""});
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


const PHASES = {
  matin:{ ciel:["#7fb2d9","#b8d8ec","#eef6f2"] },
  aprem:{ ciel:["#5f9fd6","#8fc3e8","#d8ecf6"] },
  aube:{ ciel:["#3a2c5e","#8a5484","#e8956a"] },
  nuit:{ ciel:["#05070f","#141a38","#232c54"] }
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

function seancesFacade(){
  return (Etat.seancesJour || []).map(s=>{
    const f = (typeof filmParId==="function" && filmParId(s.film_id)) || {titre:s.film_id, genre:"défaut"};
    return {heure:(s.heure||"").toUpperCase(), titre:f.titre, genre:f.genre||"défaut"};
  });
}

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
    niveau, nom: c.nom, logo: c.logo, seances,
    ratio: opts.ratio
  });
}

function spawnSpectateur(){
  const p = phaseSelonHeure();
  spawnPassant(p === "nuit" || p === "crepuscule");
}

/* ------------------------------------------------------------
   LE TROTTOIR VIVANT

   Trois passants lâchés au chargement puis plus rien : au bout
   d'une minute la rue était morte. Ici un semeur tourne en
   continu et son rythme suit ce qui se passe vraiment — l'heure,
   le nombre de séances, la réputation du cinéma.

   Le semeur s'arrête quand l'onglet passe à l'arrière-plan :
   inutile de peupler une rue que personne ne regarde.
   ------------------------------------------------------------ */
let semeurRue = null;

function densiteRue(){
  const h = new Date().getHours();
  /* le quartier respire : creux le matin, affluence en soirée */
  let base = h < 8 ? .35 : h < 12 ? .6 : h < 17 ? .75 : h < 22 ? 1.25 : .55;

  /* un cinéma qui joue attire du monde devant sa façade */
  const seances = (Etat.seancesJour || []).length;
  if(seances) base *= 1 + Math.min(.5, seances * .16);

  /* la journée en cours pèse davantage que le programme prévu */
  const st = (typeof statutJournee === "function") ? statutJournee() : "draft";
  if(st === "running") base *= 1.45;
  if(st === "completed") base *= .7;

  /* et la réputation se voit dans la rue */
  const rep = Number(Etat.cinema?.reputation ?? 50);
  base *= .78 + rep / 160;

  return Math.max(.25, Math.min(2.1, base));
}

function peupleLaRue(){
  arreteLaRue();

  /* on amorce avec quelques silhouettes déjà en chemin, pour que
     la rue ne soit pas vide à l'ouverture de la page */
  const amorce = Math.round(2 + densiteRue());
  for(let i = 0; i < amorce; i++) setTimeout(spawnSpectateur, i * 1400 + Math.random() * 900);

  const semer = ()=>{
    if(!document.hidden && document.getElementById("planProche")) spawnSpectateur();
    const d = densiteRue();
    const attente = (3200 + Math.random() * 5200) / d;
    semeurRue = setTimeout(semer, attente);
  };
  semeurRue = setTimeout(semer, 2600 + Math.random() * 2400);

  document.addEventListener("visibilitychange", ()=>{
    if(document.hidden) arreteLaRue();
    else if(!semeurRue) peupleLaRue();
  });
}

function arreteLaRue(){
  clearTimeout(semeurRue);
  semeurRue = null;
}

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

function actionPrincipale(){
  const st = statsDuJour();
  const rt = statutCinema();
  const sj = (typeof statutJournee === "function") ? statutJournee() : "draft";
  if(rt.code === "travaux_total")
    return {ic:"outil", titre:"Travaux en cours", sous:"Le cinéma rouvrira à la fin du chantier", url:"salles.html"};
  if(sj === "running")
    return {ic:"journal", titre:"Voir le bilan de la journée", sous:"La journée est jouée — Bob t'attend", url:"bilan.html"};
  if(sj === "completed")
    return {ic:"horloge", titre:"Passer au jour suivant", sous:"La journée est close", url:null, action:"jourSuivant"};
  const matinLu = Etat.journee && Etat.journee.preparee_le;
  if(!matinLu)
    return {ic:"cloche", titre:"Commencer la journée", sous:"Bob a des nouvelles du quartier", url:"preparation.html"};
  if(st.seances.length === 0)
    return {ic:"pellicule", titre:"Composer le programme", sous:"Le marquee est vide", url:"programmation.html"};
  const licences = (Etat.seancesJour||[]).reduce((t,x)=>t+Number(x.cout_licence||0),0);
  return {ic:"porte", titre:"Ouvrir les portes",
          sous:`${st.seances.length} séance(s) · licences ${fmtArgent(licences)}`, url:"programmation.html"};
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

function confirmeOuverture(){
  const v = verifieOuverture();
  if(!v.ok){
    parleBob(v.msg);
    return;
  }
  const n = (Etat.seancesJour||[]).length;
  const o = document.createElement("div");
  o.className = "voileConfirm";
  o.innerHTML = `
    <div class="carteConfirm">
      <div class="ccIco">${icone("porte","icoConfirm")}</div>
      <div class="ccTitre">Ouvrir le cinéma ?</div>
      <div class="ccTexte">Une fois ouvert, le programme ne pourra plus être modifié.</div>
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

function rendStatut(c){
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
  lignes.push(ligneResume("maison", `Le loyer coûte <b>${fmtArgent(c.loyer)}</b> par jour`));
  const el3 = document.getElementById("resumeJour");
  if(el3) el3.innerHTML = lignes.join("");
}

function ligneResume(ic, html){
  return `<div class="ligneRecit">${icone(ic)}<span>${html}</span></div>`;
}

const NOMS_QUARTIERS = {centre:"Centre-ville",residentiel:"Quartier résidentiel",etudiant:"Quartier étudiant",populaire:"Quartier populaire",artistique:"Quartier artistique"};
function nomQuartier(q){ return NOMS_QUARTIERS[q] || q; }

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

function rendreFacadePublique(cible, d){
  const cinema = {nom:d.nomCinema, logo:d.logo || "★", quartier:d.quartier};
  dessineFacade(cinema, {
    cible,
    niveau: Number(d.niveau) || 1,
    seances: (d.films || []).map(f=>({heure:f.heure, titre:f.titre, genre:f.genre}))
  });
}

function parleBob(t){
  const p = document.getElementById("bulleTexteAccueil");
  if(p){ texteSur(p, String(t).replace(/^«\s*|\s*»$/g, "")); return; }
}

function ditBonjour(c){
  const st = statsDuJour();
  if(st.seances.length === 0)
    parleBob(`${c.directeur}… le marquee est vide.`);
  else
    parleBob(`Bienvenue chez toi, ${c.directeur}. ${c.nom}, jour ${c.jour}.`);
}

function allumage(c){
  ditBonjour(c); spawnSpectateur();
}

function rendHero(a){}
function rendBandeauMeteo(meteo){}

const REMARQUES_BOB = {
  matin: ["Il est tôt. Le hall sent encore le produit d'entretien.","Les oiseaux sont déjà debout.","Café pris, bobines vérifiées."],
  apresmidi: ["L'après-midi, c'est le public des habitués.","Il fait bon dans la salle.","Le trottoir est calme."],
  soir: ["C'est l'heure. Les gens sortent.","L'enseigne s'allume. Petit frisson.","Belle soirée pour une séance."],
  nuit: ["La dernière séance, c'est ma préférée.","À cette heure-ci, on ne vient pas par hasard.","La ville dort. Nous, on projette."]
};
const REMARQUES_ETAT = {
  sale:"Le sol colle un peu au rang 4.", usee:"Un fauteuil grince.",
  vide:"Aucune séance au programme.", pleine:"Hier soir on a refusé du monde."
};

function remarqueBob(){
  const sallesE = Etat.salles || [];
  const vide = (Etat.seancesJour||[]).length === 0;
  if(vide) return REMARQUES_ETAT.vide;
  const h = new Date().getHours();
  const moment = h < 11 ? "matin" : h < 17 ? "apresmidi" : h < 22 ? "soir" : "nuit";
  const liste = REMARQUES_BOB[moment];
  return liste[Math.floor(Math.random() * liste.length)];
}

function afficheFilm(x, seance){
  if(!seance) return "";
  const cg = COULEURS_GENRE[seance.genre] || COULEURS_GENRE["défaut"];
  const mots = seance.titre.toUpperCase().split(" ");
  const lignes = []; let l = "";
  mots.forEach(m=>{ if((l+" "+m).trim().length<=11){ l=(l+" "+m).trim(); } else { lignes.push(l); l=m; } });
  if(l) lignes.push(l);
  return "";
}

function decorsExterieurs(A, lum){ return ""; }
function plaqueFacade(A){ return ""; }
function capaciteTotale(){
  return (Etat.salles || []).reduce((n,s)=>n + (Number(s.capacite)||0), 0) || 60;
}

/* ---- exports ---- */
export {
  CONSEILS_BOB, COULEURS_GENRE, EVENEMENTS_JOUR, NOMS_QUARTIERS, PHASES,
  REMARQUES_BOB, REMARQUES_ETAT,
  actionPrincipale, afficheFilm, allumage, anneauChiffre, brancheOnglets,
  capaciteTotale, chargeSeancesAccueil, chargeSorties, chargeStyle,
  confirmeOuverture, decorsExterieurs, dessineFacade, ditBonjour,
  etatDuJour, initAccueil, ligneResume, majHudArgent, nomQuartier, parleBob,
  phaseSelonHeure, phraseMeteo, placeCurseurVue, plaqueFacade,
  remarqueBob, rendActionPrincipale, rendBandeauMeteo, rendChiffres,
  rendEtatVue, rendEvenement, rendHero, rendJournalAccueil, rendResume,
  rendSeances, rendStatut, rendVueCine, rendreFacadePublique,
  seancesFacade, spawnSpectateur, statsDuJour, vueCourante
};


