import { bobCompact } from "../../navigation.js?v=2ab9afab";
import { fmtNb } from "./events.js?v=2ab9afab";
import { rpc } from "../../supabase-client.js?v=2ab9afab";
import { echappe, embleme, texteSur } from "../../ui/emblems.js?v=2ab9afab";
import { icone } from "../../ui/icons.js?v=2ab9afab";

/* ============================================================
   CLASSEMENTS — lecture seule, scores calculés par le serveur
   ============================================================ */
const CATEGORIES = [
  {id:"niveau",              nom:"Niveau",       titre:"Les grands exploitants",
   ic:"etoile",      unite:n=>"Niveau " + n,             periode:"Tous les temps"},
  {id:"reputation",          nom:"Réputation",   titre:"Les favoris du quartier",
   ic:"journal",     unite:n=>n + " / 100",              periode:"Tous les temps"},
  {id:"spectateurs_semaine", nom:"Semaine",      titre:"Les salles les plus fréquentées",
   ic:"spectateurs", unite:n=>fmtNb(n) + " spectateurs", periode:"Cette semaine"},
  {id:"meilleure_journee",   nom:"Records",      titre:"La journée historique",
   ic:"pellicule",   unite:n=>fmtNb(n) + " en un jour", periode:"Tous les temps"},
  {id:"visites_semaine",     nom:"Visites",      titre:"Les cinémas à découvrir",
   ic:"porte",       unite:n=>n + " visiteur" + (n>1?"s":""), periode:"Cette semaine"},
  {id:"nouveaux",            nom:"Nouveaux",     titre:"Nouveaux exploitants",
   ic:"batiment",    unite:n=>fmtNb(n) + " XP",      periode:"Cette semaine", filtre:"nouveaux"}
];
/* le formatage des nombres vient de data/films.js */
function categorieParId(id){ return CATEGORIES.find(c=>c.id===id) || CATEGORIES[0]; }

let catActuelle = "niveau";
let filtreActuel = "global";
let pageActuelle = 1;
let saison = null;
let bobDit = false;

/* mémoire de navigation, non critique */
function memoriseVue(){
  try{ sessionStorage.setItem("rex_classement", JSON.stringify({
    cat:catActuelle, filtre:filtreActuel, page:pageActuelle, scroll:window.scrollY})); }catch(e){}
}
function restaureVue(){
  try{
    const v = JSON.parse(sessionStorage.getItem("rex_classement") || "null");
    if(v){ catActuelle = v.cat || "niveau"; filtreActuel = v.filtre || "global"; pageActuelle = v.page || 1;
           return v.scroll || 0; }
  }catch(e){}
  return 0;
}

async function initClassement(){
  const scroll = restaureVue();
  try{
    const s = await rpc("get_active_season");
    saison = s?.success ? s.data : null;
  }catch(e){ saison = null; }
  rendCadreClassement();
  await chargeClassement();
  if(scroll) setTimeout(()=>window.scrollTo(0, scroll), 120);
}

function rendCadreClassement(){
  document.getElementById("zoneClassement").innerHTML = `
    ${saison ? `<div class="bandeauSaison">${icone("etoile")}
      <span><b>${echappe(saison.nom)}</b><br><small>Se termine dans ${saison.joursRestants} jour${saison.joursRestants>1?"s":""}</small></span></div>` : ""}
    <nav class="ongletsCat" id="ongletsCat" role="tablist"></nav>
    <div class="enteteCat" id="enteteCat"></div>
    <div class="filtresClassement" id="filtresClassement"></div>
    <div id="maPosition"></div>
    <div id="listeClassement"></div>
    <div id="paginationClassement"></div>`;
  rendOngletsCat();
}

