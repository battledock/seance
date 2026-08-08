/* ============================================================
   LA PRESSE

   Une note critique unique ne veut rien dire. Dans le métier, un
   même film récolte 26 chez la revue exigeante et 66 chez le site
   populaire — et l'exploitant apprend lequel ressemble à son
   quartier.

   C'est ce désaccord qui porte l'information. Quand tous les
   médias s'accordent, il n'y a rien à décider ; quand ils se
   déchirent, il faut savoir qui l'on sert.
   ============================================================ */

import { echappe } from "./grille.js?v=becf21cb";

function classeNote(n){
  return n >= 75 ? "h" : n >= 55 ? "m" : "b";
}

/* ---------- la règle graduée ----------
   Chaque média est un point placé selon sa note. Les points qui
   se chevauchent sont écartés visuellement, mais gardent leur
   valeur — c'est la position qui bouge, jamais le chiffre. */
function regle(avis, noteQuartier){
  const tries = avis.slice().sort((a, b) => a.note - b.note);
  let dernier = -99;
  const pts = tries.map(a => {
    let x = Math.max(5, Math.min(95, a.note));
    if(x - dernier < 8) x = dernier + 8;
    dernier = x;
    return `<span class="prPt" style="left:${Math.min(96, x)}%;background:${a.couleur}"
      title="${echappe(a.nom)}">${a.note}</span>`;
  }).join("");

  /* le repère du quartier passe sous les pastilles pour ne jamais
     être masqué, et son étiquette se range du côté libre */
  const q = Math.max(4, Math.min(96, noteQuartier));
  const aGauche = q > 62;

  return `<div class="regle">
    <div class="axe"></div>
    <div class="moy" style="left:${q}%"></div>
    <div class="etq ${aGauche ? "g" : "d"}" style="left:${q}%">chez vous ${noteQuartier}</div>
    ${pts}
  </div>`;
}

/* ---------- le bandeau, sur la carte du film ---------- */
function rendPresse(p){
  if(!p || !p.avis || !p.avis.length) return "";
  const avis = p.avis;
  const notes = avis.map(a => a.note);
  const ecart = Math.max(...notes) - Math.min(...notes);
  const q = p.note_quartier ?? Math.round(notes.reduce((t, n) => t + n, 0) / notes.length);
  const divise = ecart >= 30;

  return `<div class="pr">
    <div class="prT"><span class="lb">La presse</span>
      <b class="${classeNote(q)}">${q}<i>lu chez vous</i></b></div>
    ${regle(avis, q)}
    <div class="prLeg">${avis.map(a =>
      `<span><i style="background:${a.couleur}"></i>${echappe(a.nom)}</span>`).join("")}</div>
    <div class="prNote ${divise ? "divise" : ""}">${divise
      ? `<b>La presse est très partagée</b> — ${ecart} points d'écart. Il faut choisir qui vous servez.`
      : ecart >= 18
      ? "<b>La presse hésite.</b> Les avis divergent selon les publics."
      : "<b>La presse s'accorde.</b> Peu de surprise à attendre."}</div>
  </div>`;
}

/* ---------- la revue dépliée ---------- */
function rendKiosque(p, titre, sous){
  if(!p || !p.avis) return `<div class="cVide">Aucune critique parue.</div>`;
  const avis = p.avis.slice().sort((a, b) => (b.part || 0) - (a.part || 0));

  return `
    ${titre ? `<div class="kTitre">${echappe(titre)}
      ${sous ? `<span>${echappe(sous)}</span>` : ""}</div>` : ""}
    <div class="kiosque">
      ${avis.map(a => `
        <div class="journal ${(a.part || 0) < 10 ? "faible" : ""}"
          style="border-left:4px solid ${a.couleur}">
          <div class="ent">
            <div class="jNom"><b>${echappe(a.nom)}</b><span>${echappe(a.genre || "")}</span></div>
            <div class="jLigne">${echappe(a.ligne || "")}</div>
            ${a.part != null ? `<div class="jPoids">
              <span class="b"><i style="width:${Math.min(100, a.part * 2)}%;
                background:${a.couleur}"></i></span>
              <span class="t">${a.part} % de vos habitants</span></div>` : ""}
          </div>
          <div class="jNote"><b class="${classeNote(a.note)}">${a.note}</b>
            <span>sur 100</span></div>
        </div>`).join("")}
    </div>
    ${p.note_quartier != null ? `<div class="chez">
      <div class="h"><span class="lb">Lu dans votre quartier</span>
        <span class="v">${p.note_quartier}</span></div>
      <div class="n">${phraseQuartier(p, avis)}</div>
    </div>` : ""}`;
}

/* La phrase qui explique le calcul. C'est elle qui transforme
   cinq chiffres en une leçon : un film encensé par une revue que
   personne ne lit chez vous ne remplira pas la salle. */
function phraseQuartier(p, avis){
  const dominant = avis[0];
  const meilleur = avis.slice().sort((a, b) => b.note - a.note)[0];
  const pire = avis.slice().sort((a, b) => a.note - b.note)[0];
  const q = p.note_quartier;

  if(meilleur.note - pire.note < 18){
    return `Tous vos médias s'accordent autour de <b>${q}</b>. Ce film sera reçu
      comme il est annoncé.`;
  }
  if((meilleur.part || 0) < 15 && meilleur.note - q > 12){
    return `${echappe(meilleur.nom)} l'encense à ${meilleur.note}, mais ${
      echappe(meilleur.nom)} ne pèse que <b>${meilleur.part} %</b> de vos habitants.
      ${echappe(dominant.nom)}, qui en touche ${dominant.part} %, ne lui donne que
      ${dominant.note}. Chez vous ce film vaut <b>${q}</b>.`;
  }
  if((pire.part || 0) < 15 && q - pire.note > 12){
    return `${echappe(pire.nom)} le fusille à ${pire.note}, mais elle ne compte
      pour presque rien ici. Vos habitants lisent surtout ${echappe(dominant.nom)},
      qui lui accorde ${dominant.note}. Chez vous ce film vaut <b>${q}</b>.`;
  }
  return `Vos habitants lisent surtout ${echappe(dominant.nom)}
    (<b>${dominant.part} %</b>), qui lui donne ${dominant.note}.
    Chez vous ce film vaut <b>${q}</b>.`;
}

export { rendPresse, rendKiosque, classeNote };
