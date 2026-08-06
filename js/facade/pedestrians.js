/* ============================================================
   LES PASSANTS — silhouettes articulées, trois plans
   Proportions retravaillées, ombres au sol, reflet si mouillé.
   ============================================================ */
const SVG_NS2 = "http://www.w3.org/2000/svg";

const PLANS_R = [
  {id:"planLoin",   y:400, k:0.92, opac:.62, duree:[19,25], poids:.32, flou:true},
  {id:"planMilieu", y:428, k:1.24, opac:.86, duree:[14,19], poids:.34, flou:false},
  {id:"planProche", y:456, k:1.62, opac:1,   duree:[10,14], poids:.34, flou:false}
];

const TEINTES_R = {
  peau:["#f2cfa8","#e4b892","#cb9d72","#ac8156","#8d6242","#6d472c"],
  habit:["#8ca4c9","#a4c98c","#c98ca4","#c9c28c","#9a8cc9","#c9a48c","#7fb3a8",
         "#b06a6a","#5f6f9a","#c98f5a","#4a6b7a","#8a5a7a"],
  bas:["#2a2030","#33283a","#3a2f26","#242a38","#2e2438","#1e2430"],
  cheveux:["#2a1c14","#4a3527","#7a5a3a","#1c1410","#5c4030","#8a6a4a","#9a9a9a"]
};
const pick2 = a => a[Math.floor(Math.random()*a.length)];

function accessoire2(type, hab){
  switch(type){
    case "chapeau": return `<path d="M-6.5 -33 L6.5 -33 L8 -31.4 L-8 -31.4 Z" fill="#2a2030"/>
      <rect x="-4.8" y="-38.5" width="9.6" height="5.8" rx="1.6" fill="#2a2030"/>
      <rect x="-4.8" y="-34.6" width="9.6" height="1.6" fill="#8a6c2a" opacity=".6"/>`;
    case "beret": return `<path d="M-6.4 -34 Q0 -40.5 6.4 -34 Q0 -31.8 -6.4 -34 Z" fill="#8c2331"/>
      <circle cx="0" cy="-40" r="1.2" fill="#8c2331"/>`;
    case "sac": return `<rect x="5.2" y="-21" width="6" height="7.6" rx="1.3" fill="#6b4a2a"/>
      <path d="M6.2 -21 Q8.2 -25.4 10.2 -21" stroke="#6b4a2a" stroke-width="1.1" fill="none"/>`;
    case "popcorn": return `<path d="M5.6 -20.4 L11 -20.4 L10.2 -12.6 L6.4 -12.6 Z" fill="#e8443a"/>
      <path d="M6.6 -20.4 L6.4 -12.6 M8.4 -20.4 L8.4 -12.6" stroke="#fdf3d2" stroke-width=".7"/>
      <g fill="#fdf3d2"><circle cx="6.9" cy="-21" r="1.5"/><circle cx="9.2" cy="-21.5" r="1.6"/>
        <circle cx="8.1" cy="-22.6" r="1.3"/></g>`;
    case "echarpe": return `<path d="M-4.2 -27.5 Q0 -24.2 4.2 -27.5 L4.8 -23 Q0 -20.2 -4.8 -23 Z"
      fill="${pick2(TEINTES_R.habit)}"/>`;
    case "parapluie": return `<path d="M6 -30 L6 -8" stroke="#3a3a44" stroke-width="1"/>
      <path d="M-2 -30 q8 -11 16 0 q-8 -4 -16 0" fill="#2e4a6b"/>`;
    case "sacoche": return `<path d="M-9 -20 L-3 -20 L-3.8 -13 L-8.2 -13 Z" fill="#4a3a2a"/>
      <path d="M-8 -20 Q-6 -26 -4 -22" stroke="#4a3a2a" stroke-width="1" fill="none"/>`;
    default: return "";
  }
}
const ACC_R = ["chapeau","beret","sac","popcorn","echarpe","parapluie","sacoche","","","",""];

