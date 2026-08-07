/* Point d'entrée de preparation.html */

import { demarreChargement, finChargement, filetChargement } from "../ui/loading.js?v=becf21cb";
import { initAmbiance } from "../ambiance.js?v=becf21cb";
import { initialiserJeu } from "../game-state.js?v=becf21cb";
import { messageErreur } from "../supabase-client.js?v=becf21cb";
import { initPreparation } from "../day-prep.js?v=becf21cb";
import "../facade/life.js?v=becf21cb";

demarreChargement();
filetChargement();
initAmbiance("jeu");

try{
  const etat = await initialiserJeu({ onglet: "jeu" });
  if(etat){
  await initPreparation();
  }
}catch(e){
  console.error("[Rex] preparation", e);
  const zone = document.getElementById("zonePrep") || document.body;
  zone.textContent = messageErreur(e) + " Recharge la page.";
}finally{
  /* la page ne se montre qu'une fois entièrement dessinée */
  finChargement();
}
