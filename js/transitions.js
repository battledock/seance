/* Transitions entre les pièces du bâtiment.
   Le clic sur un lien interne joue un fondu avant la navigation. */

const MOUVEMENT_REDUIT = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* arrivée dans la pièce */
export function entreeDePage(){
  if(MOUVEMENT_REDUIT) return;
  const c = document.querySelector(".contenu");
  if(c) c.classList.add("entreeLieu");
}

/* départ vers une autre pièce */
export function quitteLieu(href){
  if(MOUVEMENT_REDUIT){ location.href = href; return; }
  const v = document.createElement("div");
  v.className = "voileLieu";
  document.body.appendChild(v);
  requestAnimationFrame(()=>v.classList.add("ferme"));
  setTimeout(()=>{ location.href = href; }, 240);
}

/* interception des liens internes */
export function installeTransitions(){
  if(MOUVEMENT_REDUIT) return;
  document.addEventListener("click", (e)=>{
    const a = e.target.closest("a[href]");
    if(!a) return;
    const href = a.getAttribute("href");
    if(!href || href.startsWith("#") || href.startsWith("http") || a.target) return;
    if(e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    quitteLieu(href);
  }, true);
}
