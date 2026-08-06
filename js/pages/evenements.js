/* Point d'entrée de evenements.html */

import { demarreChargement, finChargement, filetChargement } from "../ui/loading.js?v=2ab9afab";
import { initAmbiance } from "../ambiance.js?v=2ab9afab";
import { initialiserJeu } from "../game-state.js?v=2ab9afab";
import { messageErreur } from "../supabase-client.js?v=2ab9afab";
import { initEvenements } from "./parts/events.js?v=2ab9afab";
import { bobCompact } from "../navigation.js?v=2ab9afab";

demarreChargement();
filetChargement();
initAmbiance("evenements");

try{
  const etat = await initialiserJeu({ onglet: "plus" });
  if(etat){
  await initEvenements();
  document.getElementById("zoneBob").appendChild(bobCompact(
    "Tout le quartier participe. Même le Majestic. Essayons de faire mieux qu'eux tout en restant très polis."));
  }
}catch(e){
  console.error("[Rex] evenements", e);
  const zone = document.getElementById("zoneBob") || document.body;
  zone.textContent = messageErreur(e) + " Recharge la page.";
}finally{
  /* la page ne se montre qu'une fois entièrement dessinée */
  finChargement();
}
