/* Point d'entrée de plus.html */

import { demarreChargement, finChargement, filetChargement } from "../ui/loading.js?v=93089721";
import { initAmbiance } from "../ambiance.js?v=93089721";
import { initialiserJeu } from "../game-state.js?v=93089721";
import { messageErreur } from "../supabase-client.js?v=93089721";
import { initPlus } from "./parts/office.js?v=93089721";
import { majBadgeNotifications } from "./parts/community-social.js?v=93089721";
import { rendCarteVersion } from "../version.js?v=93089721";

demarreChargement();
filetChargement();
initAmbiance("communaute");

try{
  const etat = await initialiserJeu({ onglet: "plus" });
  if(etat){
  initPlus();
  majBadgeNotifications();
  rendCarteVersion();
  }
}catch(e){
  console.error("[Rex] plus", e);
  const zone = document.getElementById("zoneBob") || document.body;
  zone.textContent = messageErreur(e) + " Recharge la page.";
}finally{
  /* la page ne se montre qu'une fois entièrement dessinée */
  finChargement();
}

