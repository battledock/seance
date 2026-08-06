/* Réactions, abonnements, amitiés, blocage. */

import { rafraichirSocial } from "./pages/parts/community-social.js?v=2ab9afab";
import { messageErreur, rpc } from "./supabase-client.js?v=2ab9afab";
import { echappe, texteSur } from "./ui/emblems.js?v=2ab9afab";
import { icone } from "./ui/icons.js?v=2ab9afab";

/* ============================================================
   SOCIAL — réactions, abonnements, amis
   Aucun texte libre : uniquement des clés prédéfinies.
   ============================================================ */
const REACTIONS = {
  bravo:           {label:"Bravo",               icone:"etoile"},
  belle_facade:    {label:"Belle façade",        icone:"batiment"},
  programmation:   {label:"Super programmation", icone:"pellicule"},
  belle_salle:     {label:"Salle magnifique",    icone:"fauteuil"},
  film_prometteur: {label:"Film prometteur",     icone:"camera"},
  bonne_chance:    {label:"Bonne chance",        icone:"cloche"}
};

const MSG_SOCIAL = {
  UNAVAILABLE:"Cette interaction n'est pas disponible. Passons à la séance suivante.",
  SELF_REACTION:"On n'applaudit pas son propre film.",
  DAILY_LIMIT:"Doucement la vedette. Même les producteurs prennent une pause entre deux poignées de main.",
  ALREADY_SENT:"La demande est déjà partie. Un peu de patience.",
  ALREADY_FRIENDS:"Vous êtes déjà amis.",
  TOO_SOON:"Laisse passer quelques jours avant de redemander.",
  FOLLOW_LIMIT:"Tu suis déjà beaucoup de cinémas.",
  PENDING_LIMIT:"Trop de demandes en attente."
};

/* ---------- appel social protégé contre le double clic ---------- */
let actionSociale = false;
async function actionSoc(bouton, fn){
  if(actionSociale) return null;
  actionSociale = true;
  const texte = bouton ? bouton.textContent : null;
  if(bouton){ bouton.disabled = true; bouton.classList.add("chargement"); }
  try{
    const r = await fn();
    if(r && r.success === false) toastSocial(MSG_SOCIAL[r.code] || r.message || "Action impossible.");
    return r;
  }catch(e){
    toastSocial(messageErreur(e));
    return null;
  }finally{
    if(bouton){ bouton.disabled = false; bouton.classList.remove("chargement");
                if(texte !== null) bouton.textContent = texte; }
    actionSociale = false;
  }
}

function toastSocial(message, ic){
  const d = document.createElement("div");
  d.className = "toastSocial";
  d.innerHTML = `${icone(ic || "cloche")}<span class="tsTxt"></span>`;
  document.body.appendChild(d);
  texteSur(d.querySelector(".tsTxt"), message);
  setTimeout(()=>d.remove(), 3200);
}

/* ============================================================
   BARRE D'ACTIONS SOCIALES (vitrine et fin de visite)
   ============================================================ */
let relationSociale = null;

async function chargeRelation(publicId){
  try{
    const r = await rpc("get_social_relationship", {p_public_id: publicId});
    relationSociale = r?.success ? r : null;
  }catch(e){ relationSociale = null; }
  return relationSociale;
}

function rendActionsSociales(cible, publicId, opts = {}){
  const el = document.getElementById(cible);
  if(!el) return;
  const r = relationSociale;
  if(!r || r.estMoi){ el.innerHTML = ""; return; }

  const amitie = {
    aucune:  {texte:"Ajouter en ami", action:`demandeAmi('${publicId}', this)`},
    envoyee: {texte:"Demande envoyée", desactive:true},
    recue:   {texte:"Accepter la demande", action:`accepteAmi('${r.demandeId}', this)`},
    amis:    {texte:"Amis", action:`menuAmi('${publicId}')`}
  }[r.amitie] || {texte:"Ajouter en ami", action:`demandeAmi('${publicId}', this)`};

  el.innerHTML = `
    <div class="barreSociale">
      ${r.peutSuivre ? `<button class="btnSocial ${r.suit?'actif':''}" id="btnSuivre"
        onclick="basculeSuivi('${publicId}', this)">
        ${icone(r.suit?"etoile":"porte")}<span>${r.suit?"Suivi":"Suivre"}</span></button>` : ""}
      ${r.peutDemanderAmi ? `<button class="btnSocial ${r.amitie==='amis'?'actif':''}"
        ${amitie.desactive?"disabled":`onclick="${amitie.action}"`}>
        ${icone("spectateurs")}<span>${amitie.texte}</span></button>` : ""}
    </div>
    ${r.peutReagir ? `<div class="blocReactions">
      <div class="brTitre">${opts.titre || "Envoyer une réaction"}</div>
      <div class="grilleReactions">
        ${Object.entries(REACTIONS).map(([cle,x])=>`
          <button class="btnReaction ${r.reactionDuJour===cle?'actif':''}"
            onclick="envoieReaction('${publicId}','${cle}', this)">
            ${icone(x.icone)}<span>${x.label}</span></button>`).join("")}
      </div>
      ${r.reactionDuJour ? `<div class="brNote">Tu as déjà envoyé
        « ${echappe(REACTIONS[r.reactionDuJour]?.label || "")} » aujourd'hui — tu peux la changer.</div>` : ""}
    </div>` : ""}
    ${r.abonnes != null ? `<div class="compteurSocial">${icone("spectateurs")}
      ${r.abonnes} abonné${r.abonnes>1?"s":""}</div>` : ""}
    ${(r.resumeReactions||[]).length ? `<div class="resumeReactions">
      ${r.resumeReactions.map(x=>`<span class="pastReaction">${icone(x.icone)} ${x.nombre} ${echappe(x.libelle)}</span>`).join("")}
    </div>` : ""}
    <button class="lienDiscret" onclick="menuModeration('${publicId}')">Bloquer ce cinéma</button>`;
}

