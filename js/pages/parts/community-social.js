import { actionSoc, toastSocial } from "../../social.js?v=2ab9afab";
import { rpc } from "../../supabase-client.js?v=2ab9afab";
import { echappe, embleme, texteSur } from "../../ui/emblems.js?v=2ab9afab";
import { icone } from "../../ui/icons.js?v=2ab9afab";

/* ============================================================
   COMMUNAUTÉ — onglets Abonnements, Amis, Notifications
   ============================================================ */
async function rendAbonnements(){
  const el = document.getElementById("zoneAbonnements");
  el.innerHTML = `<div class="vide">Chargement…</div>`;
  let abos, fil;
  try{
    [abos, fil] = await Promise.all([rpc("mes_abonnements"), rpc("get_following_activity", {p_page:1})]);
  }catch(e){ el.innerHTML = `<div class="vide">Le réseau a mangé la bobine.</div>`; return; }

  const liste = abos?.entries || [];
  const nouvelles = fil?.entries || [];

  el.innerHTML = `
    ${nouvelles.length ? `<section class="carteEcran">
      <h2>Les nouvelles du quartier</h2>
      <div id="filActivite"></div>
    </section>` : ""}
    <section class="carteEcran">
      <h2>Cinémas suivis${liste.length ? " · " + liste.length : ""}</h2>
      <div id="listeAbonnements"></div>
    </section>`;

  if(nouvelles.length){
    document.getElementById("filActivite").innerHTML = nouvelles.map(n=>`
      <a class="ligneActivite" href="visite.html?cinema=${encodeURIComponent(n.publicId)}">
        <span class="laEmbleme">${embleme(n.embleme, 32)}</span>
        <span class="laTxt"><b class="laNom"></b><small class="laMsg"></small></span>
      </a>`).join("");
    [...document.querySelectorAll(".ligneActivite")].forEach((node,i)=>{
      texteSur(node.querySelector(".laNom"), nouvelles[i].nomCinema);
      texteSur(node.querySelector(".laMsg"), phraseActivite(nouvelles[i]));
    });
  }

  const l = document.getElementById("listeAbonnements");
  if(liste.length === 0){
    l.innerHTML = `<div class="vide">Tu ne suis aucun cinéma.<br>
      <small>Visite la section Découvrir pour en trouver.</small></div>`;
    return;
  }
  l.innerHTML = liste.map(c=>`
    <div class="carteAbonnement">
      <span class="lcEmbleme">${embleme(c.embleme, 38)}</span>
      <span class="lcTxt">
        <b class="caNom"></b>
        <small class="caPseudo"></small>
        <small class="caMeta">Niveau ${Number(c.niveau)||1} · réputation ${Number(c.reputation)||0}</small>
        <small class="caNouvelle"></small>
      </span>
      <span class="caActions">
        <a class="btnMiniOr" href="visite.html?cinema=${encodeURIComponent(c.publicId)}">Visiter</a>
        <button class="btnMiniGris" onclick="retireAbonnement('${c.publicId}', this)">Ne plus suivre</button>
      </span>
    </div>`).join("");
  [...document.querySelectorAll(".carteAbonnement")].forEach((node,i)=>{
    const c = liste[i];
    texteSur(node.querySelector(".caNom"), c.nomCinema);
    texteSur(node.querySelector(".caPseudo"), "Géré par " + (c.pseudo || "—"));
    texteSur(node.querySelector(".caNouvelle"),
      c.derniereNouvelle ? phraseActivite({eventType:c.derniereNouvelle, contenu:c.derniereNouvelleContenu}) : "");
  });
}

function phraseActivite(n){
  const d = n.contenu || {};
  switch(n.eventType){
    case "niveau_atteint":   return "a atteint le niveau " + (d.niveau || "?") + ".";
    case "salle_construite": return "a construit une nouvelle salle (" + (d.salles || 2) + " au total).";
    case "trophee":          return "a obtenu le trophée « " + (d.trophee || "?") + " ».";
    case "facade":           return "a repeint sa façade.";
    default:                 return "a du nouveau.";
  }
}

async function retireAbonnement(publicId, bouton){
  const r = await actionSoc(bouton, ()=>rpc("ne_plus_suivre", {p_public_id: publicId}));
  if(r?.success) await rendAbonnements();
}

/* ============================================================
   AMIS
   ============================================================ */
