/* Point d'entrée de jeu.html — composition immersive */

import { initAmbiance } from "../ambiance.js?v=becf21cb";
import { initialiserJeu, Etat } from "../game-state.js?v=becf21cb";
import { messageErreur } from "../supabase-client.js?v=becf21cb";
import { initAccueil } from "../cinema.js?v=becf21cb";
import { majStatutHeader } from "../navigation.js?v=becf21cb";
import { majBarreXPHeader } from "../progression.js?v=becf21cb";
import "../facade/lobby.js?v=becf21cb";
import "../ui/room-view.js?v=becf21cb";
import "../facade/life.js?v=becf21cb";
import "../facade/vitality.js?v=becf21cb";

/* marquer le body AVANT le chargement pour que le CSS
   masque le header classique sans utiliser :has() */
document.body.classList.add("pageImmersive");

/* Plus d'écran de chargement ici : la page porte déjà la couleur du
   ciel, on attend devant le ciel plutôt que devant une bobine. */
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
  /* « pret » ne sert plus qu'à faire apparaître la barre du bas */
  document.body.classList.add("pret");
}