function rendOngletsCat(){
  document.getElementById("ongletsCat").innerHTML = CATEGORIES.map(c=>`
    <button class="ongletCat ${c.id===catActuelle?'actif':''}" role="tab"
      aria-selected="${c.id===catActuelle}" onclick="changeCategorie('${c.id}')">
      ${icone(c.ic)}<span>${c.nom}</span></button>`).join("");
}
async function changeCategorie(id){
  catActuelle = id; pageActuelle = 1;
  if(categorieParId(id).filtre) filtreActuel = categorieParId(id).filtre;
  else if(filtreActuel === "nouveaux") filtreActuel = "global";
  rendOngletsCat();
  await chargeClassement();
  window.scrollTo({top:0, behavior:"smooth"});
}
async function changeFiltre(f){ filtreActuel = f; pageActuelle = 1; await chargeClassement(); }
async function changePage(p){ pageActuelle = Math.max(1, p); await chargeClassement(); window.scrollTo({top:0, behavior:"smooth"}); }

/* ---------- chargement ---------- */
async function chargeClassement(){
  const c = categorieParId(catActuelle);
  document.getElementById("enteteCat").innerHTML = `
    <h2 class="titreCat">${echappe(c.titre)}</h2>
    <div class="periodeCat">${icone("horloge")} ${c.periode}</div>`;

  rendFiltres();
  const liste = document.getElementById("listeClassement");
  liste.innerHTML = `<div class="vide">Le classement est en cours de bobinage…</div>`;

  let r, moi;
  try{
    [r, moi] = await Promise.all([
      rpc("get_leaderboard", {p_categorie:catActuelle, p_page:pageActuelle,
                              p_taille:25, p_filtre:filtreActuel}),
      rpc("get_my_leaderboard_position", {p_categorie:catActuelle})
    ]);
  }catch(e){
    liste.innerHTML = `<div class="vide">Le classement est en cours de bobinage.<br>Reviens après l'entracte.</div>`;
    return;
  }
  if(!r?.success){
    liste.innerHTML = `<div class="vide">Cette catégorie n'est pas disponible.</div>`;
    return;
  }
  rendMaPosition(moi, c);
  rendListe(r.entries || [], c);
  rendPagination(r.pagination || {});
  memoriseVue();
  if(!bobDit){ bobDit = true; commenteBob(moi); }
}

function rendFiltres(){
  const c = categorieParId(catActuelle);
  if(c.filtre){ document.getElementById("filtresClassement").innerHTML = ""; return; }
  const F = [{id:"global", nom:"Global"}, {id:"meme_niveau", nom:"Autour de mon niveau"}];
  document.getElementById("filtresClassement").innerHTML = F.map(f=>`
    <button class="pastFiltre ${f.id===filtreActuel?'actif':''}"
      onclick="changeFiltre('${f.id}')">${f.nom}</button>`).join("");
}

function rendMaPosition(moi, c){
  const el = document.getElementById("maPosition");
  if(!moi?.success){ el.innerHTML = ""; return; }
  if(!moi.classe){
    const M = {
      NOT_PARTICIPATING:["Tu ne participes pas aux classements.",
        `<a class="lienReglage" href="profil.html">Activer ma participation</a>`],
      NOT_RANKED:["Pas encore de score dans cette catégorie.",
        `<small>Termine une journée pour apparaître.</small>`],
      NOT_ELIGIBLE:["Ton classement est en cours de vérification.", ""],
      CLASSEMENT_SUSPENDU:["Ton cinéma est momentanément hors classement.",
        "Écris-nous si tu penses que c'est une erreur."]
    };
    const [t, a] = M[moi.code] || [moi.message || "", ""];
    el.innerHTML = `<div class="carteMaPosition absente">${icone("cloche")}
      <span>${echappe(t)} ${a}</span></div>`;
    return;
  }
  const d = moi.data;
  el.innerHTML = `
    <div class="carteMaPosition">
      <div class="mpRang"><b>${d.rang}<sup>${d.rang===1?"er":"e"}</sup></b>
        <span>sur ${fmtNb(d.total)} cinéma${d.total>1?"s":""}</span></div>
      <div class="mpScore">${echappe(c.unite(d.score))}</div>
      ${d.ecart != null && d.ecart > 0 ? `<div class="mpEcart">
        Encore ${fmtNb(Math.ceil(d.ecart))} pour rejoindre la ${d.rang-1}<sup>${d.rang-1===1?"er":"e"}</sup> place</div>`
        : d.rang === 1 ? `<div class="mpEcart">Personne devant toi.</div>` : ""}
    </div>`;
}

