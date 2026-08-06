/* Le studio : bureau, assistant de production, filmothèque. */

import { afficheXpServeur } from "./rooms.js?v=2ab9afab";
import { brancheBureau, bureauStudio } from "./ui/desk.js?v=2ab9afab";
import { chargeCinema } from "./game-state.js?v=2ab9afab";
import { echappe } from "./ui/emblems.js?v=2ab9afab";
import { idOperation } from "./api.js?v=2ab9afab";
import { majHeaderArgent } from "./navigation.js?v=2ab9afab";
import { messageErreur } from "./supabase-client.js?v=2ab9afab";
import { Etat, fmtArgent } from "./game-state.js?v=2ab9afab";
import { bobCompact } from "./navigation.js?v=2ab9afab";
import { niveauActuel } from "./progression.js?v=2ab9afab";
import { toastSocial } from "./social.js?v=2ab9afab";
import { appelSecurise, rpc } from "./supabase-client.js?v=2ab9afab";
import { texteSur } from "./ui/emblems.js?v=2ab9afab";
import { icone } from "./ui/icons.js?v=2ab9afab";
import { afficheFilmSVG, propositionsAffiche } from "./ui/poster.js?v=2ab9afab";

/* ============================================================
   STUDIO — production de courts-métrages
   Tous les coûts et scores viennent du serveur.
   ============================================================ */
let studioData = null;
let projet = {etape:1, titre:"", genre:null, scenario:null,
              realisateur:null, acteur:null, technicien:null, budget:null, id:null};

const TITRES_PROPOSES = [
  "La Dernière Séance","Les Ombres du Passage","Minuit sur le Toit",
  "Le Secret de la Rue Bleue","Un Été sans Générique","La Ville aux Cent Lumières",
  "Le Rang Douze","Personne au Balcon","Les Mardis de Novembre"
];

async function initStudio(){
  await chargeStudio();
  if(!studioData?.studioOuvert){ rendStudioVerrouille(); return; }
  rendStudio();
}

async function chargeStudio(){
  try{
    studioData = await rpc("get_my_productions", {p_cinema_id: Etat.cinema.id});
  }catch(e){ studioData = null; }
  return studioData;
}

/* ---------- studio verrouillé ---------- */
function rendStudioVerrouille(){
  const niv = studioData?.niveau || niveauActuel();
  document.getElementById("contenuStudio").innerHTML = `
    <section class="carteEcran studioVerrou">
      <div class="verrouIco">${icone("camera","icoVerrou")}</div>
      <h2 style="justify-content:center;border:none">Le studio est fermé</h2>
      <p class="verrouTxt">Disponible au <b>niveau 20</b>. Tu es niveau ${niv}.</p>
      <div class="listeAVenir">
        ${[["pellicule","Écrire des scénarios"],["spectateurs","Recruter une équipe"],
           ["camera","Tourner des courts-métrages"],["etoile","Projeter tes propres créations"]]
          .map(([i,t])=>`<div class="ligneRecit">${icone(i)}<span>${t}</span></div>`).join("")}
      </div>
    </section>`;
  document.getElementById("zoneBob").appendChild(bobCompact(
    "Pour l'instant, on projette les films des autres. Mais j'ai gardé une vieille caméra dans la réserve. Elle fonctionne quand elle veut."));
}

