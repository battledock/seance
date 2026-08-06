import { PRODUITS_CONFISERIE } from "../../data/concessions.js?v=2ab9afab";
import { deconnexion } from "../../auth.js?v=2ab9afab";
import { confiserieActive, tauxAchat } from "../../data/concessions.js?v=2ab9afab";
import { obtenirBonusSalle } from "../../data/upgrades.js?v=2ab9afab";
import { Etat, fmtArgent } from "../../game-state.js?v=2ab9afab";
import { bobCompact } from "../../navigation.js?v=2ab9afab";
import { majBadgeNotifications } from "./community-social.js?v=2ab9afab";
import {
  XP,
  deblocagesReels,
  estDebloque,
  infoNiveau,
  niveauActuel,
  niveauMax,
  progressionVersSuivant,
  recompenseParCle,
  xpActuel
} from "../../progression.js?v=2ab9afab";
import { salles } from "../../rooms.js?v=2ab9afab";
import { sbFetch } from "../../supabase-client.js?v=2ab9afab";
import { echappe } from "../../ui/emblems.js?v=2ab9afab";
import { icone } from "../../ui/icons.js?v=2ab9afab";

/* Page "Plus" : fiche du cinéma, à venir, compte */
const NOMS_QUARTIERS_P = {centre:"Centre-ville",residentiel:"Quartier résidentiel",etudiant:"Quartier étudiant",populaire:"Quartier populaire",artistique:"Quartier artistique"};
const NOMS_CADEAUX = {popcorn:"Machine à popcorn (+10 % snack)",fauteuils:"Fauteuils restaurés (+5 % satisfaction)",camera:"Vieille caméra de Bob (studio débloqué)"};

function initPlus(){
  const c = Etat.cinema;
  document.body.innerHTML = document.body.innerHTML
    .replace("%ICO_ETOILE%", icone("etoile")).replace("%ICO_OUTIL%", icone("outil"))
    .replace("%ICO_ETOILE2%", icone("etoile")).replace("%ICO_SPECT%", icone("spectateurs"))
    .replace("%ICO_PELLI%", icone("pellicule"));
  rendProgression();
  const annee = c.fonde_le ? new Date(c.fonde_le).getFullYear() : new Date().getFullYear();

  document.getElementById("plaqueCine").innerHTML = `
    <div class="pfLogo">${c.logo}</div>
    <h2>${c.nom}</h2>
    <div class="pfLigne">Fondé en <b>${annee}</b> · Jour <b>${c.jour}</b></div>
    <div class="pfLigne">Directeur : <b>${c.directeur}</b></div>
    <div class="pfLigne">${NOMS_QUARTIERS_P[c.quartier]||c.quartier} · <b>${c.capacite} places</b></div>
    <div class="pfDevise">« ${c.devise} »</div>`;

  document.getElementById("ficheDetail").innerHTML = `
    <div class="ligneRecit">${icone("piece")}<span>En caisse : <b>${fmtArgent(c.argent)}</b></span></div>
    <div class="ligneRecit">${icone("etoile")}<span>Réputation : <b>${Etat.reputation} / 100</b></span></div>
    <div class="ligneRecit">${icone("maison")}<span>Loyer : <b>${fmtArgent(c.loyer)}</b> par jour</span></div>
    <div class="ligneRecit">${icone("billet")}<span>Cadeau d'ouverture : <b>${NOMS_CADEAUX[c.cadeau_depart]||c.cadeau_depart}</b></span></div>`;

  document.getElementById("aVenir").innerHTML = [
    {ic:"billet",  nom:"La confiserie",  desc:"Popcorn, sodas, marges indécentes"},
    {ic:"spectateurs", nom:"L'équipe",   desc:"Caissiers, projectionnistes, et Bob (déjà là)"},
    {ic:"journal", nom:"Les finances",   desc:"Livre de comptes, courbes, sueurs froides"}
  ].map(x=>`
    <div class="ligneRecit aVenirLigne">${icone(x.ic)}
      <span><b>${x.nom}</b><br><small>${x.desc}</small></span>
      <span class="badgeBientot">Bientôt</span>
    </div>`).join("");

  rendPatrimoine();
  rendConfiserie();
  if(typeof majBadgeNotifications === "function") majBadgeNotifications();
  document.getElementById("zoneBob").appendChild(
    bobCompact("La fiche officielle du cinéma. Encadrée dans le hall. Enfin, scotchée, mais avec un beau scotch."));
}

