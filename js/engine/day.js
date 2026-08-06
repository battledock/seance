import { parleBob } from "../cinema.js?v=2ab9afab";
import { Etat, chargeCinema, fmtArgent, rafraichirEtat } from "../game-state.js?v=2ab9afab";
import { majHeaderArgent } from "../navigation.js?v=2ab9afab";
import { declencheEvenement } from "../progression.js?v=2ab9afab";
import { bulleConseil } from "../screenings.js?v=2ab9afab";
import { toastSocial } from "../social.js?v=2ab9afab";
import {
  idOperation,
  messageErreur,
  rpc,
  sbFetch,
  statutSauvegarde
} from "../supabase-client.js?v=2ab9afab";
import { icone } from "../ui/icons.js?v=2ab9afab";

/* ============================================================
   CYCLE DE LA JOURNÉE — ouverture, exécution, bilan, jour suivant
   Statuts : draft → validated → running → completed
   ============================================================ */

/* ---------- lecture / création de la journée courante ---------- */
async function chargeJournee(force = false){
  const c = Etat.cinema;
  try{
    const d = await sbFetch(`journees?cinema_id=eq.${c.id}&jour=eq.${c.jour}&select=*`);
    if(Array.isArray(d) && d.length){ Etat.journee = d[0]; return d[0]; }
    const res = await sbFetch("journees", {method:"POST", body:{
      cinema_id:c.id, user_id:Etat.session?.user_id, jour:c.jour, statut:"draft"
    }});
    Etat.journee = (Array.isArray(res) && res[0]) || {jour:c.jour, statut:"draft"};
  }catch(e){ Etat.journee = Etat.journee || {jour:c.jour, statut:"draft"}; }
  return Etat.journee;
}

function statutJournee(){ return Etat.journee?.statut || "draft"; }
function bilanDisponible(){ return statutJournee() === "running" && Etat.journee?.resultats; }

/* ---------- vérifications avant ouverture ---------- */
function verifieOuverture(){
  const s = Etat.seancesJour || [];
  if(statutJournee() === "running")   return {ok:false, code:"deja_lancee", msg:"La journée est déjà lancée. Va voir le bilan."};
  if(statutJournee() === "completed") return {ok:false, code:"deja_terminee", msg:"Cette journée est terminée. Passe au jour suivant."};
  if(s.length === 0)                  return {ok:false, code:"aucune_seance", msg:"Aucune séance au programme. On n'ouvre pas un cinéma vide."};
  /* Le joueur ne valide plus : ouvrir vaut validation, et c'est le
     serveur qui fait passer les séances en « validated ». Exiger ici
     un statut que plus rien ne pose bloquait toute ouverture. */
  const licences = s.reduce((t,x)=>t + Number(x.cout_licence||0), 0);
  if(Number(Etat.cinema.argent) < licences)
    return {ok:false, code:"argent", licences,
      msg:"On ne peut pas louer les films avec des tickets de tombola. Il manque de l'argent dans la caisse."};
  return {ok:true, licences};
}

/* ---------- ouverture + simulation (calculées par le serveur) ---------- */
/* Bob n'a pas de bulle sur toutes les pages d'où l'on peut ouvrir :
   on dit le refus là où le joueur regarde. */
function refusOuverture(msg){
  if(typeof parleBob === "function" && document.getElementById("bulleTexteAccueil"))
    return parleBob("« " + msg + " »");
  if(typeof bulleConseil === "function") return bulleConseil(msg);
  if(typeof toastSocial === "function") return toastSocial(msg, "cloche");
  alert(msg);
}