/* silhouette : proportions 7 têtes, épaules marquées, mains visibles */
function silhouette2(){
  const peau = pick2(TEINTES_R.peau), hab = pick2(TEINTES_R.habit),
        bas = pick2(TEINTES_R.bas), chev = pick2(TEINTES_R.cheveux);
  const acc = pick2(ACC_R);
  const jupe = Math.random() < .34;
  const manteau = Math.random() < .3;
  const corpulence = .9 + Math.random()*.26;
  const stature = .93 + Math.random()*.2;

  return `<g transform="scale(${corpulence.toFixed(2)} ${stature.toFixed(2)})">
    <!-- jambes -->
    <g class="jambeA">
      <path d="M-3.9 -11.5 L-0.7 -11.5 L-0.4 -1 L-3.6 -1 Z" fill="${bas}"/>
      <path d="M-4.4 -1.4 L0.4 -1.4 L0.6 .6 L-4.8 .6 Z" fill="#161218"/>
    </g>
    <g class="jambeB">
      <path d="M0.7 -11.5 L3.9 -11.5 L3.6 -1 L0.4 -1 Z" fill="${bas}"/>
      <path d="M0.2 -1.4 L5 -1.4 L5.2 .6 L-0.2 .6 Z" fill="#161218"/>
    </g>
    <g class="corps">
      ${jupe ? `<path d="M-6.2 -17 L6.2 -17 L7.8 -8.6 L-7.8 -8.6 Z" fill="${hab}"/>
        <path d="M-6.2 -17 L6.2 -17 L6.6 -14 L-6.6 -14 Z" fill="#000" opacity=".1"/>` : ""}
      <!-- bras arrière -->
      <g class="brasA">
        <path d="M-6.6 -25.6 L-4 -25.6 L-3.4 -15 L-6 -15 Z" fill="${hab}" opacity=".78"/>
        <circle cx="-4.8" cy="-14.4" r="1.5" fill="${peau}" opacity=".78"/>
      </g>
      <!-- torse -->
      <path d="M-5.4 -27.4 Q0 -29.2 5.4 -27.4 L6.4 -11.4 L-6.4 -11.4 Z" fill="${hab}"/>
      ${manteau ? `<path d="M-5.4 -27.4 Q0 -29.2 5.4 -27.4 L6.6 -9 L-6.6 -9 Z"
        fill="${hab}" opacity=".9"/>
        <path d="M0 -28.4 L0 -9" stroke="#000" stroke-opacity=".18" stroke-width=".9"/>` : ""}
      <path d="M-5.4 -27.4 Q0 -29.2 5.4 -27.4 L5.7 -22.6 L-5.7 -22.6 Z" fill="#000" opacity=".13"/>
      <path d="M-5.4 -27.4 Q-2.6 -28.6 0 -28.6 L0 -11.4 L-6.4 -11.4 Z" fill="#fff" opacity=".05"/>
      <!-- cou et tête -->
      <path d="M-1.5 -30.8 L1.5 -30.8 L1.5 -27.2 L-1.5 -27.2 Z" fill="${peau}"/>
      <path d="M-1.5 -30.8 L1.5 -30.8 L1.5 -29.4 L-1.5 -29.4 Z" fill="#000" opacity=".14"/>
      <ellipse cx="0" cy="-33.6" rx="4.3" ry="4.7" fill="${peau}"/>
      <path d="M-4.3 -34.6 Q0 -40 4.3 -34.6 Q2.6 -36.4 0 -36.4 Q-2.6 -36.4 -4.3 -34.6 Z"
        fill="${chev}"/>
      <path d="M-4.3 -34.6 Q-5.2 -31 -3.6 -29.6 L-3.2 -33.4 Z" fill="${chev}"/>
      ${accessoire2(acc, hab)}
      <!-- bras avant -->
      <g class="brasB">
        <path d="M3.8 -25.6 L6.6 -25.6 L7 -14.6 L4.2 -14.6 Z" fill="${hab}"/>
        <circle cx="5.6" cy="-13.8" r="1.7" fill="${peau}"/>
      </g>
    </g>
  </g>`;
}

function spawnPassant(mouille){
  const r = Math.random(); let acc = 0, plan = PLANS_R[0];
  for(const p of PLANS_R){ acc += p.poids; if(r <= acc){ plan = p; break; } }

  const versDroite = Math.random() < .5;
  const entre = Math.random() < .28 && plan.id !== "planLoin";
  const s = silhouette2();

  const g = document.createElementNS(SVG_NS2, "g");
  const x0 = versDroite ? -50 : 530;
  const x1 = entre ? 240 : (versDroite ? 530 : -50);
  const duree = plan.duree[0] + Math.random()*(plan.duree[1]-plan.duree[0]);
  const cadence = (0.60 * (duree/14) / plan.k).toFixed(2);

  g.setAttribute("class", "passantR" + (plan.flou ? " lointain" : ""));
  g.setAttribute("opacity", plan.opac);
  g.style.cssText = `--x0:${x0}px;--x1:${x1}px;--cad:${cadence}s;animation-duration:${duree}s`;
  g.innerHTML = `
    <g transform="translate(0 ${plan.y}) scale(${(plan.k*(versDroite?1:-1)).toFixed(3)} ${plan.k})">
      <ellipse cx="0" cy="0.8" rx="7" ry="1.9" fill="#000" opacity=".3"/>
      ${mouille ? `<g transform="scale(1 -0.55) translate(0 -2)" opacity=".16">${s}</g>` : ""}
      ${s}
    </g>`;
  const cible = document.getElementById(plan.id);
  if(!cible) return;
  cible.appendChild(g);

  setTimeout(()=>{
    if(entre){ g.style.transition = "opacity .6s"; g.style.opacity = "0"; }
    setTimeout(()=>g.remove(), 900);
  }, duree*1000 - 300);
}

/* ---- exports ---- */
export {
  ACC_R,
  PLANS_R,
  SVG_NS2,
  TEINTES_R,
  accessoire2,
  pick2,
  silhouette2,
  spawnPassant
};