async function rendAmis(){
  const el = document.getElementById("zoneAmis");
  el.innerHTML = `<div class="vide">Chargement…</div>`;
  let r;
  try{ r = await rpc("mes_amis"); }
  catch(e){ el.innerHTML = `<div class="vide">Le réseau a mangé la bobine.</div>`; return; }

  const amis = r?.amis || [], recues = r?.recues || [], envoyees = r?.envoyees || [];

  el.innerHTML = `
    <div class="explicationSociale">
      ${icone("cloche")}
      <span><b>Suivre</b> : tu vois les grandes nouvelles publiques, sans confirmation.<br>
      <b>Ajouter en ami</b> : une invitation est envoyée, les deux joueurs doivent accepter.</span>
    </div>

    ${recues.length ? `<section class="carteEcran">
      <h2>Demandes reçues · ${recues.length}</h2>
      <div id="listeRecues"></div></section>` : ""}

    <section class="carteEcran">
      <h2>Mes amis${amis.length ? " · " + amis.length : ""}</h2>
      <div id="listeAmis"></div>
    </section>

    ${envoyees.length ? `<section class="carteEcran">
      <h2>Demandes envoyées · ${envoyees.length}</h2>
      <div id="listeEnvoyees"></div></section>` : ""}`;

  if(recues.length){
    document.getElementById("listeRecues").innerHTML = recues.map(a=>`
      <div class="ligneAmi">
        <span class="lcEmbleme">${embleme(a.embleme, 36)}</span>
        <span class="lcTxt"><b class="laNom"></b>
          <small>Niveau ${Number(a.niveau)||1} · souhaite devenir ton ami</small></span>
        <span class="caActions">
          <button class="btnMiniOr" onclick="repondAmi('${a.id}', true, this)">Accepter</button>
          <button class="btnMiniGris" onclick="repondAmi('${a.id}', false, this)">Refuser</button>
        </span>
      </div>`).join("");
    [...document.querySelectorAll("#listeRecues .ligneAmi")].forEach((n,i)=>
      texteSur(n.querySelector(".laNom"), recues[i].nomCinema));
  }

  const la = document.getElementById("listeAmis");
  if(amis.length === 0){
    la.innerHTML = `<div class="vide">Aucun ami pour l'instant.<br>
      <small>Visite un cinéma et envoie une invitation.</small></div>`;
  }else{
    la.innerHTML = amis.map(a=>`
      <div class="ligneAmi">
        <span class="lcEmbleme">${embleme(a.embleme, 36)}</span>
        <span class="lcTxt"><b class="laNom"></b>
          <small>Niveau ${Number(a.niveau)||1}${a.activite ? " · actif " + echappe(a.activite) : ""}</small></span>
        <a class="btnMiniOr" href="visite.html?cinema=${encodeURIComponent(a.publicId)}">Visiter</a>
      </div>`).join("");
    [...document.querySelectorAll("#listeAmis .ligneAmi")].forEach((n,i)=>
      texteSur(n.querySelector(".laNom"), amis[i].nomCinema));
  }

  if(envoyees.length){
    document.getElementById("listeEnvoyees").innerHTML = envoyees.map(a=>`
      <div class="ligneAmi">
        <span class="lcEmbleme">${embleme(a.embleme, 36)}</span>
        <span class="lcTxt"><b class="laNom"></b><small>Demande en attente</small></span>
        <button class="btnMiniGris" onclick="annuleAmi('${a.id}', this)">Annuler</button>
      </div>`).join("");
    [...document.querySelectorAll("#listeEnvoyees .ligneAmi")].forEach((n,i)=>
      texteSur(n.querySelector(".laNom"), envoyees[i].nomCinema));
  }
}
async function repondAmi(id, accepte, bouton){
  const r = await actionSoc(bouton, ()=>rpc("repondre_demande_ami", {p_id:id, p_accepte:accepte}));
  if(!r?.success) return;
  if(accepte) toastSocial("Des amis dans le métier ! On pourra se plaindre ensemble des projecteurs.", "spectateurs");
  await rendAmis();
  await majBadgeNotifications();
}
async function annuleAmi(id, bouton){
  const r = await actionSoc(bouton, ()=>rpc("annuler_demande_ami", {p_id:id}));
  if(r?.success) await rendAmis();
}
async function rafraichirSocial(){ await rendAmis(); }

/* ============================================================
   NOTIFICATIONS
   ============================================================ */
