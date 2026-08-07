/* Point d'entrée de studio.html */

import { demarreChargement, finChargement, filetChargement } from "../ui/loading.js?v=144ee666";
import { initAmbiance } from "../ambiance.js?v=144ee666";
import { initialiserJeu } from "../game-state.js?v=144ee666";
import { messageErreur } from "../supabase-client.js?v=144ee666";
import { initStudio } from "../studio.js?v=144ee666";

demarreChargement();
filetChargement();
initAmbiance("studio");

try{
  const etat = await initialiserJeu({ onglet: "studio" });
  if(etat){
  await initStudio();
  }
}catch(e){
  console.error("[Rex] studio", e);
  const zone = document.getElementById("zoneBob") || document.body;
  zone.textContent = messageErreur(e) + " Recharge la page.";
}finally{
  /* la page ne se montre qu'une fois entièrement dessinée */
  finChargement();
}