/* ---- progression ---- */
function rendProgression(){
  const n = niveauActuel();
  const inf = infoNiveau(n);
  const p = progressionVersSuivant();
  const max = n >= niveauMax();

  document.getElementById("blocProgression").innerHTML = `
    <div class="blocNiveau">
      <div class="nivGros">${n}</div>
      <div class="nivTitre">${inf.titre}</div>
    </div>
    <div class="pisteXP"><div class="barreXP" id="barreXPProfil"></div></div>
    <div class="legendeXP">
      <span><b>${xpActuel()}</b> XP</span>
      ${max ? `<span>Niveau maximum atteint</span>`
            : `<span>encore <b>${p.reste}</b> XP → niveau ${n+1}</span>`}
    </div>`;
  setTimeout(()=>{
    const b = document.getElementById("barreXPProfil");
    if(b) b.style.width = p.pct + "%";
  }, 120);

  /* ------------------------------------------------------------
     La liste ne recopie plus une table écrite à la main : elle lit
     les paliers là où ils sont décidés. Ce qui n'a pas encore de
     mécanique est présenté à part, comme un horizon annoncé.
     ------------------------------------------------------------ */
  const reels = deblocagesReels();

  const ligne = (l, acquis) => `
    <div class="ligneDeblocage ${acquis ? "" : "verrouille"}">
      ${icone(l.ic)}
      <span class="dbTxt"><b>${echappe(l.nom)}</b><small>${echappe(l.desc || "")}</small></span>
      <span class="badgeNiv ${acquis ? "acquis" : ""}">${acquis ? "ACQUIS" : "NIV " + l.niv}</span>
    </div>`;

  const acquis = reels.filter(l => l.niv <= n);
  const aVenir = reels.filter(l => l.niv > n);
  const prochains = aVenir.slice(0, 4);
  const reste = aVenir.slice(4);

  document.getElementById("listeDeblocages").innerHTML =
    acquis.map(l => ligne(l, true)).join("") +
    prochains.map(l => ligne(l, false)).join("") +
    (reste.length ? `
      <div id="resteDeblocages" style="display:none">
        ${reste.map(l => ligne(l, false)).join("")}</div>
      <button class="btnToutVoir" id="btnToutVoir" onclick="basculeDeblocages()">
        Voir les ${reste.length} déblocages suivants — jusqu'au niveau ${aVenir[aVenir.length-1].niv}
      </button>` : "") +
    "";
}


function rendConfiserie(){
  const el = document.getElementById("blocConfiserie");
  if(!el) return;
  if(!estDebloque("confiserie")){
    el.innerHTML = `<div class="ligneRecit">${icone("billet")}<span>La confiserie ouvre au niveau ${recompenseParCle("confiserie")?.niveau || 5}.</span></div>`;
    return;
  }
  const c = Etat.confiserie || {};
  el.innerHTML = `
    <div class="ligneRecit">${icone("billet")}<span>Comptoir <b>${confiserieActive()?"ouvert":"en préparation"}</b> · ${Math.round(tauxAchat()*100)} % des spectateurs achètent</span></div>
    ${PRODUITS_CONFISERIE.map(p=>`<div class="ligneRecit">${icone(p.ic)}<span><b>${p.nom}</b> — ${fmtArgent(p.prix)}<br><small>${p.desc}</small></span></div>`).join("")}
    <div class="ligneRecit">${icone("spectateurs")}<span>Popcorn vendus depuis l'ouverture : <b>${Number(c.total_popcorn||0)}</b></span></div>`;
}

