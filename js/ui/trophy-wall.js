import { Etat } from "../game-state.js?v=2ab9afab";
import { toastSocial } from "../social.js?v=2ab9afab";
import { echappe, texteSur } from "./emblems.js?v=2ab9afab";
import { icone } from "./icons.js?v=2ab9afab";

/* ============================================================
   LE MUR DES TROPHÉES
   Des cadres accrochés. Vides tant que rien n'est gagné.
   On décroche un trophée pour lire son histoire.
   ============================================================ */

const HISTOIRES_TROPHEES = {
  premiere_journee:"Le premier soir, tu as éteint l'enseigne à minuit sans savoir si quelqu'un reviendrait. Ils sont revenus.",
  dix_journees:"Dix soirs de suite. Le quartier a commencé à compter sur toi sans te le dire.",
  cinquante_journees:"Cinquante journées. Les habitués ont leur rang, leur horaire, leur silence.",
  salle_complete:"Ce soir-là, tu as dû refuser du monde. Bob a proposé d'ajouter des chaises. On a dit non.",
  mille_spectateurs:"Mille personnes ont vu un film chez toi. Mille visages dans le noir.",
  dix_mille_spectateurs:"Dix mille. À ce stade, ce n'est plus un cinéma, c'est une habitude de quartier.",
  niveau_5:"Le comptoir a ouvert. L'odeur du popcorn a rejoint celle de la moquette.",
  niveau_10:"Deux écrans. Tu ne choisis plus un film par soir, tu construis une programmation.",
  deuxieme_salle:"Le mur est tombé un mardi. Le lundi suivant, la salle 2 projetait.",
  facade_personnalisee:"Un coup de peinture, et la façade a cessé de ressembler à toutes les autres.",
  premier_bravo:"Quelqu'un d'un autre quartier a applaudi ton travail. Ça compte plus qu'on ne croit.",
  cinq_amis:"Cinq gérants avec qui parler de projecteurs capricieux.",
  dix_abonnements:"Tu suis dix cinémas. Tu regardes les autres faire, et tu apprends.",
  cinquante_reactions:"Cinquante marques d'appréciation. Le bouche-à-oreille a fait son travail."
};

/* le mur : autant de cadres que de trophées au catalogue */
function murDesTrophees(catalogue, obtenus){
  const parCle = Object.fromEntries(obtenus.map(t=>[t.cle, t]));
  const total = catalogue.length, gagnes = obtenus.length;

  return `
    <div class="murTrophees">
      <div class="mtEclairage"></div>
      <div class="mtGrille">
        ${catalogue.map((c,i)=>{
          const gagne = !!parCle[c.cle];
          const incline = ((i*29) % 5 - 2) * 0.6;
          return `<button class="cadreTrophee ${gagne?'plein':'vide'}"
            style="--incline:${incline.toFixed(1)}deg"
            onclick="${gagne ? `ouvreTrophee('${c.cle}')` : `trophéeMystere('${c.cle}')`}"
            aria-label="${echappe(gagne ? c.nom : "Trophée à débloquer")}">
            <span class="ctCrochet"></span>
            <span class="ctCadre">
              ${gagne ? `<span class="ctMedaille">${icone(c.icone || "etoile")}</span>
                         <span class="ctNomC" data-t="${echappe(c.nom)}"></span>`
                      : `<span class="ctSilhouette">${icone(c.icone || "etoile")}</span>`}
            </span>
          </button>`;
        }).join("")}
      </div>
      <div class="mtPlaque">${gagnes} trophée${gagnes>1?"s":""} sur ${total}</div>
    </div>`;
}

function ouvreTrophee(cle){
  const c = (Etat._catalogueTrophees || []).find(x=>x.cle === cle);
  const t = (Etat._mesTrophees || []).find(x=>x.cle === cle);
  if(!c) return;
  const o = document.createElement("div");
  o.className = "voileTropheeFiche"; o.id = "voileTropheeFiche";
  o.innerHTML = `<div class="ficheTrophee">
    <button class="agFermer" onclick="fermeTrophee()" aria-label="Fermer">✕</button>
    <div class="ftMedaille">${icone(c.icone || "etoile", "icoTrophee")}</div>
    <div class="ftNom" id="ftNom"></div>
    <div class="ftDesc" id="ftDesc"></div>
    <div class="ftHistoire" id="ftHistoire"></div>
    ${t?.obtenu_le ? `<div class="ftDate">Obtenu le ${echappe(String(t.obtenu_le).slice(0,10))}</div>` : ""}
  </div>`;
  document.body.appendChild(o);
  texteSur(document.getElementById("ftNom"), c.nom);
  texteSur(document.getElementById("ftDesc"), c.description || "");
  texteSur(document.getElementById("ftHistoire"), HISTOIRES_TROPHEES[cle] || "");
}
function fermeTrophee(){
  const o = document.getElementById("voileTropheeFiche");
  if(o){ o.classList.add("sortie"); setTimeout(()=>o.remove(), 260); }
}
function trophéeMystere(cle){
  const c = (Etat._catalogueTrophees || []).find(x=>x.cle === cle);
  if(typeof toastSocial === "function")
    toastSocial("Ce cadre attend encore son trophée. " + (c?.description || ""), "porte");
}

/* ---- exports ---- */
export {
  HISTOIRES_TROPHEES,
  fermeTrophee,
  murDesTrophees,
  ouvreTrophee,
  trophéeMystere
};

/* ---- gestionnaires en attribut ---- */
/* Ces fonctions sont appelées depuis des attributs onclick écrits
   dans le HTML généré. Un module ES n'expose rien globalement :
   on les rend accessibles explicitement. */
Object.assign(window, {
  fermeTrophee,
  ouvreTrophee,
  trophéeMystere
});
