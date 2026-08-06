import { fmtDureeHeures } from "../../data/films.js?v=2ab9afab";
import { Etat } from "../../game-state.js?v=2ab9afab";
import { actionSoc, toastSocial } from "../../social.js?v=2ab9afab";
import { rpc } from "../../supabase-client.js?v=2ab9afab";
import { echappe, texteSur } from "../../ui/emblems.js?v=2ab9afab";
import { icone } from "../../ui/icons.js?v=2ab9afab";

/* ============================================================
   ÉVÉNEMENTS COMMUNAUTAIRES — lecture seule, contributions serveur
   ============================================================ */
let evenementCourant = null;

const RECOMPENSES_EVENEMENT = {
  affiche_fete:  {nom:"Affiche de la Fête",       ic:"pellicule", desc:"Une affiche exclusive pour ton hall."},
  badge_fete:    {nom:"Badge communautaire",      ic:"etoile",    desc:"Le badge de la Fête du cinéma."},
  plaque_fete:   {nom:"Plaque « Salle animée »",  ic:"batiment",  desc:"À visser près de l'entrée."},
  enseigne_fete: {nom:"Enseigne lumineuse",       ic:"outil",     desc:"Une enseigne festive exclusive."},
  badge_duo_projection:{nom:"Partenaires de projection", ic:"spectateurs", desc:"Badge de duo."},
  badge_duo_comble:{nom:"Duo de salles pleines",  ic:"fauteuil",  desc:"Badge de duo."},
  badge_duo_soin:{nom:"Cinémas bien tenus",       ic:"etoile",    desc:"Badge de duo."},
  badge_duo_curieux:{nom:"Programmateurs curieux",ic:"pellicule", desc:"Badge de duo."}
};
function infoRecompense(cle){
  return RECOMPENSES_EVENEMENT[cle] || {nom:cle, ic:"etoile", desc:"Récompense cosmétique."};
}
function fmtNb(n){ return (Number(n)||0).toLocaleString("fr-FR"); }


async function initEvenements(){
  const el = document.getElementById("contenuEvenements");
  let liste;
  try{ liste = await rpc("get_active_community_events"); }
  catch(e){ el.innerHTML = messageAucunEvenement("Le réseau a mangé la bobine."); return; }

  const actifs = liste?.entries || [];
  if(actifs.length === 0){
    el.innerHTML = messageAucunEvenement(
      "Aucun festival n'est actuellement à l'affiche. Bob prépare les prochaines bobines.");
    return;
  }
  await ouvreEvenement(actifs[0].cle);
}

function messageAucunEvenement(texte){
  return `<section class="carteEcran vitrineFermee">
    <div class="vfIco">${icone("pellicule","icoVerrou")}</div>
    <h2 style="justify-content:center;border:none">Écran éteint</h2>
    <div class="vide">${echappe(texte)}</div>
  </section>`;
}

async function ouvreEvenement(cle){
  const el = document.getElementById("contenuEvenements");
  el.innerHTML = `<div class="vide">Chargement…</div>`;
  let r;
  try{ r = await rpc("get_community_event_details", {p_cle: cle}); }
  catch(e){ el.innerHTML = messageAucunEvenement("Le réseau a mangé la bobine."); return; }
  if(!r?.success){ el.innerHTML = messageAucunEvenement(r?.message || "Événement introuvable."); return; }

  evenementCourant = r;
  const e = r.event;
  const pct = Math.min(100, Math.round((Number(e.total)/Math.max(1,Number(e.objectif)))*100));

  el.innerHTML = `
    <section class="carteEcran carteEvenement">
      <div class="evEntete">
        <div class="evNomGrand" id="evNomGrand"></div>
        <div class="evDesc" id="evDesc"></div>
      </div>

      <div class="evGlobal">
        <div class="evChiffres"><b>${fmtNb(e.total)}</b> / ${fmtNb(e.objectif)} ${libelleType(e.type)}</div>
        <div class="pisteEvenement"><div class="barreEvenement" id="barreEv"></div></div>
        <div class="evMeta">
          <span>${pct} %</span>
          <span>${icone("spectateurs")} ${fmtNb(e.participants)} participant${e.participants>1?"s":""}</span>
          <span>${icone("horloge")} ${fmtDureeHeures(e.heuresRestantes)}</span>
        </div>
      </div>

      <div class="maContribution">
        ${icone("etoile")}
        <span>Ta contribution : <b>${fmtNb(e.maContribution)}</b> ${libelleType(e.type)}</span>
      </div>
      ${!e.accessible ? `<div class="evVerrou">Accessible au niveau ${e.niveauMinimum}.</div>` : ""}
    </section>

    <section class="carteEcran">
      <h2>Paliers communautaires</h2>
      <div id="listePaliers"></div>
    </section>

    <section class="carteEcran">
      <h2>Passeport du festival</h2>
      <p class="sousTitrePerso">Tes objectifs personnels, adaptés à ton niveau.</p>
      <div id="listeTaches"></div>
    </section>`;

  texteSur(document.getElementById("evNomGrand"), e.nom);
  texteSur(document.getElementById("evDesc"), e.description || "");
  setTimeout(()=>{ const b = document.getElementById("barreEv"); if(b) b.style.width = pct + "%"; }, 120);

  rendPaliers(r.milestones || [], e);
  rendTaches(r.tasks || []);
}

