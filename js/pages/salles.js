/* Point d'entrée de salles.html */

import { demarreChargement, finChargement, filetChargement } from "../ui/loading.js?v=93089721";
import { initAmbiance } from "../ambiance.js?v=93089721";
import { initialiserJeu } from "../game-state.js?v=93089721";
import { messageErreur } from "../supabase-client.js?v=93089721";
import { initSalles } from "../rooms.js?v=93089721";

demarreChargement();
filetChargement();
initAmbiance("salles");

try{
  const etat = await initialiserJeu({ onglet: "salles" });
  if(etat){
  await initSalles();
  }
}catch(e){
  console.error("[Rex] salles", e);
  const zone = document.getElementById("zoneBob") || document.body;
  zone.textContent = messageErreur(e) + " Recharge la page.";
}finally{
  /* la page ne se montre qu'une fois entièrement dessinée */
  finChargement();
}
