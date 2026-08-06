import { NIVEAUX } from "../../progression.js?v=2ab9afab";
import { Etat } from "../../game-state.js?v=2ab9afab";
import {
  MISSIONS,
  XP,
  chargeMissions,
  deblocagesDuNiveau,
  infoNiveau,
  missionFaite,
  missionsOuvertes,
  niveauActuel,
  niveauMax,
  progressionVersSuivant,
  reclameRecompense,
  recompenseParCle,
  recompensesAReclamer,
  synchroniseDeblocages,
  xpActuel
} from "../../progression.js?v=2ab9afab";
import { sbFetch } from "../../supabase-client.js?v=2ab9afab";
import { texteSur } from "../../ui/emblems.js?v=2ab9afab";
import { icone } from "../../ui/icons.js?v=2ab9afab";
import { murDesTrophees } from "../../ui/trophy-wall.js?v=2ab9afab";

/* ============================================================
   PAGE PROGRESSION — niveaux 1 à 10 en détail
   ============================================================ */
async function initProgressionPage(){
  await synchroniseDeblocages();
  await chargeMissions();
  rendEntetePro();
  await rendMurTrophees();
  rendMissions();
  rendRecompensesAReclamer();
  rendEchelle();
}

/* le mur des trophées, en tête de page */
async function rendMurTrophees(){
  const el = document.getElementById("murTropheesZone");
  if(!el || typeof murDesTrophees !== "function") return;
  try{
    const [cat, mien] = await Promise.all([
      sbFetch("trophees_catalogue?select=*&order=categorie"),
      sbFetch(`trophees?cinema_id=eq.${Etat.cinema.id}&select=*`)
    ]);
    Etat._catalogueTrophees = Array.isArray(cat) ? cat : [];
    Etat._mesTrophees = Array.isArray(mien) ? mien : [];
    el.innerHTML = murDesTrophees(Etat._catalogueTrophees, Etat._mesTrophees);
    [...el.querySelectorAll(".ctNomC")].forEach(n=>texteSur(n, n.dataset.t));
  }catch(e){ el.innerHTML = ""; }
}

function rendEntetePro(){
  const n = niveauActuel();
  const inf = infoNiveau(n);
  const p = progressionVersSuivant();
  const suivant = n < niveauMax() ? infoNiveau(n+1) : null;

  document.getElementById("enteteProgression").innerHTML = `
    <section class="carteEcran">
      <div class="blocNiveau">
        <div class="nivGros">${n}</div>
        <div class="nivTitre">${inf.titre}</div>
      </div>
      <div class="pisteXP"><div class="barreXP" id="barreProPage"></div></div>
      <div class="legendeXP">
        <span><b>${xpActuel()}</b> / ${n < niveauMax() ? p.borneHaut : xpActuel()} XP</span>
        ${n < niveauMax() ? `<span>encore <b>${p.reste}</b> XP</span>` : `<span>Niveau maximum</span>`}
      </div>
      ${suivant ? `
        <div class="prochainNiveau">
          <div class="pnLabel">Prochain niveau — ${suivant.titre}</div>
          ${deblocagesDuNiveau(suivant.n).map(r=>`<div class="ligneRecit">${icone(r.ic)}<span><b>${r.nom}</b><br><small>${r.desc}</small></span></div>`).join("")}
        </div>` : ""}
    </section>`;
  setTimeout(()=>{ const b = document.getElementById("barreProPage"); if(b) b.style.width = p.pct + "%"; }, 120);
}

function rendMissions(){
  const el = document.getElementById("blocMissions");
  const ouvertes = missionsOuvertes();
  const faites = MISSIONS.filter(m=>missionFaite(m.cle));
  if(ouvertes.length === 0 && faites.length === 0){ el.innerHTML = ""; return; }
  el.innerHTML = `<section class="carteEcran"><h2>Missions de découverte</h2>
    ${ouvertes.map(m=>`
      <a class="ligneMission" href="${m.url}">
        ${icone("etoile")}
        <span class="lmTxt"><b>${m.titre}</b><small>Récompense : ${m.xp} XP</small></span>
        <span class="lmFleche">→</span>
      </a>`).join("")}
    ${faites.map(m=>`
      <div class="ligneMission faite">
        ${icone("etoile")}
        <span class="lmTxt"><b>${m.titre}</b><small>Accomplie · +${m.xp} XP</small></span>
      </div>`).join("")}
  </section>`;
}

function rendRecompensesAReclamer(){
  const el = document.getElementById("blocReclamer");
  const liste = recompensesAReclamer();
  if(liste.length === 0){ el.innerHTML = ""; return; }
  el.innerHTML = `<section class="carteEcran carteCadeau"><h2>À récupérer</h2>
    ${liste.map(r=>`
      <div class="ligneRecit">${icone(r.ic)}
        <span><b>${r.nom}</b><br><small>${r.desc}</small></span>
        <button class="btnOr btnReclamer" onclick="reclame('${r.cle}')">Récupérer</button>
      </div>`).join("")}</section>`;
}
async function reclame(cle){
  const ok = await reclameRecompense(cle);
  if(ok){
    rendRecompensesAReclamer();
    const r = recompenseParCle(cle);
    const d = document.createElement("div");
    d.className = "toastMission";
    d.innerHTML = `${icone("etoile")}<span><b>Récompense obtenue</b>${r.nom}</span>`;
    document.body.appendChild(d);
    setTimeout(()=>d.remove(), 3600);
  }
}

function rendEchelle(){
  const n = niveauActuel();
  document.getElementById("echelleNiveaux").innerHTML = `
    <section class="carteEcran"><h2>Le premier chapitre</h2>
      ${NIVEAUX.filter(niv=>niv.n <= 10).map(niv=>{
        const acquis = niv.n <= n;
        const reste = Math.max(0, niv.xp - xpActuel());
        return `<div class="paletteNiveau ${acquis?'acquis':''} ${niv.n===n?'courant':''}">
          <div class="pnEnteteNiv">
            <span class="pnNum">${niv.n}</span>
            <span class="pnTitreNiv">${niv.titre}</span>
            <span class="pnEtat">${acquis ? "Débloqué" : "Encore " + reste + " XP"}</span>
          </div>
          <div class="pnRecomp">
            ${deblocagesDuNiveau(niv.n).map(r=>`<span class="puceRecomp">${icone(r.ic)} ${r.nom}</span>`).join("")}
          </div>
        </div>`;
      }).join("")}
      ${niveauMax() > 10 ? `<div class="notePied">Le chapitre suivant commence au niveau 11.</div>` : ""}
    </section>`;
}

/* ---- exports ---- */
export {
  initProgressionPage,
  reclame,
  rendEchelle,
  rendEntetePro,
  rendMissions,
  rendMurTrophees,
  rendRecompensesAReclamer
};

/* ---- gestionnaires en attribut ---- */
/* Ces fonctions sont appelées depuis des attributs onclick écrits
   dans le HTML généré. Un module ES n'expose rien globalement :
   on les rend accessibles explicitement. */
Object.assign(window, {
  reclame
});