function libelleType(t){
  return {spectateurs:"spectateurs", journees:"journées", salles_completes:"séances complètes",
          genres:"genres", journees_satisfaites:"journées réussies"}[t] || "points";
}

function rendPaliers(paliers, e){
  const el = document.getElementById("listePaliers");
  if(paliers.length === 0){ el.innerHTML = `<div class="vide">Aucun palier.</div>`; return; }
  el.innerHTML = paliers.map(p=>{
    const info = infoRecompense(p.recompense);
    let etat, bouton = "";
    if(p.reclame){ etat = `<span class="palEtat obtenu">${icone("etoile")} Obtenue</span>`; }
    else if(p.eligible){
      etat = `<span class="palEtat pret">Disponible</span>`;
      bouton = `<button class="btnOr btnReclamerEv" onclick="reclameRecompenseEv('${p.recompense}', this)">Récupérer</button>`;
    }
    else if(p.atteint){
      etat = `<span class="palEtat manque">Encore ${fmtNb(Math.max(0, p.contributionMin - e.maContribution))} pour toi</span>`;
    }
    else etat = `<span class="palEtat attente">${fmtNb(p.objectif)} requis</span>`;

    return `<div class="lignePalier ${p.atteint?'atteint':''}">
      ${icone(info.ic)}
      <span class="lpTxt">
        <b>${echappe(p.nom)}</b>
        <small>${echappe(info.nom)} · ${fmtNb(p.objectif)} ${libelleType(e.type)}
          ${p.contributionMin ? " · ta part : " + fmtNb(p.contributionMin) : ""}</small>
      </span>
      ${etat}${bouton}
    </div>`;
  }).join("");
}

function rendTaches(taches){
  const el = document.getElementById("listeTaches");
  if(taches.length === 0){ el.innerHTML = `<div class="vide">Aucune mission pour ton niveau.</div>`; return; }
  el.innerHTML = taches.map(t=>{
    const pct = Math.min(100, Math.round((Number(t.progression)/Math.max(1,Number(t.objectif)))*100));
    return `<div class="ligneTache ${t.termine?'faite':''}">
      <span class="ltCase">${t.termine ? icone("etoile") : ""}</span>
      <span class="ltTxt">
        <b>${echappe(t.nom)}</b>
        <small>${echappe(t.description || "")}</small>
        <span class="ltPiste"><i style="width:${pct}%"></i></span>
        <small class="ltChiffres">${fmtNb(t.progression)} / ${fmtNb(t.objectif)}</small>
      </span>
    </div>`;
  }).join("");
}

async function reclameRecompenseEv(recompense, bouton){
  const cle = evenementCourant?.event?.cle;
  if(!cle) return;
  const r = await actionSoc(bouton, ()=>rpc("claim_community_event_reward",
    {p_cle_evenement: cle, p_recompense: recompense}));
  if(!r?.success) return;
  toastSocial("Récompense récupérée : " + infoRecompense(recompense).nom, "etoile");
  await ouvreEvenement(cle);
}

/* bandeau d'accroche sur l'accueil */
async function bandeauEvenement(){
  const el = document.getElementById("bandeauEvenement");
  if(!el) return;
  try{
    const r = await rpc("get_active_community_events");
    const e = (r?.entries || [])[0];
    Etat.festivalActif = !!e;   /* la façade pavoise pendant un festival */
    if(!e){ el.innerHTML = ""; return; }
    const pct = Math.min(100, Math.round((Number(e.total)/Math.max(1,Number(e.objectif)))*100));
    el.innerHTML = `<a class="lienEvenement" href="evenements.html">
      ${icone("pellicule")}
      <span class="leTxt"><b class="leNom"></b>
        <span class="lePiste"><i style="width:${pct}%"></i></span>
        <small>${pct} % · ${fmtDureeHeures(e.heuresRestantes)} restantes</small></span>
      <span class="rFleche">→</span></a>`;
    texteSur(el.querySelector(".leNom"), e.nom);
  }catch(err){ el.innerHTML = ""; }
}

/* ---- exports ---- */
export {
  RECOMPENSES_EVENEMENT,
  bandeauEvenement,
  evenementCourant,
  fmtNb,
  infoRecompense,
  initEvenements,
  libelleType,
  messageAucunEvenement,
  ouvreEvenement,
  reclameRecompenseEv,
  rendPaliers,
  rendTaches
};

/* ---- gestionnaires en attribut ---- */
/* Ces fonctions sont appelées depuis des attributs onclick écrits
   dans le HTML généré. Un module ES n'expose rien globalement :
   on les rend accessibles explicitement. */
Object.assign(window, {
  reclameRecompenseEv
});
