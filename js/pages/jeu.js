/* Point d'entrée de jeu.html */

import { demarreChargement, finChargement, filetChargement } from "../ui/loading.js?v=2ab9afab";
import { initAmbiance } from "../ambiance.js?v=2ab9afab";
import { initialiserJeu, Etat } from "../game-state.js?v=2ab9afab";
import { messageErreur } from "../supabase-client.js?v=2ab9afab";
import { initAccueil } from "../cinema.js?v=2ab9afab";
import { majStatutHeader } from "../navigation.js?v=2ab9afab";
import { majBarreXPHeader } from "../progression.js?v=2ab9afab";
import "../facade/lobby.js?v=2ab9afab";
import "../ui/room-view.js?v=2ab9afab";
import "../facade/life.js?v=2ab9afab";
import "../facade/vitality.js?v=2ab9afab";

demarreChargement();
filetChargement();
initAmbiance("jeu");

try{
  const etat = await initialiserJeu({ onglet: "jeu" });
  if(etat){
  await initAccueil();
  majStatutHeader();
  majBarreXPHeader();
  /* la devise n'a plus de place sur l'accueil refondu : on ne l'écrit
     que si l'élément existe encore, pour ne pas casser la page */
  const dev = document.getElementById("deviseBas");
  if(dev && Etat.cinema.devise) dev.textContent = "« " + Etat.cinema.devise + " »";
  }
}catch(e){
  console.error("[Rex] jeu", e);
  const zone = document.getElementById("bulleTexteAccueil") || document.body;
  zone.textContent = messageErreur(e) + " Recharge la page.";
}finally{
  /* la page ne se montre qu'une fois entièrement dessinée */
  finChargement();
}