/* ---------- studio ouvert ---------- */
function rendStudio(){
  const prods = studioData.productions || [];
  const enCours = prods.filter(p=>["brouillon","tournage","postproduction"].includes(p.statut));
  const finis = prods.filter(p=>["termine","sorti"].includes(p.statut));

  document.getElementById("contenuStudio").innerHTML = `
    <div class="cadreBureau" id="cadreBureau"></div>
    <div class="indiceBureau">Touche un objet du bureau pour commencer.</div>

    ${enCours.length ? `<section class="carteEcran" id="blocProduction">
      <h2>Sur le plateau</h2>
      ${enCours.map(p=>carteProduction(p)).join("")}
    </section>` : `
      <button class="btnRouge btnCreerFilm" onclick="ouvreAssistant()">
        ${icone("camera")} Créer un film</button>`}

    <section class="carteEcran" id="blocFilms">
      <h2>La filmothèque${finis.length ? " · " + finis.length : ""}</h2>
      ${finis.length ? `<div class="grilleFilms">${finis.map(p=>carteFilm(p)).join("")}</div>`
        : `<div class="vide">Aucun film pour l'instant.<br><small>Le premier reste le plus difficile.</small></div>`}
    </section>`;

  const cadre = document.getElementById("cadreBureau");
  if(cadre && typeof bureauStudio === "function"){
    cadre.innerHTML = bureauStudio(prods);
    brancheBureau(cadre, prods);
  }

  [...document.querySelectorAll(".titreProd")].forEach(n=>texteSur(n, n.dataset.titre));
  const s = enCours[0];
  document.getElementById("zoneBob").appendChild(bobCompact(
    s ? (s.statut === "brouillon" ? "Le projet attend ton feu vert. Le costume est prêt, moi aussi."
       : "Silence sur le plateau ! Enfin, sauf la chaudière. Elle n'a jamais respecté personne.")
      : "Notre premier film ! J'ai déjà préparé mon discours pour la cérémonie. Et mon costume. Surtout mon costume."));
}

function carteProduction(p){
  const pct = Math.round((p.joursFaits / Math.max(1,p.joursRequis)) * 100);
  return `<div class="carteProd">
    <div class="cpTitre titreProd" data-titre="${echappe(p.titre)}"></div>
    <div class="cpMeta">${echappe(libelleGenre(p.genre))} · ${p.statut === "brouillon"
      ? "Projet à finaliser" : "Tournage"}</div>
    ${p.statut === "brouillon"
      ? `<button class="btnOr btnReprendre" onclick="reprendProjet('${p.id}')">Reprendre le projet</button>`
      : `<div class="cpProgression">
           <div class="pisteEvenement"><div class="barreEvenement" style="width:${pct}%"></div></div>
           <div class="cpJours">${p.joursFaits} / ${p.joursRequis} jour${p.joursRequis>1?"s":""} de tournage</div>
           <div class="notePied">Termine des journées pour faire avancer le tournage.</div>
         </div>`}
  </div>`;
}

function carteFilm(p){
  const s = p.stats || {};
  const resultat = s.recettes != null ? Number(s.recettes) - Number(p.budget) : null;
  return `<div class="carteFilm">
    <div class="cfAffiche">${afficheFilmSVG(p.affiche, p.titre,
      libelleGenre(p.genre) + " · " + (p.duree||0) + " min", 120)}</div>
    <div class="cfCorps">
      <div class="cfTitre titreProd" data-titre="${echappe(p.titre)}"></div>
      <div class="cfMeta">${echappe(libelleGenre(p.genre))} · ${p.duree||0} min</div>
      <div class="cfScores">
        <span>${icone("etoile")} ${p.qualite ?? "—"}</span>
        <span>${icone("spectateurs")} ${p.scorePublic ?? "—"}</span>
        <span>${icone("journal")} ${p.scoreCritique ?? "—"}</span>
      </div>
      ${s.seances ? `<div class="cfStats">
        ${fmtNombre(s.spectateurs||0)} spectateurs · ${fmtArgent(s.recettes||0)}
        ${resultat != null ? `<br><b class="${resultat>=0?'positif':'negatif'}">
          ${resultat>=0?"Rentable ":"Résultat "}${resultat>=0?"+":"−"}${fmtArgent(Math.abs(resultat))}</b>` : ""}
      </div>` : `<div class="cfStats">Jamais projeté.</div>`}
      <div class="cfActions">
        <a class="btnMiniOr" href="programmation.html">Programmer</a>
        <button class="btnMiniGris" onclick="ouvreFicheFilm('${p.id}')">Fiche</button>
      </div>
    </div>
  </div>`;
}
function libelleGenre(cle){
  const g = (studioData?.genres || []).find(x=>x.cle === cle);
  return g ? g.libelle : cle;
}
function fmtNombre(n){ return (Number(n)||0).toLocaleString("fr-FR"); }

/* ============================================================
   ASSISTANT DE CRÉATION — 6 étapes
   ============================================================ */
function ouvreAssistant(reprise){
  projet = reprise || {etape:1, titre:"", genre:null, scenario:null,
    realisateur:null, acteur:null, technicien:null, budget:null, id:null};
  const o = document.createElement("div");
  o.className = "voilePanneau"; o.id = "voileStudio";
  o.innerHTML = `<div class="panneauSeance">
    <div class="pnEnteteSalle">
      <span class="pnTitre">Nouveau film</span>
      <span class="pnSous" id="pnEtape"></span>
      <button class="pnFermer" onclick="fermeAssistant()" aria-label="Fermer">✕</button>
    </div>
    <div class="pnCorps" id="corpsAssistant"></div>
  </div>`;
  document.body.appendChild(o);
  rendEtape();
}
function fermeAssistant(){
  const o = document.getElementById("voileStudio");
  if(o){ o.classList.add("sortie"); setTimeout(()=>o.remove(), 260); }
}
function etapeSuivante(){ projet.etape++; rendEtape(); }
function etapePrecedente(){ projet.etape = Math.max(1, projet.etape - 1); rendEtape(); }

function rendEtape(){
  const el = document.getElementById("corpsAssistant");
  texteSur(document.getElementById("pnEtape"), "Étape " + projet.etape + " sur 6");
  const R = {1:etapeTitre, 2:etapeGenre, 3:etapeScenario, 4:etapeEquipe, 5:etapeBudget, 6:etapeConfirmation};
  el.innerHTML = (R[projet.etape] || etapeTitre)();
  if(projet.etape === 1) document.getElementById("champTitre").value = projet.titre || "";
  el.scrollTop = 0;
}
function boutonsEtape(suivantActif, labelSuivant){
  return `<div class="ccBoutons">
    ${projet.etape > 1 ? `<button class="btnAnnuler" onclick="etapePrecedente()">Retour</button>` : ""}
    <button class="btnOr btnOuvrir" ${suivantActif?"":"disabled"}
      onclick="${projet.etape === 6 ? "lanceProduction(this)" : "etapeSuivante()"}">
      ${labelSuivant || "Continuer"}</button>
  </div>`;
}

/* --- 1. titre --- */
function etapeTitre(){
  return `<label class="lblProg">Le titre du film</label>
    <div class="ligneTitre">
      <input id="champTitre" type="text" maxlength="40" placeholder="Ton titre"
        oninput="majTitre(this.value)">
      <button class="btnRouge btnIdee" onclick="titreAuHasard()" title="Proposer un titre">?</button>
    </div>
    <div class="noteEtape">3 à 40 caractères. Il pourra devenir public si tu le décides.</div>
    ${boutonsEtape((projet.titre||"").trim().length >= 3)}`;
}
function majTitre(v){
  projet.titre = v;
  const b = document.querySelector("#corpsAssistant .btnOuvrir");
  if(b) b.disabled = v.trim().length < 3;
}
function titreAuHasard(){
  projet.titre = TITRES_PROPOSES[Math.floor(Math.random()*TITRES_PROPOSES.length)];
  document.getElementById("champTitre").value = projet.titre;
  majTitre(projet.titre);
}

/* --- 2. genre --- */
function etapeGenre(){
  const g = studioData.genres || [];
  return `<label class="lblProg">Le genre</label>
    ${g.map(x=>`
      <button class="optBudget ${projet.genre===x.cle?'sel':''} ${x.accessible?'':'desactive'}"
        ${x.accessible?`onclick="choisitGenre('${x.cle}', this)"`:"disabled"}>
        <span class="obNom">${echappe(x.libelle)}${x.accessible?"":`<b>Niveau ${x.niveauRequis}</b>`}</span>
        <span class="obDesc">${descriptifGenre(x)}</span>
      </button>`).join("")}
    ${boutonsEtape(!!projet.genre)}`;
}
function descriptifGenre(x){
  const pub = x.public >= 1.1 ? "grand public" : x.public <= 0.8 ? "public de niche" : "public moyen";
  const cri = x.critique >= 1.1 ? "apprécié des critiques" : x.critique <= 0.9 ? "boudé des critiques" : "accueil neutre";
  const co  = x.cout >= 1.2 ? "coûteux" : x.cout <= 0.9 ? "économique" : "coût moyen";
  return pub + " · " + cri + " · " + co;
}
function choisitGenre(cle, btn){
  projet.genre = cle;
  document.querySelectorAll("#corpsAssistant .optBudget").forEach(b=>b.classList.remove("sel"));
  btn.classList.add("sel");
  const s = document.querySelector("#corpsAssistant .btnOuvrir"); if(s) s.disabled = false;
}

/* --- 3. scénario : trois propositions --- */
function etapeScenario(){
  const tous = studioData.scenarios || [];
  if(!projet._propositions){
    const melange = tous.slice().sort(()=>Math.random()-0.5);
    projet._propositions = melange.slice(0, 3);
  }
  return `<label class="lblProg">L'idée de départ</label>
    ${projet._propositions.map(s=>`
      <button class="optBudget ${projet.scenario===s.id?'sel':''}" onclick="choisitScenario('${s.id}', this)">
        <span class="obNom">${echappe(s.titre)}${s.coutSupp ? `<b>${Number(s.coutSupp)>0?"+":""}${fmtArgent(s.coutSupp)}</b>`:""}</span>
        <span class="obDesc">${echappe(s.description)}</span>
        <span class="obDesc">Originalité ${s.originalite} · complexité ${s.complexite < 40 ? "faible" : s.complexite < 60 ? "moyenne" : "élevée"}</span>
      </button>`).join("")}
    <button class="btnToutVoir" onclick="autresScenarios()">Autres propositions</button>
    ${boutonsEtape(!!projet.scenario)}`;
}
function autresScenarios(){ projet._propositions = null; projet.scenario = null; rendEtape(); }
function choisitScenario(id, btn){
  projet.scenario = id;
  document.querySelectorAll("#corpsAssistant .optBudget").forEach(b=>b.classList.remove("sel"));
  btn.classList.add("sel");
  const s = document.querySelector("#corpsAssistant .btnOuvrir"); if(s) s.disabled = false;
}

/* --- 4. équipe --- */
function etapeEquipe(){
  const t = studioData.talents || [];
  const bloc = (role, label, champ)=>`
    <label class="lblProg">${label}</label>
    ${t.filter(x=>x.role===role).map(x=>`
      <button class="optBudget ${projet[champ]===x.id?'sel':''}" onclick="choisitTalent('${champ}','${x.id}', this)">
        <span class="obNom">${echappe(x.nom)}<b>${x.cout ? fmtArgent(x.cout) : "bénévole"}</b></span>
        <span class="obDesc">${echappe(x.description||"")}</span>
        <span class="obDesc">Compétence ${x.competence}${x.popularite ? " · popularité " + x.popularite : ""}${
          (x.specialites||[]).length ? " · spécialité " + x.specialites.map(s=>libelleGenre(s)).join(", ") : ""}</span>
      </button>`).join("")}`;
  return bloc("realisateur","Réalisation","realisateur") +
         bloc("acteur","Rôle principal","acteur") +
         bloc("technicien","Technique","technicien") +
         boutonsEtape(!!(projet.realisateur && projet.acteur && projet.technicien));
}
function choisitTalent(champ, id, btn){
  projet[champ] = id;
  [...btn.parentElement.querySelectorAll(".optBudget")].forEach(b=>{
    if(b.getAttribute("onclick")?.includes("'"+champ+"'")) b.classList.remove("sel");
  });
  btn.classList.add("sel");
  const s = document.querySelector("#corpsAssistant .btnOuvrir");
  if(s) s.disabled = !(projet.realisateur && projet.acteur && projet.technicien);
}

/* --- 5. budget avec détail des coûts --- */
function coutEstime(palier){
  const b = (studioData.budgets || []).find(x=>x.cle === palier);
  const g = (studioData.genres || []).find(x=>x.cle === projet.genre);
  const s = (studioData.scenarios || []).find(x=>x.id === projet.scenario);
  const t = studioData.talents || [];
  const eq = ["realisateur","acteur","technicien"]
    .reduce((n,c)=>n + Number((t.find(x=>x.id===projet[c])||{}).cout || 0), 0);
  if(!b) return null;
  const base = Number(b.base) * Number(g?.cout || 1);
  const scen = Number(s?.coutSupp || 0);
  return {equipe:eq, materiel:Math.round(base*0.42), decors:Math.round(base*0.24) + scen,
          post:Math.round(base*0.34), jours:b.jours,
          total:Math.round(base + scen + eq)};
}
function etapeBudget(){
  const b = studioData.budgets || [];
  const d = projet.budget ? coutEstime(projet.budget) : null;
  return `<label class="lblProg">Le budget</label>
    ${b.map(x=>{
      const c = coutEstime(x.cle);
      return `<button class="optBudget ${projet.budget===x.cle?'sel':''}" onclick="choisitBudget('${x.cle}', this)">
        <span class="obNom">${echappe(x.libelle)}<b>${fmtArgent(c ? c.total : x.base)}</b></span>
        <span class="obDesc">${x.jours} jour${x.jours>1?"s":""} de tournage · ${
          x.cle==="minimal"?"qualité plus risquée":x.cle==="ambitieux"?"meilleur potentiel":"qualité stable"}</span>
      </button>`;
    }).join("")}
    ${d ? `<div class="detailCouts">
      <div><span>Équipe</span><b>${fmtArgent(d.equipe)}</b></div>
      <div><span>Matériel</span><b>${fmtArgent(d.materiel)}</b></div>
      <div><span>Décors</span><b>${fmtArgent(d.decors)}</b></div>
      <div><span>Postproduction</span><b>${fmtArgent(d.post)}</b></div>
      <div class="dcTotal"><span>Total</span><b>${fmtArgent(d.total)}</b></div>
      <div class="dcCaisse">En caisse : ${fmtArgent(Etat.cinema.argent)}</div>
    </div>` : ""}
    ${boutonsEtape(!!projet.budget)}`;
}
function choisitBudget(cle, btn){ projet.budget = cle; rendEtape(); }

/* --- 6. confirmation --- */
function etapeConfirmation(){
  const t = studioData.talents || [];
  const nom = id => (t.find(x=>x.id===id)||{}).nom || "—";
  const s = (studioData.scenarios || []).find(x=>x.id === projet.scenario);
  const d = coutEstime(projet.budget);
  const assez = Number(Etat.cinema.argent) >= (d?.total || 0);
  return `<div class="recapProjet">
      <div class="rpTitre" id="rpTitre"></div>
      <div class="rpMeta">Court-métrage ${echappe(libelleGenre(projet.genre).toLowerCase())}</div>
      <div class="ligneRecit">${icone("pellicule")}<span>${echappe(s?.titre || "")}</span></div>
      <div class="ligneRecit">${icone("camera")}<span>Réalisation : <b>${echappe(nom(projet.realisateur))}</b></span></div>
      <div class="ligneRecit">${icone("spectateurs")}<span>Rôle principal : <b>${echappe(nom(projet.acteur))}</b></span></div>
      <div class="ligneRecit">${icone("outil")}<span>Technique : <b>${echappe(nom(projet.technicien))}</b></span></div>
      <div class="ligneRecit">${icone("piece")}<span>Budget : <b>${fmtArgent(d?.total || 0)}</b></span></div>
      <div class="ligneRecit">${icone("horloge")}<span>Tournage : <b>${d?.jours || 1} jour(s) de jeu</b></span></div>
    </div>
    ${assez ? "" : `<div class="ccAlerte">On peut tourner sans effets spéciaux. Sans caméra, ça devient plus compliqué.</div>`}
    ${boutonsEtape(assez, "Lancer le tournage")}`;
}

/* ---------- lancement ---------- */
async function lanceProduction(bouton){
  const op = idOperation();
  bouton.disabled = true; bouton.textContent = "Moteur…";
  try{
    let id = projet.id;
    if(!id){
      const d = await rpc("create_production_draft", {p_cinema_id: Etat.cinema.id,
        p_titre: projet.titre, p_genre: projet.genre});
      if(!d?.success){ messageStudio(d); bouton.disabled = false; bouton.textContent = "Lancer le tournage"; return; }
      id = d.data.id; projet.id = id;
    }
    const r = await rpc("start_production", {p_production_id: id, p_scenario: projet.scenario,
      p_realisateur: projet.realisateur, p_acteur: projet.acteur, p_technicien: projet.technicien,
      p_budget: projet.budget, p_operation_id: op});
    if(!r?.success){ messageStudio(r); bouton.disabled = false; bouton.textContent = "Lancer le tournage"; return; }

    fermeAssistant();
    await chargeCinema(true); majHeaderArgent();
    await chargeStudio(); rendStudio();
    toastSocial("Silence sur le plateau ! Le tournage commence.", "camera");
    if(r.data?.xp > 0 && typeof afficheXpServeur === "function") await afficheXpServeur(r.data.xp, "Premier projet");
  }catch(e){
    await chargeStudio(); rendStudio();
    toastSocial(messageErreur(e));
  }
}
function messageStudio(r){
  const M = {STUDIO_LOCKED:"Le studio ouvre au niveau 20.",
    TITLE_TOO_SHORT:"Le titre fait 3 caractères au minimum.",
    GENRE_LOCKED:"Ce genre n'est pas encore débloqué.",
    TOO_MANY_PROJECTS:"Un seul projet à la fois pour l'instant.",
    INSUFFICIENT_FUNDS:"On peut tourner sans effets spéciaux. Sans caméra, ça devient plus compliqué.",
    ALREADY_STARTED:"Ce projet est déjà lancé."};
  toastSocial(M[r?.code] || r?.message || "La machine a toussé.");
}

async function reprendProjet(id){
  const p = (studioData.productions || []).find(x=>x.id === id);
  if(!p) return;
  ouvreAssistant({etape:2, titre:p.titre, genre:p.genre, scenario:null,
    realisateur:null, acteur:null, technicien:null, budget:null, id:p.id});
}

/* ============================================================
   FICHE D'UN FILM TERMINÉ
   ============================================================ */
function ouvreFicheFilm(id){
  const p = (studioData.productions || []).find(x=>x.id === id);
  if(!p) return;
  const s = p.stats || {};
  const resultat = s.recettes != null ? Number(s.recettes) - Number(p.budget) : -Number(p.budget);
  const o = document.createElement("div");
  o.className = "voilePanneau"; o.id = "voileFiche";
  o.innerHTML = `<div class="panneauSeance">
    <div class="pnEnteteSalle">
      <span class="pnTitre" id="ffTitre"></span>
      <span class="pnSous">${echappe(libelleGenre(p.genre))} · ${p.duree||0} minutes</span>
      <button class="pnFermer" onclick="fermeFiche()" aria-label="Fermer">✕</button>
    </div>
    <div class="pnCorps">
      <div class="ficheAffiche">${afficheFilmSVG(p.affiche, p.titre,
        libelleGenre(p.genre) + " · " + (p.duree||0) + " min", 170)}</div>

      <div class="grilleStats">
        <div><b>${p.qualite ?? "—"}</b><span>Qualité</span></div>
        <div><b>${p.scorePublic ?? "—"}</b><span>Public</span></div>
        <div><b>${p.scoreCritique ?? "—"}</b><span>Critique</span></div>
        <div><b>${s.popularite ?? p.popularite ?? "—"}</b><span>Popularité</span></div>
      </div>

      ${p.evenement ? `<div class="ligneRecit">${icone("cloche")}<span>${echappe(p.evenement)}</span></div>` : ""}

      <label class="lblProg">Rentabilité</label>
      <div class="detailCouts">
        <div><span>Budget de production</span><b>${fmtArgent(p.budget)}</b></div>
        <div><span>Recettes cumulées</span><b>${fmtArgent(s.recettes || 0)}</b></div>
        <div class="dcTotal"><span>Résultat</span>
          <b class="${resultat>=0?'positif':'negatif'}">${resultat>=0?"+":"−"}${fmtArgent(Math.abs(resultat))}</b></div>
      </div>
      ${s.seances ? `<div class="notePied">${s.seances} séance(s) · meilleure : ${s.meilleure} spectateurs
        · satisfaction ${s.satisfaction ?? "—"} %</div>` : ""}

      <label class="lblProg">L'affiche</label>
      <div class="choixAffiches" id="choixAffiches"></div>

      <label class="lblProg">Visibilité</label>
      <div class="choixVisibilite">
        ${[["public","Film public","Visible sur ton profil"],["prive","Film privé","Visible par toi seul"]]
          .map(([v,n,d])=>`<button class="optVisibilite ${p.visibilite===v?'sel':''}"
            onclick="majVisibiliteFilm('${p.id}','${v}')"><b>${n}</b><small>${d}</small></button>`).join("")}
      </div>
    </div>
  </div>`;
  document.body.appendChild(o);
  texteSur(document.getElementById("ffTitre"), p.titre);

  const props = propositionsAffiche(libelleGenre(p.genre));
  document.getElementById("choixAffiches").innerHTML = props.map((c,i)=>`
    <button class="vignetteAffiche" onclick='choisitAffiche("${p.id}", ${JSON.stringify(c)})'>
      ${afficheFilmSVG(c, p.titre, libelleGenre(p.genre), 90)}</button>`).join("");
}
function fermeFiche(){
  const o = document.getElementById("voileFiche");
  if(o){ o.classList.add("sortie"); setTimeout(()=>o.remove(), 260); }
}
async function choisitAffiche(id, config){
  const r = await appelSecurise(()=>rpc("choisir_affiche", {p_production_id:id, p_affiche:config}));
  if(!r.ok) return;
  await chargeStudio(); fermeFiche(); rendStudio();
  toastSocial("Affiche choisie.", "pellicule");
}
async function majVisibiliteFilm(id, v){
  const r = await appelSecurise(()=>rpc("set_production_visibility",
    {p_production_id:id, p_visibilite:v}));
  if(!r.ok) return;
  await chargeStudio(); fermeFiche(); rendStudio();
  toastSocial(v === "public" ? "Film publié sur ton profil." : "Film rendu privé.");
}

/* ---- exports ---- */
export {
  TITRES_PROPOSES,
  autresScenarios,
  boutonsEtape,
  carteFilm,
  carteProduction,
  chargeStudio,
  choisitAffiche,
  choisitBudget,
  choisitGenre,
  choisitScenario,
  choisitTalent,
  coutEstime,
  descriptifGenre,
  etapeBudget,
  etapeConfirmation,
  etapeEquipe,
  etapeGenre,
  etapePrecedente,
  etapeScenario,
  etapeSuivante,
  etapeTitre,
  fermeAssistant,
  fermeFiche,
  fmtNombre,
  initStudio,
  lanceProduction,
  libelleGenre,
  majTitre,
  majVisibiliteFilm,
  messageStudio,
  ouvreAssistant,
  ouvreFicheFilm,
  projet,
  rendEtape,
  rendStudio,
  rendStudioVerrouille,
  reprendProjet,
  studioData,
  titreAuHasard
};

/* ---- gestionnaires en attribut ---- */
/* Ces fonctions sont appelées depuis des attributs onclick écrits
   dans le HTML généré. Un module ES n'expose rien globalement :
   on les rend accessibles explicitement. */
Object.assign(window, {
  autresScenarios,
  choisitAffiche,
  choisitBudget,
  choisitGenre,
  choisitScenario,
  choisitTalent,
  etapePrecedente,
  etapeSuivante,
  fermeAssistant,
  fermeFiche,
  lanceProduction,
  majTitre,
  majVisibiliteFilm,
  ouvreAssistant,
  ouvreFicheFilm,
  reprendProjet,
  titreAuHasard
});
