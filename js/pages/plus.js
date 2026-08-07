/* Point d'entrée de plus.html */

import { demarreChargement, finChargement, filetChargement } from "../ui/loading.js?v=becf21cb";
import { initAmbiance } from "../ambiance.js?v=becf21cb";
import { initialiserJeu } from "../game-state.js?v=becf21cb";
import { messageErreur } from "../supabase-client.js?v=becf21cb";
import { initPlus } from "./parts/office.js?v=becf21cb";
import { majBadgeNotifications } from "./parts/community-social.js?v=becf21cb";
import { rendCarteVersion } from "../version.js?v=becf21cb";

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

