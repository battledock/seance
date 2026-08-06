import { bobCompact } from "../../navigation.js?v=2ab9afab";
import { rendDefis } from "./challenges.js?v=2ab9afab";
import {
  majBadgeNotifications,
  marqueToutLu,
  rendAbonnements,
  rendAmis,
  rendNotifications,
  rendSuggestions
} from "./community-social.js?v=2ab9afab";
import { initClassement } from "./leaderboard.js?v=2ab9afab";
import { rpc } from "../../supabase-client.js?v=2ab9afab";
import { embleme, texteSur } from "../../ui/emblems.js?v=2ab9afab";

/* ============================================================
   COMMUNAUTÉ — recherche de cinémas publics
   ============================================================ */
let rechercheEnCours = false;

let sectionActuelle = "decouvrir";
let classementCharge = false;

async function initCommunaute(){
  /* on revient sur l'onglet quitté */
  try{
    const v = sessionStorage.getItem("rex_section_communaute");
    if(v && v !== "decouvrir"){ await changeSection(v); }
    else bulleDecouvrir();
  }catch(e){ bulleDecouvrir(); }
  initRecherche();
  rendSuggestions();
  majBadgeNotifications();
}
function bulleDecouvrir(){
  const z = document.getElementById("zoneBob");
  z.innerHTML = ""; z.appendChild(
    bobCompact("Cherche un nom de cinéma ou un pseudo. Les portes ouvertes apparaîtront."));
}

async function changeSection(id){
  sectionActuelle = id;
  try{ sessionStorage.setItem("rex_section_communaute", id); }catch(e){}
  const ORDRE = ["decouvrir","classements","abonnements","amis","defis","notifications"];
  document.querySelectorAll(".ongletSection").forEach((b,i)=>{
    const actif = ORDRE[i] === id;
    b.classList.toggle("actif", actif);
    b.setAttribute("aria-selected", actif);
  });
  ORDRE.forEach(o=>{
    const n = document.getElementById("section" + o.charAt(0).toUpperCase() + o.slice(1));
    if(n) n.hidden = (o !== id);
  });
  if(id === "classements"){ if(!classementCharge){ classementCharge = true; await initClassement(); } }
  else if(id === "abonnements") await rendAbonnements();
  else if(id === "amis") await rendAmis();
  else if(id === "defis") await rendDefis();
  else if(id === "notifications"){ await rendNotifications(); await marqueToutLu(); }
  else bulleDecouvrir();
}

function initRecherche(){
  const champ = document.getElementById("champRecherche");
  let minuteur;
  champ.addEventListener("input", ()=>{
    clearTimeout(minuteur);
    minuteur = setTimeout(()=>lanceRecherche(champ.value), 350);
  });
}

async function lanceRecherche(terme){
  const el = document.getElementById("resultatsRecherche");
  const t = String(terme || "").trim();
  if(t.length < 2){
    el.innerHTML = `<div class="vide">Tape au moins deux caractères.</div>`;
    return;
  }
  if(rechercheEnCours) return;
  rechercheEnCours = true;
  el.innerHTML = `<div class="vide">Recherche…</div>`;
  try{
    const r = await rpc("rechercher_cinemas", {p_terme: t, p_limite: 20});
    if(!r?.success){ el.innerHTML = `<div class="vide">Deux caractères au minimum.</div>`; return; }
    const res = r.results || [];
    if(res.length === 0){
      el.innerHTML = `<div class="vide">Aucun cinéma ouvert à ce nom.<br>
        <small>Les profils privés n'apparaissent pas ici.</small></div>`;
      return;
    }
    el.innerHTML = res.map(c=>`
      <a class="ligneCinema" href="cinema-public.html?id=${encodeURIComponent(c.publicId)}">
        <span class="lcEmbleme">${embleme(c.embleme, 40)}</span>
        <span class="lcTxt">
          <b class="lcNom"></b>
          <small class="lcPseudo"></small>
          <small class="lcNiv">Niveau ${Number(c.niveau)||1} · réputation ${Number(c.reputation)||0}</small>
        </span>
        <span class="lcVisiter">Visiter</span>
      </a>`).join("");
    /* les textes joueur sont posés en textContent, jamais en HTML */
    [...el.querySelectorAll(".ligneCinema")].forEach((n,i)=>{
      texteSur(n.querySelector(".lcNom"), res[i].nomCinema);
      texteSur(n.querySelector(".lcPseudo"), "Géré par " + (res[i].pseudo || "—"));
    });
  }catch(e){
    el.innerHTML = `<div class="vide">Le réseau a mangé la bobine. Réessaie.</div>`;
  }finally{ rechercheEnCours = false; }
}

/* ---- exports ---- */
export {
  bulleDecouvrir,
  changeSection,
  classementCharge,
  initCommunaute,
  initRecherche,
  lanceRecherche,
  rechercheEnCours,
  sectionActuelle
};

/* ---- gestionnaires en attribut ---- */
/* Ces fonctions sont appelées depuis des attributs onclick écrits
   dans le HTML généré. Un module ES n'expose rien globalement :
   on les rend accessibles explicitement. */
Object.assign(window, {
  changeSection
});