async function rendPatrimoine(){
  const el = document.getElementById("blocPatrimoine");
  if(!el) return;
  const salles = Etat.salles || [];
  const capacite = salles.reduce((t,s)=>t+Number(s.capacite||0),0);
  const satisfaction = salles.length
    ? Math.round(salles.reduce((t,s)=>t+obtenirBonusSalle(s).satisfaction,0)/salles.length) : 0;
  el.innerHTML = `
    <div class="ligneRecit">${icone("batiment")}<span><b>${salles.length}</b> salle${salles.length>1?"s":""} · <b>${capacite}</b> places au total</span></div>
    <div class="ligneRecit">${icone("etoile")}<span>Bonus de satisfaction moyen : <b>+${satisfaction}</b></span></div>
    ${salles.map(s=>`<div class="ligneRecit">${icone("fauteuil")}<span><b>${s.nom}</b> · ${s.capacite} places · propreté ${Math.round(Number(s.proprete??100))} % · état ${Math.round(Number(s.etat??100))} %</span></div>`).join("")}`;

  /* dernières dépenses */
  try{
    const t = await sbFetch(`transactions?cinema_id=eq.${Etat.cinema.id}&select=*&order=cree_le.desc&limit=6`);
    if(Array.isArray(t) && t.length){
      document.getElementById("blocTransactions").innerHTML = t.map(x=>`
        <div class="ligneRecit">${icone(Number(x.montant)<0?"outil":"piece")}
          <span>${LIBELLES_TRANSAC[x.categorie]||x.categorie} · jour ${x.jour}
            <b class="${Number(x.montant)<0?'negatif':'positif'}">${Number(x.montant)<0?"−":"+"}${fmtArgent(Math.abs(Number(x.montant)))}</b></span></div>`).join("");
    }else{
      document.getElementById("blocTransactions").innerHTML = `<div class="vide">Aucun mouvement pour l'instant.</div>`;
    }
  }catch(e){}
}
const LIBELLES_TRANSAC = {
  recette_billetterie:"Billetterie", cout_licence:"Licences de films",
  amelioration_salle:"Amélioration", extension_salle:"Extension de capacité",
  nettoyage_salle:"Nettoyage", reparation_salle:"Réparation", construction_salle:"Construction"
};

function basculeDeblocages(){
  const z = document.getElementById("resteDeblocages");
  const b = document.getElementById("btnToutVoir");
  const ouvert = z.style.display !== "none";
  z.style.display = ouvert ? "none" : "block";
  b.textContent = ouvert
    ? "Voir les " + z.children.length + " déblocages suivants — jusqu'au niveau " + niveauMax()
    : "Masquer";
}

function confirmeDeconnexion(){
  const b = document.getElementById("btnDeco");
  if(b.dataset.confirme){ deconnexion(); return; }
  b.dataset.confirme = "1";
  b.textContent = "Sûr ? Bob gardera la caisse. Appuie encore.";
  setTimeout(()=>{ b.dataset.confirme=""; b.textContent = "Rendre les clés (déconnexion)"; }, 3500);
}

/* ---- exports ---- */
export {
  LIBELLES_TRANSAC,
  NOMS_CADEAUX,
  NOMS_QUARTIERS_P,
  basculeDeblocages,
  confirmeDeconnexion,
  initPlus,
  rendConfiserie,
  rendPatrimoine,
  rendProgression
};

/* ---- gestionnaires en attribut ---- */
/* Ces fonctions sont appelées depuis des attributs onclick écrits
   dans le HTML généré. Un module ES n'expose rien globalement :
   on les rend accessibles explicitement. */
Object.assign(window, {
  basculeDeblocages,
  confirmeDeconnexion
});