async function ouvreCinema(){
  const v = verifieOuverture();
  if(!v.ok){ refusOuverture(v.msg); return; }

  const op = idOperation();
  let reponse;
  try{
    statutSauvegarde("encours");
    reponse = await rpc("simuler_journee", {p_cinema_id: Etat.cinema.id, p_operation_id: op});
    statutSauvegarde("ok");
  }catch(e){
    statutSauvegarde("erreur");
    /* le calcul a peut-être abouti : on recharge avant de conclure */
    await rafraichirEtat().catch(()=>null);
    if(Etat.journee?.resultats){ location.href = "bilan.html"; return; }
    refusOuverture(messageErreur(e));
    return;
  }

  if(!reponse?.success){
    if(reponse?.code === "ALREADY_RUNNING"){ location.href = "bilan.html"; return; }
    const M = {
      INSUFFICIENT_FUNDS:"On ne peut pas louer les films avec des tickets de tombola. Il manque de l'argent dans la caisse.",
      NO_SCREENINGS:"Aucune séance au programme. On n'ouvre pas un cinéma vide.",
      ALREADY_COMPLETED:"Cette journée est terminée. Passe au jour suivant."
    };
    refusOuverture(M[reponse?.code] || "La machine a toussé. Réessaie.");
    return;
  }

  const bilan = reponse.data;
  Etat.journee = {...(Etat.journee||{}), statut:"running", resultats:bilan};

  /* L'XP qui récompensait la validation suit le geste qui l'a remplacée :
     composer un programme et ouvrir, c'est la même chose désormais. */
  try{
    if(typeof declencheEvenement === "function"){
      await declencheEvenement("PROGRAMME_VALIDE");
      if((Etat.seancesJour || []).length >= 3)
        await declencheEvenement("TROIS_SEANCES_PROGRAMMEES");
    }
  }catch(e){}
  await chargeCinema(true);
  majHeaderArgent();
  await sequenceOuverture(bilan);
  location.href = "bilan.html";
}

/* ---------- séquence animée d'ouverture ---------- */
function sequenceOuverture(bilan){
  return new Promise(resolve=>{
    const reduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const o = document.createElement("div");
    o.className = "voileSeance";
    o.innerHTML = `<div class="seqBoite">
      <div class="seqTitre" id="seqTitre">Les portes s'ouvrent…</div>
      <div class="seqScene" id="seqScene"></div>
      <div class="seqBob" id="seqBob"></div>
    </div>`;
    document.body.appendChild(o);

    const titre = o.querySelector("#seqTitre");
    const scene = o.querySelector("#seqScene");
    const bulle = o.querySelector("#seqBob");
    const pas = reduit ? 120 : 1;

    const etapes = [];
    etapes.push({d: reduit?200:1400, f:()=>{
      scene.innerHTML = `<div class="seqPortes"><span></span><span></span></div>`;
      bulle.textContent = "« Ouvrez tout ! Le quartier attend depuis ce matin. »";
    }});
    bilan.resultats.forEach((r,i)=>{
      etapes.push({d: reduit?150:1500, f:()=>{
        titre.textContent = r.heure;
        scene.innerHTML = `
          <div class="seqSeance">
            <div class="seqFilm">${r.titre}</div>
            <div class="seqSalle">${r.salle} · ${r.capacite} places</div>
            <div class="seqJauge"><i id="jauge${i}"></i></div>
            <div class="seqCompte" id="compte${i}">0 / ${r.capacite} spectateurs</div>
          </div>`;
        const barre = document.getElementById("jauge"+i);
        const cpt   = document.getElementById("compte"+i);
        const cible = r.spectateurs;
        if(reduit){
          barre.style.width = (cible/r.capacite*100)+"%";
          cpt.textContent = `${cible} / ${r.capacite} spectateurs`;
        }else{
          let n = 0;
          const inc = Math.max(1, Math.round(cible/26));
          const t = setInterval(()=>{
            n = Math.min(cible, n+inc);
            barre.style.width = (n/r.capacite*100)+"%";
            cpt.textContent = `${n} / ${r.capacite} spectateurs`;
            if(n >= cible) clearInterval(t);
          }, 40);
        }
        bulle.textContent = r.incident_texte ? "« " + r.incident_texte + " »" : "";
      }});
      etapes.push({d: reduit?120:1100, f:()=>{
        scene.innerHTML = `
          <div class="seqResultat">
            <div class="seqLigne"><b>${r.spectateurs}</b> billets vendus</div>
            <div class="seqLigne"><b>${fmtArgent(r.brut)}</b> de recettes</div>
            <div class="seqLigne">Satisfaction : <b>${r.satisfaction} %</b></div>
          </div>`;
      }});
    });
    etapes.push({d: reduit?200:1300, f:()=>{
      titre.textContent = "La journée est terminée.";
      scene.innerHTML = `<div class="seqFin">${icone("pellicule","icoFin")}</div>`;
      bulle.textContent = "« Bob prépare le bilan. »";
    }});

    let i = 0;
    (function suite(){
      if(i >= etapes.length){
        o.classList.add("sortie");
        setTimeout(()=>{ o.remove(); resolve(); }, 320);
        return;
      }
      const e = etapes[i++];
      e.f();
      setTimeout(suite, e.d);
    })();
  });
}

