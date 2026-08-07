/* Point d'entrée de visite.html — page publique, sans navigation privée */

import { demarreChargement, finChargement, filetChargement } from "../ui/loading.js?v=becf21cb";
import { initAmbiance } from "../ambiance.js?v=becf21cb";
import { protegerPage } from "../auth.js?v=becf21cb";
import { messageErreur } from "../supabase-client.js?v=becf21cb";
import { initVisite } from "./parts/visit.js?v=becf21cb";

demarreChargement();
filetChargement();
initAmbiance("communaute");

try{
  const garde = await protegerPage({ cinemaRequis: false });
  if(garde){
  await initVisite();
  }
}catch(e){
  console.error("[Rex] visite", e);
  document.getElementById("contenuVisite").textContent = messageErreur(e) + " Recharge la page.";
}finally{
  finChargement();
}