/* ---------- réactions ---------- */
async function envoieReaction(publicId, cle, bouton){
  const r = await actionSoc(bouton, ()=>rpc("envoyer_reaction",
    {p_public_id: publicId, p_cle: cle}));
  if(!r?.success) return;
  animeReaction(bouton, cle);
  await chargeRelation(publicId);
  rendActionsSociales(conteneurSocialActuel, publicId);
  toastSocial(phraseReaction(cle), REACTIONS[cle]?.icone);
}
function phraseReaction(cle){
  if(cle === "bravo") return "Un bravo envoyé. Ça coûte moins cher qu'un bouquet et ça fane moins vite.";
  return "« " + (REACTIONS[cle]?.label || "Réaction") + " » envoyé.";
}
function animeReaction(bouton, cle){
  if(!bouton || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const b = bouton.getBoundingClientRect();
  const v = document.createElement("div");
  v.className = "volReaction";
  v.innerHTML = icone(REACTIONS[cle]?.icone || "etoile");
  v.style.left = (b.left + b.width/2 - 12) + "px";
  v.style.top = (b.top - 6) + "px";
  document.body.appendChild(v);
  setTimeout(()=>v.remove(), 900);
}

/* ---------- abonnement ---------- */
let conteneurSocialActuel = "zoneSociale";
async function basculeSuivi(publicId, bouton){
  const suit = relationSociale?.suit;
  const r = await actionSoc(bouton, ()=>rpc(suit ? "ne_plus_suivre" : "suivre_cinema",
    {p_public_id: publicId}));
  if(!r?.success) return;
  await chargeRelation(publicId);
  rendActionsSociales(conteneurSocialActuel, publicId);
  toastSocial(suit ? "Tu ne suis plus ce cinéma." : "Cinéma suivi. Ses grandes nouvelles arriveront dans ton fil.");
}

/* ---------- amitié ---------- */
async function demandeAmi(publicId, bouton){
  const r = await actionSoc(bouton, ()=>rpc("envoyer_demande_ami", {p_public_id: publicId}));
  if(!r?.success) return;
  await chargeRelation(publicId);
  rendActionsSociales(conteneurSocialActuel, publicId);
  toastSocial("Demande envoyée. À eux de décider.", "spectateurs");
}
async function accepteAmi(id, bouton){
  const r = await actionSoc(bouton, ()=>rpc("repondre_demande_ami", {p_id:id, p_accepte:true}));
  if(!r?.success) return;
  toastSocial("Des amis dans le métier ! On pourra se plaindre ensemble des projecteurs.", "spectateurs");
  if(typeof rafraichirSocial === "function") await rafraichirSocial();
}
function menuAmi(publicId){
  confirmeSocial("Retirer de mes amis ?",
    "L'abonnement sera conservé, tu pourras le retirer ensuite.",
    "Retirer", async ()=>{
      const r = await rpc("retirer_ami", {p_public_id: publicId});
      if(r?.success){ await chargeRelation(publicId); rendActionsSociales(conteneurSocialActuel, publicId);
        toastSocial("Relation retirée."); }
    });
}
function menuModeration(publicId){
  confirmeSocial("Bloquer ce cinéma ?",
    "Les relations existantes seront retirées et ce joueur ne pourra plus interagir avec toi. Il n'en sera pas informé.",
    "Bloquer", async ()=>{
      const r = await rpc("bloquer_joueur", {p_public_id: publicId});
      if(r?.success){ toastSocial("Blocage appliqué."); location.href = "communaute.html"; }
    });
}

function confirmeSocial(titre, texte, valider, action){
  const o = document.createElement("div");
  o.className = "voileConfirm";
  o.innerHTML = `
    <div class="carteConfirm">
      <div class="ccIco">${icone("cloche","icoConfirm")}</div>
      <div class="ccTitre" id="csTitre"></div>
      <div class="ccTexte" id="csTexte"></div>
      <div class="ccBoutons">
        <button class="btnAnnuler" id="csAnnuler">Annuler</button>
        <button class="btnOr btnOuvrir" id="csValider"></button>
      </div>
    </div>`;
  document.body.appendChild(o);
  texteSur(o.querySelector("#csTitre"), titre);
  texteSur(o.querySelector("#csTexte"), texte);
  texteSur(o.querySelector("#csValider"), valider);
  o.querySelector("#csAnnuler").onclick = ()=>{ o.classList.add("sortie"); setTimeout(()=>o.remove(),240); };
  o.querySelector("#csValider").onclick = async ()=>{ o.remove(); await action(); };
}

/* ---- exports ---- */
export {
  MSG_SOCIAL,
  REACTIONS,
  accepteAmi,
  actionSoc,
  actionSociale,
  animeReaction,
  basculeSuivi,
  chargeRelation,
  confirmeSocial,
  conteneurSocialActuel,
  demandeAmi,
  envoieReaction,
  menuAmi,
  menuModeration,
  phraseReaction,
  relationSociale,
  rendActionsSociales,
  toastSocial
};

/* ---- gestionnaires en attribut ---- */
/* Ces fonctions sont appelées depuis des attributs onclick écrits
   dans le HTML généré. Un module ES n'expose rien globalement :
   on les rend accessibles explicitement. */
Object.assign(window, {
  basculeSuivi,
  envoieReaction,
  menuModeration
});
