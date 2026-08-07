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
  /* ------------------------------------------------------------
     QUAND LE CHARGEMENT ÉCHOUE

     On écrivait le message d'erreur dans le nom du cinéma, en haut
     de l'écran, et on s'arrêtait là. Le joueur se retrouvait devant
     une page noire barrée d'une phrase, sans rien à toucher : il
     fallait deviner qu'il fallait recharger.

     On affiche maintenant un vrai écran, avec un bouton qui
     recommence. Le détail technique est visible mais discret, pour
     que le joueur puisse le rapporter s'il revient.
     ------------------------------------------------------------ */
  console.error("[Séance] jeu", e);
  montreEchec(e);
}finally{
  /* « pret » ne sert plus qu'à faire apparaître la barre du bas */
  document.body.classList.add("pret");
}



/* ------------------------------------------------------------
   L'ÉCRAN D'ÉCHEC

   Il n'affichait que le nom de l'erreur — « TypeError » — ce qui
   ne dit rien de l'endroit ni de la cause. On montre maintenant
   le message et la première ligne utile de la pile, repliés sous
   un détail : invisible au joueur ordinaire, mais copiable en un
   geste quand il faut rapporter la panne.
   ------------------------------------------------------------ */
function montreEchec(e){
  const nom = (e && (e.code || e.name)) ? String(e.code || e.name) : "inconnu";
  const msg = (e && e.message) ? String(e.message) : "";
  const pile = (e && e.stack) ? String(e.stack).split("\n").slice(0,4).join("\n") : "";
  const technique = (nom + (msg ? " — " + msg : "") + (pile ? "\n\n" + pile : ""))
    .replace(/</g, "&lt;");

  const o = document.createElement("div");
  o.className = "echecChargement";
  o.innerHTML = `
    <div class="ecBoite">
      <h2>Le cinéma n'a pas ouvert</h2>
      <p>${messageErreur(e)}</p>
      <button class="ecReessayer" id="ecReessayer">Réessayer</button>
      <details class="ecDetail">
        <summary>Détail technique</summary>
        <pre id="ecPile">${technique}</pre>
        <button class="ecCopier" id="ecCopier">Copier</button>
      </details>
    </div>`;
  document.body.appendChild(o);

  document.getElementById("ecReessayer").addEventListener("click", ()=>location.reload());
  document.getElementById("ecCopier").addEventListener("click", ()=>{
    const t = document.getElementById("ecPile").textContent;
    try{ navigator.clipboard.writeText(t); }catch(err){}
    document.getElementById("ecCopier").textContent = "Copié";
  });
}
