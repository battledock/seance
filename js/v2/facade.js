/* ============================================================
   LA FAÇADE

   L'accueil du jeu. On reprend le moteur de rendu existant — il
   sait dessiner huit âges de bâtiment, un ciel qui suit l'heure
   et des passants articulés — et on le branche sur le nouveau
   modèle : les étoiles décident de l'âge, les affiches montrent
   ce qui est programmé.
   ============================================================ */

import { dessineFacadeEvolutive } from "../facade/render.js?v=becf21cb";
import { silhouette2 } from "../facade/pedestrians.js?v=becf21cb";

/* Les étoiles vont de 0,5 à 5 ; le moteur attend un niveau de 1
   à 35 réparti sur huit âges. Un cinéma à une étoile est le
   bouge du début, à cinq c'est le palace. */
function niveauSelonEtoiles(etoiles){
  return Math.max(1, Math.round(1 + (Number(etoiles) || 1) / 5 * 34));
}

function phaseSelonHeure(){
  const h = new Date().getHours();
  if(h >= 6  && h < 11) return "matin";
  if(h >= 11 && h < 18) return "aprem";
  if(h >= 18 && h < 21) return "crepuscule";
  return "nuit";
}

/* ---------- les passants ---------- */
const PLANS = [
  {id:"planLoin",   y:400, k:0.92, duree:[26,34], poids:.32},
  {id:"planMilieu", y:428, k:1.24, duree:[20,27], poids:.34},
  {id:"planProche", y:456, k:1.62, duree:[15,21], poids:.34}
];
let minuteurPassants = null;

function unPassant(svg, avance){
  const NS = "http://www.w3.org/2000/svg";
  const r = Math.random(); let a = 0, plan = PLANS[0];
  for(const p of PLANS){ a += p.poids; if(r <= a){ plan = p; break; } }

  const vd = Math.random() < .5;
  const x0 = vd ? -50 : 530, x1 = vd ? 530 : -50;
  const duree = plan.duree[0] + Math.random() * (plan.duree[1] - plan.duree[0]);
  /* la foulée mesure 16,8 unités : en dessous, les pieds patinent */
  const foulees = Math.max(1, Math.abs(x1 - x0) / (16.8 * plan.k));
  const cad = +(duree / foulees * (0.94 + Math.random() * 0.12)).toFixed(3);
  const ph  = +(-Math.random() * cad).toFixed(3);

  const g = document.createElementNS(NS, "g");
  g.setAttribute("class", "passant");
  g.style.cssText = `--x0:${x0}px;--x1:${x1}px;--cad:${cad}s;--ph:${ph}s;`
    + `animation-duration:${duree}s;animation-delay:${(-avance * duree).toFixed(1)}s`;
  g.innerHTML = `<g transform="translate(0 ${plan.y}) scale(${(plan.k * (vd ? 1 : -1)).toFixed(3)} ${plan.k})">
    <ellipse cx="0" cy="0.6" rx="6" ry="1.6" fill="#000" opacity=".3"/>
    ${silhouette2(cad, ph)}</g>`;

  /* Le moteur prévoit trois groupes de profondeur, à l'intérieur
     du décor déjà décalé. Insérés à la racine, les passants
     marchent sur l'auvent. */
  const cible = svg.querySelector("#" + plan.id) || svg;
  cible.appendChild(g);
  setTimeout(() => g.remove(), (1 - avance) * duree * 1000);
}

function peupleLaRue(svg){
  clearInterval(minuteurPassants);
  if(!svg) return;
  for(let i = 0; i < 5; i++) unPassant(svg, Math.random());
  minuteurPassants = setInterval(() => {
    if(document.hidden) return;
    unPassant(svg, 0);
  }, 3400);
}

/* ---------- le rendu ---------- */
function rendFacade(cible, etat, seancesAffiche){
  if(!cible || !etat) return;
  const c = etat.cinema;
  const ratio = cible.clientWidth / Math.max(1, cible.clientHeight);

  cible.innerHTML = dessineFacadeEvolutive({
    phase: phaseSelonHeure(),
    niveau: niveauSelonEtoiles(c.etoiles),
    nom: c.nom,
    logo: "★",
    seances: (seancesAffiche || []).slice(0, 3).map(s => ({
      heure: String(s.heure || "").toUpperCase(),
      titre: s.titre,
      genre: s.genre || "défaut"
    })),
    ratio
  });
  peupleLaRue(cible.querySelector("svg"));
}

/* Redessiner à chaque pixel de redimensionnement coûterait cher.
   Sur mobile, la barre d'adresse qui se rétracte change la
   hauteur en permanence : on ne réagit qu'aux vrais changements. */
function surveilleTaille(cible, refaire){
  let dernier = 0;
  addEventListener("resize", () => {
    const r = cible.clientWidth / Math.max(1, cible.clientHeight);
    if(Math.abs(r - dernier) < 0.05) return;
    dernier = r;
    refaire();
  }, {passive:true});
}

export { rendFacade, surveilleTaille, phaseSelonHeure, niveauSelonEtoiles };
