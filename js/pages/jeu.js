/* Point d'entrée de jeu.html — composition immersive */

import { demarreChargement, finChargement, filetChargement } from "../ui/loading.js?v=93089721";
import { initAmbiance } from "../ambiance.js?v=93089721";
import { initialiserJeu, Etat } from "../game-state.js?v=93089721";
import { messageErreur } from "../supabase-client.js?v=93089721";
import { initAccueil } from "../cinema.js?v=93089721";
import { majStatutHeader } from "../navigation.js?v=93089721";
import { majBarreXPHeader } from "../progression.js?v=93089721";
import "../facade/lobby.js?v=93089721";
import "../ui/room-view.js?v=93089721";
import "../facade/life.js?v=93089721";
import "../facade/vitality.js?v=93089721";

/* marquer le body AVANT le chargement pour que le CSS
   masque le header classique sans utiliser :has() */
document.body.classList.add("pageImmersive");

demarreChargement();
filetChargement();
initAmbiance("jeu");

try{
  const etat = await initialiserJeu({ onglet: "jeu" });
  if(etat){
    await initAccueil();
    majStatutHeader();
    majBarreXPHeader();
  }
}catch(e){
  console.error("[Séance] jeu", e);
  const zone = document.getElementById("hudNom") || document.body;
  zone.textContent = messageErreur(e) + " Recharge la page.";
}finally{
  finChargement();
}
