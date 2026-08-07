/* ============================================================
   LES TRANSITIONS ENTRE PAGES — retirées

   Un clic sur la navigation posait un voile presque noir sur
   l'écran, attendait 240 ms, puis seulement changeait de page.
   L'intention était d'adoucir le passage d'une pièce à l'autre ;
   l'effet réel était un écran noir de deux dixièmes de seconde
   avant chaque page, et une impression de lenteur à chaque
   déplacement dans le bâtiment.

   Le navigateur sait déjà passer d'une page à l'autre. On le
   laisse faire : les liens redeviennent des liens ordinaires.

   Les fonctions restent exportées — plusieurs pages les
   importent — mais elles ne font plus rien.
   ============================================================ */

/* arrivée dans la pièce : plus d'animation d'entrée */
export function entreeDePage(){}

/* départ vers une autre pièce : navigation directe */
export function quitteLieu(href){
  if(href) location.href = href;
}

/* plus d'interception des liens : le navigateur s'en charge */
export function installeTransitions(){}
