import { chargeStats, passeAuJourSuivant, xpDeLaJournee } from "../../engine/day.js?v=2ab9afab";
import { bobBilan } from "../../engine/simulation.js?v=2ab9afab";
import { Etat, fmtArgent } from "../../game-state.js?v=2ab9afab";
import { appelSecurise, rpc, sbFetch } from "../../supabase-client.js?v=2ab9afab";
import { echappe } from "../../ui/emblems.js?v=2ab9afab";
import { icone } from "../../ui/icons.js?v=2ab9afab";

/* ============================================================
   BILAN DE FIN DE JOURNÉE
   Affiche TOUJOURS les données sauvegardées (jamais de recalcul).
   ============================================================ */
let bilanCourant = null;
let xpAttribuee = 0;
let recordBattu = false;

let situationDuJour = null;

async function chargeSituationBilan(jour){
  const appel = await appelSecurise(
    () => rpc("get_day_situation", {p_cinema_id: Etat.cinema.id, p_jour: jour ?? null}),
    {rechargeApresErreur: false});
  situationDuJour = (appel.ok && appel.data && appel.data.success) ? appel.data.data : null;
}

/* ------------------------------------------------------------
   LE CHOIX DU JOUR
   Il n'apparaît que si une décision a été prise. Une situation
   ignorée le dit aussi : le joueur doit voir ce qu'il a laissé
   passer, sinon ignorer ne coûte rien.
   ------------------------------------------------------------ */
/* ------------------------------------------------------------
   CE QUE LA JOURNÉE DOIT AUX DÉCISIONS

   Le joueur paie un loyer, des salaires, parfois une campagne ou
   une soirée. Sans ce bloc, il voit un bénéfice net sans savoir
   d'où vient la différence — et il cesse de décider.
   ------------------------------------------------------------ */
function blocLeviers(b){
  const l = b && b.leviers;
  if(!l) return "";
  const out = [];

  if(l.charges && Number(l.charges.total) > 0){
    out.push(`<div class="ligneRecit">${icone("batiment")}
      <span>Charges du jour : <b class="negatif">−${fmtArgent(l.charges.total)}</b>
        <small>${echappe(l.charges.detail || "")}</small></span></div>`);
  }

  if(l.campagne){
    const c = l.campagne;
    out.push(`<div class="ligneRecit">${icone("journal")}
      <span>${echappe(c.nom)} — jour ${c.jour_sur} sur ${c.duree} :
        <b class="positif">+${fmtArgent(c.apport)}</b>
        <small>de recette attribuable au renfort de fréquentation</small></span></div>`);
  }

  if(l.soiree){
    const s = l.soiree;
    const tout = Number(s.accordees) === Number(s.total);
    out.push(`<div class="ligneRecit">${icone("etoile")}
      <span>${echappe(s.nom)} :
        <b class="${tout ? "positif" : "negatif"}">${s.accordees} séance(s) sur ${s.total}
        dans le thème</b>
        <small>${tout ? "tout était accordé — le public a suivi"
                      : "les séances hors thème ont perdu du monde"}</small></span></div>`);
  }

  if(l.equipe){
    const e = l.equipe;
    out.push(`<div class="ligneRecit">${icone("spectateurs")}
      <span>L'équipe : <b>+${e.satisfaction} de satisfaction</b>
        <small>${e.effectif} personne(s) · ${fmtArgent(e.salaires)} par jour ·
          risque d'incident réduit de ${Math.round(Number(e.reduit_incident) * 100)} %</small></span></div>`);
  }

  return out.length ? `<div class="blocLeviers">
    <div class="titreLeviers">Ce que tu as décidé</div>${out.join("")}</div>` : "";
}

function blocSituation(){
  const s = situationDuJour;
  if(!s) return "";

  if(s.statut === "ignoree"){
    return `<section class="carteEcran carteChoix laissee">
      <h2>Le dossier du jour</h2>
      <div class="choixTitre">${echappe(s.titre || "")}</div>
      <p class="choixResume">Tu n'as pas répondu. L'occasion est passée.</p>
    </section>`;
  }
  if(s.statut !== "resolue") return "";

  const effets = Array.isArray(s.effets) ? s.effets : [];
  const differe = s.differe || {};
  const suites = phrasesDiffere(differe);

  return `<section class="carteEcran carteChoix">
    <h2>Ton choix du jour</h2>
    <div class="choixTitre">${echappe(s.titre || "")}</div>
    <p class="choixResume">${echappe(s.resume || s.titre_option || "")}</p>

    ${effets.length ? `<div class="choixEffets">
      ${effets.map(e=>`<div class="choixEffet">${icone("etoile")}
        <span>${echappe(e)}</span></div>`).join("")}
    </div>` : ""}

    ${suites.length ? `<div class="choixSuites">
      <div class="csTitre">Ce que ça laisse derrière</div>
      ${suites.map(t=>`<div class="choixEffet suite">${icone("horloge")}
        <span>${echappe(t)}</span></div>`).join("")}
    </div>` : ""}
  </section>`;
}

