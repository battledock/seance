import { majBadgeNotifications } from "./community-social.js?v=2ab9afab";
import { actionSoc, toastSocial } from "../../social.js?v=2ab9afab";
import { messageErreur, rpc } from "../../supabase-client.js?v=2ab9afab";
import { echappe, texteSur } from "../../ui/emblems.js?v=2ab9afab";
import { icone } from "../../ui/icons.js?v=2ab9afab";

/* ============================================================
   DÉFIS ENTRE AMIS — modèles officiels, progression serveur
   ============================================================ */
let mesDefis = null;

async function rendDefis(){
  const el = document.getElementById("zoneDefis");
  if(!el) return;
  el.innerHTML = `<div class="vide">Chargement…</div>`;
  let r;
  try{ r = await rpc("get_my_coop_challenges"); }
  catch(e){ el.innerHTML = `<div class="vide">Le réseau a mangé la bobine.</div>`; return; }
  mesDefis = r;

  const defis = r?.defis || [];
  const invitations = defis.filter(d=>d.monStatut === "invite" && d.statut === "en_attente");
  const actifs = defis.filter(d=>d.statut === "actif" || (d.statut === "en_attente" && d.estCreateur));
  const passes = defis.filter(d=>["reussi","echoue","expire","annule"].includes(d.statut));

  el.innerHTML = `
    <button class="btnRouge btnNouveauDefi" onclick="ouvreCreationDefi()">
      ${icone("etoile")} Proposer un défi à un ami</button>

    ${invitations.length ? `<section class="carteEcran">
      <h2>Invitations · ${invitations.length}</h2>
      ${invitations.map(d=>carteDefi(d, "invitation")).join("")}
    </section>` : ""}

    <section class="carteEcran">
      <h2>Défis en cours${actifs.length ? " · " + actifs.length : ""}</h2>
      ${actifs.length ? actifs.map(d=>carteDefi(d, "actif")).join("")
        : `<div class="vide">Aucun défi en cours.<br><small>Propose-en un à un ami.</small></div>`}
    </section>

    ${passes.length ? `<section class="carteEcran">
      <h2>Terminés</h2>
      ${passes.map(d=>carteDefi(d, "passe")).join("")}
    </section>` : ""}`;

  /* noms des partenaires en textContent */
  [...el.querySelectorAll(".defPartenaire")].forEach(n=>{
    texteSur(n, n.dataset.nom || "—");
  });
}

function carteDefi(d, mode){
  const pct = Math.min(100, Math.round((Number(d.valeur)/Math.max(1,Number(d.objectif)))*100));
  const p = (d.partenaires || [])[0];
  const ETATS = {reussi:["Réussi","reussi"], echoue:["Échoué","echoue"],
                 expire:["Expiré","echoue"], annule:["Annulé","echoue"],
                 en_attente:["En attente de réponse","attente"], actif:["En cours","actif"]};
  const [libelle, classe] = ETATS[d.statut] || ["—","attente"];

  return `<div class="carteDefi ${classe}">
    <div class="cdEntete">
      <b>${echappe(d.nom)}</b>
      <span class="cdEtat ${classe}">${libelle}</span>
    </div>
    <div class="cdDesc">${echappe(d.description || "")}</div>
    ${p ? `<div class="cdAvec">${icone("spectateurs")} Avec
      <span class="defPartenaire" data-nom="${echappe(p.nomCinema)}"></span></div>` : ""}

    ${mode !== "invitation" ? `
      <div class="cdChiffres">${d.valeur} / ${d.objectif}</div>
      <div class="pisteEvenement"><div class="barreEvenement" style="width:${pct}%"></div></div>
      <div class="cdDetail">
        <span>Toi : ${d.maContribution || 0}</span>
        ${p ? `<span>Ami : ${p.contribution || 0}</span>` : ""}
        ${d.statut === "actif" ? `<span>${icone("horloge")} ${Math.max(0, d.heuresRestantes)} h</span>` : ""}
      </div>` : ""}

    <div class="cdActions">
      ${mode === "invitation" ? `
        <button class="btnMiniOr" onclick="repondDefi('${d.id}', true, this)">Accepter</button>
        <button class="btnMiniGris" onclick="repondDefi('${d.id}', false, this)">Refuser</button>` : ""}
      ${mode === "actif" && d.estCreateur && d.statut === "en_attente" ? `
        <button class="btnMiniGris" onclick="annuleDefi('${d.id}', this)">Annuler</button>` : ""}
    </div>
  </div>`;
}

