/* Point d'entrée de programmation.html */

import { demarreChargement, finChargement, filetChargement } from "../ui/loading.js?v=becf21cb";
import { initAmbiance } from "../ambiance.js?v=becf21cb";
import { initialiserJeu } from "../game-state.js?v=becf21cb";
import { messageErreur } from "../supabase-client.js?v=becf21cb";
import { initProgrammation } from "../screenings.js?v=becf21cb";
import "../ui/genre-posters.js?v=becf21cb";

demarreChargement();
filetChargement();
initAmbiance("programmation");

try{
  const etat = await initialiserJeu({ onglet: "prog" });
  if(etat){
  await initProgrammation();
  }
}catch(e){
  console.error("[Rex] programmation", e);
  const zone = document.getElementById("zoneBob") || document.body;
  zone.textContent = messageErreur(e) + " Recharge la page.";
}finally{
  /* la page ne se montre qu'une fois entièrement dessinée */
  finChargement();
}