/* la traduction, la même que côté serveur — utilisée quand le
   serveur n'a rendu que le bloc technique */
function phrasesDiffere(d){
  const out = [];
  const n = c => Number(d[c]);
  if(n("affinite_familles"))
    out.push(n("affinite_familles") > 0
      ? "Les familles du quartier s'en souviendront"
      : "Les familles retiendront le refus");
  if(n("affinite_etudiants"))
    out.push(n("affinite_etudiants") > 0
      ? "Le bouche-à-oreille passe par les étudiants"
      : "Les étudiants iront voir ailleurs");
  if(n("affinite_cinephiles"))
    out.push(n("affinite_cinephiles") > 0
      ? "Les cinéphiles ont noté l'adresse"
      : "Les cinéphiles resteront distants");
  if(n("reputation"))
    out.push(n("reputation") > 0
      ? "Réputation en hausse de " + n("reputation")
      : "Réputation en baisse de " + Math.abs(n("reputation")));
  return out;
}

async function initBilan(){
  await chargeStats();
  const c = Etat.cinema;
  const d = await sbFetch(`journees?cinema_id=eq.${c.id}&jour=eq.${c.jour}&select=*`);
  const j = Array.isArray(d) && d[0];

  /* la décision du jour, si une situation s'est présentée.
     On la lit d'abord dans le bilan archivé — il survit à
     l'archivage de la situation — et sinon on la demande. */
  situationDuJour = (j && j.resultats && j.resultats.situation) || null;
  if(!situationDuJour) await chargeSituationBilan(c.jour);

  if(!j || !j.resultats){
    document.getElementById("contenuBilan").innerHTML = `
      <section class="carteEcran">
        <h2>Pas encore de bilan</h2>
        <div class="vide">La journée n'a pas été jouée.<br>Retourne à l'accueil pour ouvrir le cinéma.</div>
        <button class="btnRouge btnJourSuivant" onclick="location.href='jeu.html'">Retour au cinéma</button>
      </section>`;
    return;
  }
  if(j.statut === "completed"){
    /* bilan déjà validé : lecture seule */
    bilanCourant = j.resultats;
    rendBilan(bilanCourant, true);
    return;
  }

  bilanCourant = j.resultats;
  bilanCourant._jour = c.jour;
  /* l'XP a déjà été attribuée par simuler_journee() : on lit le total officiel */
  xpAttribuee = xpDeLaJournee(bilanCourant);
  recordBattu = Number(bilanCourant.total_spectateurs) > Number(Etat.stats?.meilleure_journee || 0)
                && Number(Etat.stats?.meilleure_journee || 0) > 0;
  rendBilan(bilanCourant, false);
}

function mentionSatisfaction(s){
  if(s < 40) return "très mauvais";
  if(s < 60) return "moyen";
  if(s < 75) return "satisfaisant";
  if(s < 90) return "très bon";
  return "exceptionnel";
}