async function rendNotifications(){
  const el = document.getElementById("zoneNotifications");
  el.innerHTML = `<div class="vide">Chargement…</div>`;
  let r;
  try{ r = await rpc("mes_notifications", {p_page:1}); }
  catch(e){ el.innerHTML = `<div class="vide">Le réseau a mangé la bobine.</div>`; return; }
  const n = r?.entries || [];
  if(n.length === 0){
    el.innerHTML = `<div class="vide">Aucune nouvelle pour l'instant.</div>`;
    return;
  }
  el.innerHTML = `
    <button class="btnToutVoir" onclick="marqueToutLu()">Tout marquer comme lu</button>
    <section class="carteEcran">
      ${n.map(x=>`<div class="ligneNotif ${x.lue?'':'nonlue'}">
        ${icone(icoNotif(x.type))}
        <span class="lnTxt"><b class="lnMsg"></b><small>${echappe(x.quand)}</small></span>
      </div>`).join("")}
    </section>`;
  [...document.querySelectorAll(".ligneNotif")].forEach((node,i)=>
    texteSur(node.querySelector(".lnMsg"), phraseNotif(n[i])));
}
function icoNotif(t){
  return {reaction:"etoile", abonne:"spectateurs", demande_ami:"spectateurs",
          ami_accepte:"spectateurs", trophee:"etoile"}[t] || "cloche";
}
function phraseNotif(x){
  const d = x.donnees || {};
  switch(x.type){
    case "reaction":    return (d.nombre||1) + " réaction" + ((d.nombre||1)>1?"s":"") + " reçue" + ((d.nombre||1)>1?"s":"") + " aujourd'hui.";
    case "abonne":      return (d.nombre||1) + " nouveau" + ((d.nombre||1)>1?"x":"") + " abonné" + ((d.nombre||1)>1?"s":"") + " à ton cinéma.";
    case "demande_ami": return (d.nomCinema || "Un cinéma") + " souhaite devenir ton ami.";
    case "ami_accepte": return (d.nomCinema || "Un cinéma") + " a accepté ta demande.";
    case "trophee":     return "Trophée obtenu : " + (d.trophee || "?") + ".";
    default:            return "Nouvelle activité.";
  }
}
async function marqueToutLu(){
  await rpc("marquer_notifications_lues", {p_id:null}).catch(()=>null);
  await rendNotifications();
  await majBadgeNotifications();
}

/* badge du nombre de non-lues */
async function majBadgeNotifications(){
  try{
    const r = await rpc("mes_notifications", {p_page:1, p_taille:5});
    const n = Number(r?.nonLues || 0);
    document.querySelectorAll(".badgeNotif").forEach(b=>{
      b.textContent = n > 0 ? String(n) : "";
      b.style.display = n > 0 ? "inline-flex" : "none";
    });
  }catch(e){}
}

/* ============================================================
   SUGGESTIONS
   ============================================================ */
async function rendSuggestions(){
  const el = document.getElementById("zoneSuggestions");
  if(!el) return;
  let r;
  try{ r = await rpc("suggestions_cinemas", {p_limite:12}); }catch(e){ return; }
  const s = r?.entries || [];
  if(s.length === 0){ el.innerHTML = ""; return; }
  el.innerHTML = `<section class="carteEcran"><h2>À découvrir</h2>
    ${s.map(c=>`
      <a class="ligneCinema" href="cinema-public.html?id=${encodeURIComponent(c.publicId)}">
        <span class="lcEmbleme">${embleme(c.embleme, 36)}</span>
        <span class="lcTxt"><b class="lcNom"></b>
          <small class="lcPseudo"></small>
          <small class="lcNiv">Niveau ${Number(c.niveau)||1} · ${echappe(c.raison||"")}</small></span>
        <span class="lcVisiter">Voir</span>
      </a>`).join("")}
  </section>`;
  [...el.querySelectorAll(".ligneCinema")].forEach((n,i)=>{
    texteSur(n.querySelector(".lcNom"), s[i].nomCinema);
    texteSur(n.querySelector(".lcPseudo"), "Géré par " + (s[i].pseudo || "—"));
  });
}

/* ---- exports ---- */
export {
  annuleAmi,
  icoNotif,
  majBadgeNotifications,
  marqueToutLu,
  phraseActivite,
  phraseNotif,
  rafraichirSocial,
  rendAbonnements,
  rendAmis,
  rendNotifications,
  rendSuggestions,
  repondAmi,
  retireAbonnement
};

/* ---- gestionnaires en attribut ---- */
/* Ces fonctions sont appelées depuis des attributs onclick écrits
   dans le HTML généré. Un module ES n'expose rien globalement :
   on les rend accessibles explicitement. */
Object.assign(window, {
  annuleAmi,
  marqueToutLu,
  repondAmi,
  retireAbonnement
});
