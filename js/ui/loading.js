/* ============================================================
   L'ÉCRAN DE CHARGEMENT
   Le HTML est en place avant que les données arrivent. Sans
   voile, le joueur voit une page à moitié montée pendant deux
   secondes. On la cache jusqu'au premier rendu complet.
   ============================================================ */

const MESSAGES = [
  "On allume le projecteur…",
  "On déroule la bobine…",
  "On ouvre la caisse…",
  "On vérifie les fauteuils…",
  "Bob cherche ses clés…"
];

let minuteurMessage = null;

/* Le voile est déjà dans le HTML : il apparaît sans attendre le JavaScript.
   Ici on ne fait que l'animer et le retirer. */
function demarreChargement(){
  const voile = document.getElementById("voileChargement");
  if(!voile) return;
  const texte = voile.querySelector(".vcTexte");
  if(!texte) return;

  let i = 0;
  texte.textContent = MESSAGES[0];
  minuteurMessage = setInterval(()=>{
    i = (i + 1) % MESSAGES.length;
    texte.style.opacity = "0";
    setTimeout(()=>{ texte.textContent = MESSAGES[i]; texte.style.opacity = "1"; }, 260);
  }, 1400);
}

/* Appelé quand la page est réellement prête à être vue. */
function finChargement(){
  clearInterval(minuteurMessage);
  const voile = document.getElementById("voileChargement");
  document.body.classList.add("pret");
  if(!voile) return;
  voile.classList.add("sorti");
  setTimeout(()=>voile.remove(), 480);
}

/* Filet de sécurité : si un chargement traîne ou échoue, on montre
   quand même la page au bout de six secondes plutôt que de laisser
   le joueur devant un voile immobile. */
function filetChargement(){
  setTimeout(()=>{ if(!document.body.classList.contains("pret")) finChargement(); }, 6000);
}

/* ---- exports ---- */
export {
  MESSAGES,
  demarreChargement,
  filetChargement,
  finChargement,
  minuteurMessage
};