/* ---------- création ---------- */
async function ouvreCreationDefi(){
  let amis, modeles;
  try{
    const [a, d] = await Promise.all([rpc("mes_amis"), rpc("get_my_coop_challenges")]);
    amis = a?.amis || []; modeles = d?.modeles || [];
  }catch(e){ toastSocial(messageErreur(e)); return; }

  if(amis.length === 0){
    toastSocial("Il faut d'abord un ami. Va en chercher un dans Découvrir.", "spectateurs");
    return;
  }

  const o = document.createElement("div");
  o.className = "voilePanneau";
  o.id = "voileDefi";
  o.innerHTML = `
    <div class="panneauSeance">
      <div class="pnEnteteSalle">
        <span class="pnTitre">Défi entre amis</span>
        <span class="pnSous">Un objectif commun, deux cinémas</span>
        <button class="pnFermer" onclick="fermeCreationDefi()" aria-label="Fermer">✕</button>
      </div>
      <div class="pnCorps">
        <label class="lblProg">Le défi</label>
        <div id="choixModeles"></div>
        <label class="lblProg">L'ami à inviter</label>
        <div id="choixAmis"></div>
        <button class="btnRouge btnAjouter" id="btnEnvoyerDefi" disabled
          onclick="envoieDefi(this)">Envoyer l'invitation</button>
      </div>
    </div>`;
  document.body.appendChild(o);

  document.getElementById("choixModeles").innerHTML = modeles.map(m=>`
    <button class="optBudget" onclick="choisitModele('${m.cle}', this)">
      <span class="obNom">${echappe(m.nom)}<b>${m.objectif}</b></span>
      <span class="obDesc">${echappe(m.description)} · ${Math.round(m.dureeHeures/24)} jours</span>
    </button>`).join("");
  document.getElementById("choixAmis").innerHTML = amis.map(a=>`
    <button class="optBudget" onclick="choisitAmi('${a.publicId}', this)">
      <span class="obNom"><span class="amiNom" data-nom="${echappe(a.nomCinema)}"></span></span>
      <span class="obDesc">Niveau ${Number(a.niveau)||1}</span>
    </button>`).join("");
  [...document.querySelectorAll(".amiNom")].forEach(n=>texteSur(n, n.dataset.nom));
}
function fermeCreationDefi(){
  const o = document.getElementById("voileDefi");
  if(o){ o.classList.add("sortie"); setTimeout(()=>o.remove(), 260); }
  defiChoix = {modele:null, ami:null};
}

let defiChoix = {modele:null, ami:null};
function choisitModele(cle, btn){
  defiChoix.modele = cle;
  document.querySelectorAll("#choixModeles .optBudget").forEach(b=>b.classList.remove("sel"));
  btn.classList.add("sel"); verifieDefi();
}
function choisitAmi(id, btn){
  defiChoix.ami = id;
  document.querySelectorAll("#choixAmis .optBudget").forEach(b=>b.classList.remove("sel"));
  btn.classList.add("sel"); verifieDefi();
}
function verifieDefi(){
  document.getElementById("btnEnvoyerDefi").disabled = !(defiChoix.modele && defiChoix.ami);
}

async function envoieDefi(bouton){
  const r = await actionSoc(bouton, ()=>rpc("create_coop_challenge",
    {p_modele: defiChoix.modele, p_public_id: defiChoix.ami}));
  if(!r?.success){
    const M = {NOT_FRIENDS:"Les défis sont réservés aux amis.",
               TOO_MANY_CHALLENGES:"Trop de défis en cours. Termines-en un d'abord.",
               DAILY_LIMIT:"Doucement la vedette. Reviens demain.",
               LEVEL_TOO_LOW:"Ce défi demande un niveau plus élevé."};
    if(r?.code && M[r.code]) toastSocial(M[r.code]);
    return;
  }
  fermeCreationDefi();
  toastSocial("Invitation envoyée. À eux de dire oui.", "etoile");
  await rendDefis();
}

async function repondDefi(id, accepte, bouton){
  const r = await actionSoc(bouton, ()=>rpc("repondre_defi", {p_id:id, p_accepte:accepte}));
  if(!r?.success){
    if(r?.code === "EXPIRED") toastSocial("L'invitation a expiré.");
    return;
  }
  if(accepte) toastSocial("Défi accepté. Le compte à rebours démarre.", "etoile");
  await rendDefis();
  await majBadgeNotifications();
}
async function annuleDefi(id, bouton){
  const r = await actionSoc(bouton, ()=>rpc("annuler_defi", {p_id:id}));
  if(r?.success) await rendDefis();
}

/* ---- exports ---- */
export {
  annuleDefi,
  carteDefi,
  choisitAmi,
  choisitModele,
  defiChoix,
  envoieDefi,
  fermeCreationDefi,
  mesDefis,
  ouvreCreationDefi,
  rendDefis,
  repondDefi,
  verifieDefi
};

/* ---- gestionnaires en attribut ---- */
/* Ces fonctions sont appelées depuis des attributs onclick écrits
   dans le HTML généré. Un module ES n'expose rien globalement :
   on les rend accessibles explicitement. */
Object.assign(window, {
  annuleDefi,
  choisitAmi,
  choisitModele,
  envoieDefi,
  fermeCreationDefi,
  ouvreCreationDefi,
  repondDefi
});
