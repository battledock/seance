/* ============================================================
   L'ÉCRAN DE CHARGEMENT — retiré

   Chaque page posait un voile bordeaux avec une bobine qui
   tournait et des messages qui défilaient. L'intention était de
   masquer une page à moitié montée ; l'effet réel était un écran
   de plus entre le joueur et le jeu, à chaque déplacement.

   Le voile ne s'affiche plus. Les pages se montent devant le
   joueur, comme n'importe quel site : c'est plus rapide à vivre,
   même si c'est moins net pendant une demi-seconde.

   Les fonctions restent exportées — treize pages les appellent —
   mais elles se contentent désormais de marquer la page prête.
   ============================================================ */

const MESSAGES = [];
let minuteurMessage = null;

/* on retire le voile s'il traîne encore dans le HTML d'une page */
function demarreChargement(){
  const voile = document.getElementById("voileChargement");
  if(voile) voile.remove();
  document.body.classList.add("pret");
}

function finChargement(){
  document.body.classList.add("pret");
}

/* plus de filet à tendre : rien ne peut rester coincé */
function filetChargement(){}

/* ---- exports ---- */
export {
  MESSAGES,
  demarreChargement,
  filetChargement,
  finChargement,
  minuteurMessage
};