/* ============================================================
   XP DE LA JOURNÉE — calculée et attribuée par simuler_journee().
   Le client se contente de lire le total pour l'afficher.
   ============================================================ */
function xpDeLaJournee(bilan){ return Number(bilan?.xp_gagnee || 0); }

/* les gains d'XP hors journée passent aussi par le serveur */
async function journaliseXp(type, montant, cleUnique){ return false; }
async function journaliseXpSimple(type, montant, cleUnique){ return 0; }

/* ---------- statistiques cumulées (futur classement) ---------- */
/* les statistiques officielles sont mises à jour par terminer_journee() */
async function majStatsCinema(){ return; }

async function chargeStats(){
  try{
    const d = await sbFetch(`stats_cinema?cinema_id=eq.${Etat.cinema.id}&select=*`);
    Etat.stats = (Array.isArray(d) && d[0]) || {};
  }catch(e){ Etat.stats = {}; }
  return Etat.stats;
}

/* ============================================================
   PASSAGE AU JOUR SUIVANT
   ============================================================ */
async function passeAuJourSuivant(bilan){
  const op = idOperation();
  let r;
  try{
    statutSauvegarde("encours");
    r = await rpc("terminer_journee", {p_cinema_id: Etat.cinema.id, p_operation_id: op});
    statutSauvegarde("ok");
  }catch(e){
    statutSauvegarde("erreur");
    await rafraichirEtat().catch(()=>null);
    /* si le jour a avancé, la clôture est passée malgré l'erreur réseau */
    if(!Etat.journee || Etat.journee.statut === "draft"){ location.href = "jeu.html"; return; }
    parleBobBilan(messageErreur(e));
    return;
  }
  if(!r?.success && r?.code !== "ALREADY_COMPLETED"){
    parleBobBilan(r?.message || "La clôture a échoué.");
    return;
  }
  Etat.seancesJour = [];
  Etat.journee = null;
  location.href = "jeu.html";
}
function parleBobBilan(msg){
  const b = document.getElementById("btnSuivant");
  if(b){ b.disabled = false; b.textContent = msg; }
}

/* ============================================================
   TRANSACTIONS — historique économique complet
   ============================================================ */
async function enregistreTransaction({categorie, montant, solde_avant, solde_apres, salle_id, details}){
  try{
    await sbFetch("transactions", {method:"POST", prefer:"return=minimal", body:{
      cinema_id: Etat.cinema.id, user_id: Etat.session?.user_id, salle_id: salle_id || null,
      jour: Etat.cinema.jour, categorie, montant,
      solde_avant, solde_apres, details: details || null
    }});
  }catch(e){}
}

/* l'usure des salles est appliquée par simuler_journee() côté serveur */

/* ---- exports ---- */
export {
  bilanDisponible,
  chargeJournee,
  chargeStats,
  enregistreTransaction,
  journaliseXp,
  journaliseXpSimple,
  majStatsCinema,
  ouvreCinema,
  parleBobBilan,
  passeAuJourSuivant,
  refusOuverture,
  sequenceOuverture,
  statutJournee,
  verifieOuverture,
  xpDeLaJournee
};