function rendBilan(b, dejaValide){
  const c = Etat.cinema;
  const incidents = b.resultats.filter(r=>r.incident_texte);
  const remplie = b.resultats.find(r=>String(r.seance_id) === String(b.seance_plus_remplie));

  document.getElementById("contenuBilan").innerHTML = `
    <div class="enteteBilan">
      <div class="ebJour">Jour ${b._jour || c.jour} terminé</div>
      <div class="ebSous">${b.evenement.nom}</div>
    </div>

    <section class="carteEcran">
      <h2>Les chiffres</h2>
      <div class="ligneRecit">${icone("spectateurs")}<span>Spectateurs : <b>${b.total_spectateurs}</b></span></div>
      <div class="ligneRecit">${icone("billet")}<span>Recettes billetterie : <b>${fmtArgent(b.recettes_brutes)}</b></span></div>
      ${b.recettes_confiserie ? `<div class="ligneRecit">${icone("billet")}<span>Confiserie : <b>+${fmtArgent(b.recettes_confiserie)}</b> <small>${b.articles_confiserie} articles · coût ${fmtArgent(b.cout_confiserie)}</small></span></div>` : ""}
      <div class="ligneRecit">${icone("pellicule")}<span>Licences : <b>−${fmtArgent(b.cout_licences)}</b> <small>(déjà payées à l'ouverture)</small></span></div>
      <div class="ligneRecit">${icone("piece")}<span>Bénéfice net : <b class="${b.benefice_net<0?'negatif':'positif'}">${b.benefice_net<0?"−":"+"}${fmtArgent(Math.abs(b.benefice_net))}</b></span></div>
      <div class="ligneRecit">${icone("etoile")}<span>Satisfaction moyenne : <b>${b.satisfaction_moyenne} %</b> <small>${mentionSatisfaction(b.satisfaction_moyenne)}</small></span></div>
      <div class="ligneRecit">${icone("journal")}<span>Réputation : <b class="${b.variation_reputation<0?'negatif':'positif'}">${b.variation_reputation>0?"+":""}${b.variation_reputation}</b></span></div>
      ${blocLeviers(b)}
      ${dejaValide ? "" : `<div class="ligneRecit">${icone("camera")}<span>XP gagnée : <b class="positif">+${xpAttribuee}</b></span></div>`}
    </section>

    ${blocSituation()}

    <div class="blocBob bilanBob">
      <div class="bobMiniTete grand"><svg viewBox="30 40 60 60">
        <circle cx="60" cy="70" r="26" fill="#f0c9a0"/>
        <path d="M40 78 Q50 86 60 79 Q70 86 80 78 Q72 92 60 84 Q48 92 40 78" fill="#4a3527"/>
        <path d="M44 60 Q51 55 57 59 M63 59 Q69 55 76 60" stroke="#4a3527" stroke-width="4" fill="none" stroke-linecap="round"/>
        <circle cx="51" cy="66" r="2.6" fill="#1c1210"/><circle cx="69" cy="66" r="2.6" fill="#1c1210"/>
        <path d="M34 56 Q60 34 86 56 L86 50 Q60 28 34 50 Z" fill="#571520"/>
        <rect x="52" y="44" width="16" height="7" rx="2" fill="#e8b84b"/>
      </svg></div>
      <div class="bulle"><b>Bob</b><span>${bobBilan(b, c)}</span></div>
    </div>

    ${recordBattu ? `<div class="bandeauRecord">${icone("etoile")} Nouveau record de fréquentation : ${b.total_spectateurs} spectateurs</div>` : ""}

    <section class="carteEcran">
      <h2>Séance par séance</h2>
      ${b.resultats.map(r=>`
        <div class="ligneBilanSeance">
          <div class="lbHeure">${r.heure}</div>
          <div class="lbCorps">
            <div class="lbTitre">${r.titre}</div>
            <div class="lbJauge"><i style="width:${Math.round(r.spectateurs/r.capacite*100)}%"></i></div>
            <div class="lbMeta">${r.spectateurs} / ${r.capacite} places · ${fmtArgent(r.brut)} · satisfaction ${r.satisfaction} %${r.confiserie?.articles?` · ${r.confiserie.articles} articles vendus` : ""}</div>
            ${r.incident_texte ? `<div class="lbIncident">${icone("cloche")} ${r.incident_texte}</div>` : ""}
          </div>
        </div>`).join("")}
    </section>

    <section class="carteEcran">
      <h2>Faits du jour</h2>
      <div class="ligneRecit">${icone("journal")}<span><b>${b.evenement.nom}</b><br><small>${b.evenement.description}</small></span></div>
      ${b.meilleur_film ? `<div class="ligneRecit">${icone("etoile")}<span>Meilleur accueil : <b>${b.meilleur_film}</b></span></div>` : ""}
      ${remplie ? `<div class="ligneRecit">${icone("fauteuil")}<span>Séance la plus remplie : <b>${remplie.heure} — ${remplie.titre}</b> <small>(${remplie.spectateurs}/${remplie.capacite})</small></span></div>` : ""}
      ${incidents.length === 0 ? `<div class="ligneRecit">${icone("outil")}<span>Aucun incident. Bob est presque déçu.</span></div>` : ""}
    </section>

    ${dejaValide
      ? `<button class="btnRouge btnJourSuivant" onclick="location.href='jeu.html'">Retour au cinéma</button>`
      : `<button class="btnRouge btnJourSuivant" id="btnSuivant" onclick="validerBilan()">Passer au jour ${(b._jour||c.jour)+1}</button>`}`;
}

async function validerBilan(){
  const b = document.getElementById("btnSuivant");
  if(b){ b.disabled = true; b.textContent = "Bob range la salle…"; }
  await passeAuJourSuivant(bilanCourant);
}

/* ---- exports ---- */
export {
  bilanCourant,
  blocLeviers,
  blocSituation,
  chargeSituationBilan,
  initBilan,
  mentionSatisfaction,
  phrasesDiffere,
  recordBattu,
  rendBilan,
  situationDuJour,
  validerBilan,
  xpAttribuee
};

/* ---- gestionnaires en attribut ---- */
/* Ces fonctions sont appelées depuis des attributs onclick écrits
   dans le HTML généré. Un module ES n'expose rien globalement :
   on les rend accessibles explicitement. */
Object.assign(window, {
  validerBilan
});