function rendListe(entries, c){
  const el = document.getElementById("listeClassement");
  if(entries.length === 0){
    el.innerHTML = `<div class="vide">Aucun cinéma classé ici pour l'instant.<br>
      <small>Les profils privés n'apparaissent pas dans les classements.</small></div>`;
    return;
  }
  el.innerHTML = entries.map(e=>{
    const podium = e.rang <= 3 ? " podium p" + e.rang : "";
    return `<a class="ligneClassement${podium}${e.moi?' moi':''}"
      href="cinema-public.html?id=${encodeURIComponent(e.publicId)}" onclick="memoriseVue()">
      <span class="lcRang">${e.rang}${e.rang<=3?`<i>${["","er","e","e"][e.rang]}</i>`:""}</span>
      <span class="lcEmbleme">${embleme(e.embleme, 34)}</span>
      <span class="lcTxt">
        <b class="lcNom"></b>
        <small class="lcMeta"></small>
      </span>
      <span class="lcScore">${echappe(c.unite(e.score))}</span>
    </a>`;
  }).join("");
  /* textes joueur en textContent */
  [...el.querySelectorAll(".ligneClassement")].forEach((n,i)=>{
    const e = entries[i];
    texteSur(n.querySelector(".lcNom"), e.nomCinema);
    texteSur(n.querySelector(".lcMeta"),
      (e.pseudo || "—") + " · niveau " + (e.niveau||1) + (e.titre ? " · " + e.titre : ""));
  });
}

function rendPagination(p){
  const el = document.getElementById("paginationClassement");
  if(!p.total || p.total <= p.pageSize){ el.innerHTML = ""; return; }
  el.innerHTML = `
    <div class="pagination">
      <button class="btnPage" ${p.page<=1?"disabled":""} onclick="changePage(${p.page-1})">← Précédent</button>
      <span class="pageInfo">Page ${p.page}</span>
      <button class="btnPage" ${p.hasMore?"":"disabled"} onclick="changePage(${p.page+1})">Suivant →</button>
    </div>
    <div class="notePied">Classement actualisé récemment.</div>`;
}

/* ---------- Bob commente ---------- */
function commenteBob(moi){
  let t;
  if(!moi?.classe) t = "Ah, la concurrence. Souris poliment, puis programme mieux qu'eux.";
  else{
    const d = moi.data, part = d.rang / Math.max(1, d.total);
    if(d.rang === 1) t = "Premier ! Je prépare le discours. Il durera quarante-sept minutes.";
    else if(part <= .15) t = "Pas mal. J'ai toujours dit que ce cinéma avait du talent. Enfin, depuis ce matin.";
    else if(part <= .6) t = "On est au milieu de l'affiche. C'est mieux qu'en tout petit sous le nom du producteur.";
    else t = "Regarde le bon côté : on a beaucoup de places à gagner. Et aucune à perdre dans le sous-sol.";
  }
  const z = document.getElementById("zoneBob");
  if(z){ z.innerHTML = ""; z.appendChild(bobCompact(t)); }
}

/* ---- exports ---- */
export {
  CATEGORIES,
  bobDit,
  catActuelle,
  categorieParId,
  changeCategorie,
  changeFiltre,
  changePage,
  chargeClassement,
  commenteBob,
  filtreActuel,
  initClassement,
  memoriseVue,
  pageActuelle,
  rendCadreClassement,
  rendFiltres,
  rendListe,
  rendMaPosition,
  rendOngletsCat,
  rendPagination,
  restaureVue,
  saison
};

/* ---- gestionnaires en attribut ---- */
/* Ces fonctions sont appelées depuis des attributs onclick écrits
   dans le HTML généré. Un module ES n'expose rien globalement :
   on les rend accessibles explicitement. */
Object.assign(window, {
  changeCategorie,
  changeFiltre,
  changePage,
  memoriseVue
});
