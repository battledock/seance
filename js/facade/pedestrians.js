/* ============================================================
   LES PASSANTS — silhouettes articulées, trois plans

   Reprise complète du squelette. Auparavant une jambe était un
   rectangle qui pivotait depuis la hanche : le pied décrivait un
   arc et semblait patiner sur le trottoir. Ici chaque membre a
   ses articulations —  hanche, genou, cheville pour les jambes,
   épaule et coude pour les bras — et le bassin monte et descend
   deux fois par foulée, comme une vraie marche.

   Le repère : les pieds à y = 0, la tête vers y = -38.
   ============================================================ */
const SVG_NS2 = "http://www.w3.org/2000/svg";

const PLANS_R = [
  {id:"planLoin",   y:400, k:0.92, opac:.62, duree:[26,34], poids:.32, flou:true},
  {id:"planMilieu", y:428, k:1.24, opac:.86, duree:[20,27], poids:.34, flou:false},
  {id:"planProche", y:456, k:1.62, opac:1,   duree:[15,21], poids:.34, flou:false}
];

const TEINTES_R = {
  peau:["#f2cfa8","#e4b892","#cb9d72","#ac8156","#8d6242","#6d472c"],
  habit:["#8ca4c9","#a4c98c","#c98ca4","#c9c28c","#9a8cc9","#c9a48c","#7fb3a8",
         "#b06a6a","#5f6f9a","#c98f5a","#4a6b7a","#8a5a7a","#6a7f5a","#a86a8a"],
  bas:["#2a2030","#33283a","#3a2f26","#242a38","#2e2438","#1e2430","#42383a"],
  cheveux:["#2a1c14","#4a3527","#7a5a3a","#1c1410","#5c4030","#8a6a4a","#9a9a9a","#c8b088"],
  chaussure:["#161218","#241a18","#2e2420","#1a1a22"]
};
const pick2 = a => a[Math.floor(Math.random()*a.length)];

/* assombrit une couleur pour l'ombre propre du vêtement */
function ombre(hex, k = .78){
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 255) * k);
  const g = Math.round(((n >> 8) & 255) * k);
  const b = Math.round((n & 255) * k);
  return "#" + [r,g,b].map(v=>v.toString(16).padStart(2,"0")).join("");
}
function eclaire(hex, k = 1.16){
  const n = parseInt(hex.slice(1), 16);
  const c = v => Math.min(255, Math.round(v * k));
  return "#" + [c((n>>16)&255), c((n>>8)&255), c(n&255)]
    .map(v=>v.toString(16).padStart(2,"0")).join("");
}

function accessoire2(type, hab){
  switch(type){
    case "chapeau": return `<path d="M-6.6 -40.2 L6.6 -40.2 L7.8 -38.8 L-7.8 -38.8 Z" fill="#2a2030"/>
      <path d="M-4 -46 q4 -1.4 8 0 l0 6 l-8 0 Z" fill="#2a2030" transform="translate(-2 0)"/>
      <rect x="-4.2" y="-41.4" width="8.4" height="1.4" fill="#8a6c2a" opacity=".6"/>`;
    case "beret": return `<path d="M-4.6 -40.6 Q0 -46.4 4.6 -40.6 Q0 -38.4 -4.6 -40.6 Z" fill="#8c2331"/>
      <path d="M-4.6 -40.6 Q-2 -44.6 0 -45.4 Q-1.6 -42.2 -2.6 -39.8 Z" fill="#a83a48" opacity=".5"/>
      <circle cx="0" cy="-45.8" r="1" fill="#8c2331"/>`;
    case "bonnet": {
      const c = pick2(TEINTES_R.habit);
      return `<path d="M-4.3 -39.8 q0 -7 4.3 -7 q4.3 0 4.3 7 Z" fill="${c}"/>
      <rect x="-4.5" y="-40.6" width="9" height="2.4" rx="1.1" fill="${eclaire(c,1.12)}"/>
      <circle cx="0" cy="-47.4" r="1.3" fill="${eclaire(c,1.12)}"/>`;}
    case "sac": return `<path d="M4.4 -20 q3 -4.4 5.6 -.6 l.4 7 l-6 0 Z" fill="#6b4a2a"/>
      <path d="M4.9 -20 L10.1 -20 L10.1 -18.8 L4.9 -18.8 Z" fill="#4a3218"/>`;
    case "popcorn": return `<path d="M4.8 -19.4 L10 -19.4 L9.2 -12 L5.6 -12 Z" fill="#e8443a"/>
      <path d="M5.9 -19.4 L5.7 -12 M7.4 -19.4 L7.4 -12 M8.9 -19.4 L9 -12"
        stroke="#fdf3d2" stroke-width=".6"/>
      <g fill="#fdf3d2"><circle cx="6" cy="-20" r="1.3"/><circle cx="8.3" cy="-20.4" r="1.4"/>
        <circle cx="7.2" cy="-21.4" r="1.1"/><circle cx="9.4" cy="-19.8" r="1"/></g>`;
    case "echarpe": {
      const c = pick2(TEINTES_R.habit);
      return `<path d="M-4 -30.4 Q0 -27 4 -30.4 L4.6 -25.6 Q0 -22.8 -4.6 -25.6 Z" fill="${c}"/>
      <path d="M2.8 -26 l2.4 8 l-2.6 .6 l-1.8 -7.6 Z" fill="${ombre(c,.86)}" class="pan"/>`;}
    case "parapluie": return `<path d="M6 -41.4 L6 -18.6" stroke="#3a3a44" stroke-width=".9"/>
      <path d="M-1.4 -41.4 q7.4 -10.4 14.8 0 q-7.4 -3.8 -14.8 0" fill="#2e4a6b"/>
      <path d="M-1.4 -41.4 q3.7 -5.2 7.4 -5.2 l0 3.4 q-4 0 -7.4 1.8" fill="#3f5f80"/>
      <path d="M6 -18.6 q1.4 .6 1.6 -.9" stroke="#3a3a44" stroke-width=".9" fill="none"/>`;
    case "sacoche": return `<path d="M-8.6 -19.6 L-3 -19.6 L-3.8 -12.6 L-7.8 -12.6 Z" fill="#4a3a2a"/>
      <path d="M-8.6 -19.6 L-3 -19.6 L-3.2 -18.2 L-8.4 -18.2 Z" fill="#3a2c1e"/>
      <path d="M-7.6 -19.6 Q-5.6 -25.6 -3.6 -21.6" stroke="#4a3a2a" stroke-width=".8" fill="none"/>`;
    case "telephone": return `<rect x="4.2" y="-20.6" width="2.9" height="4.8" rx=".5" fill="#22262e"/>
      <rect x="4.5" y="-20.2" width="2.2" height="3.6" fill="#5a7a9a" opacity=".8"/>`;
    default: return "";
  }
}

const ACC_R = ["chapeau","beret","bonnet","sac","popcorn","echarpe","parapluie",
               "sacoche","telephone","","","","",""];


/* ------------------------------------------------------------
   L'ANIMATION DES ARTICULATIONS

   Une rotation CSS a besoin qu'on lui désigne son centre, et
   aucune des deux boîtes de référence disponibles ne tombe sur
   l'articulation : « view-box » vise le coin du dessin entier,
   « fill-box » le coin du tracé. Les membres partaient donc
   pivoter très loin de la hanche.

   animateTransform tourne, lui, autour du (0,0) du groupe —
   c'est-à-dire du point où le translate l'a posé. C'est
   précisément l'articulation.
   ------------------------------------------------------------ */
const CYCLE = {
  /* cuisse : plus d'amplitude, la jambe part franchement devant et derrière */
  cuisse: {t:"0;.25;.5;.62;.78;1",          v:"34;10;-28;-20;12;34"},
  /* genou : plié à la réception (appui) ET très plié au passage de la jambe libre.
     C'est la double flexion qui donne une vraie foulée. */
  genou:  {t:"0;.1;.28;.5;.58;.68;.82;.94;1", v:"-8;-20;-6;-12;-30;-62;-42;-14;-8"},
  /* pied : talon qui attaque, pied à plat, poussée sur la pointe */
  pied:   {t:"0;.1;.32;.5;.6;.72;.86;1",    v:"-16;4;6;20;24;-6;-14;-16"},
  /* épaule : vrai balancement, bien plus ample */
  epaule: {t:"0;.5;1",                      v:"-30;28;-30"},
  /* coude : le bras se plie davantage quand il passe derrière */
  coude:  {t:"0;.28;.5;.74;1",              v:"-10;-34;-8;-26;-10"}
};

function pivot(nom, duree, decalage){
  const c = CYCLE[nom];
  return `<animateTransform attributeName="transform" type="rotate"
    dur="${duree}s" repeatCount="indefinite" calcMode="spline"
    keyTimes="${c.t}" values="${c.v}"
    keySplines="${c.t.split(";").slice(1).map(()=>".42 0 .58 1").join(";")}"
    begin="${decalage}s" additive="sum"/>`;
}

/* ------------------------------------------------------------
   UNE JAMBE — hanche, genou, cheville
   Les groupes sont imbriqués et translatés : chaque articulation
   tourne autour de son propre point, jamais autour du bassin.
   ------------------------------------------------------------ */
function jambe(cote, bas, chauss, jupe, D, ph){
  const C = cote;              /* "A" (avant) ou "B" (arrière) */
  const dec = C === "A" ? ph : ph - D/2;   /* une demi-foulée d'écart */
  const teinteBas = C === "B" ? ombre(bas, .84) : bas;
  const teinteCh  = C === "B" ? ombre(chauss, .84) : chauss;
  return `<g transform="translate(${C === "A" ? -2.1 : 2.1} -17)">
    <g class="cuisse${C}">${pivot("cuisse", D, dec)}
      <path d="M-2.4 0 L2.4 0 L2.1 8.6 L-2.1 8.6 Z" fill="${teinteBas}"/>
      ${jupe ? "" : `<path d="M-2.4 0 L-.6 0 L-.8 8.6 L-2.1 8.6 Z" fill="#fff" opacity=".07"/>`}
      <g transform="translate(0 8.6)" class="genou${C}">${pivot("genou", D, dec)}
        <path d="M-2 0 L2 0 L1.7 7.4 L-1.7 7.4 Z" fill="${teinteBas}"/>
        <path d="M-2 0 L-.4 0 L-.6 7.4 L-1.7 7.4 Z" fill="#fff" opacity=".06"/>
        <g transform="translate(0 7.4)" class="pied${C}">${pivot("pied", D, dec)}
          <path d="M-1.9 0 L2 0 L3.5 1.6 L3.6 2.6 L-2.1 2.6 Z" fill="${teinteCh}"/>
          <path d="M-2.1 2.1 L3.6 2.1 L3.6 2.6 L-2.1 2.6 Z" fill="#000" opacity=".35"/>
        </g>
      </g>
    </g>
  </g>`;
}

/* ------------------------------------------------------------
   UN BRAS — épaule, coude
   ------------------------------------------------------------ */
function bras(cote, hab, peau, manteau, D, ph){
  const C = cote;
  const dec = C === "A" ? ph - D/2 : ph;
  const teinte = C === "A" ? ombre(hab, .68) : eclaire(hab, 1.06);
  const teintePeau = C === "A" ? ombre(peau, .82) : peau;
  return `<g transform="translate(${C === "A" ? -4.5 : 4.5} -28.6)">
    <g class="epaule${C}">${pivot("epaule", D, dec)}
      <path d="M-1.8 0 L1.8 0 L1.6 7.8 L-1.6 7.8 Z" fill="${teinte}"/>
      ${manteau ? "" : `<path d="M-1.8 0 L-.5 0 L-.6 7.8 L-1.6 7.8 Z" fill="#fff" opacity=".09"/>`}
      <g transform="translate(0 7.8)" class="coude${C}">${pivot("coude", D, dec)}
        <path d="M-1.6 0 L1.6 0 L1.4 6.8 L-1.4 6.8 Z" fill="${teinte}"/>
        <circle cx="0" cy="8" r="1.6" fill="${teintePeau}"/>
        <path d="M-1.6 6.8 L1.6 6.8 L1.4 7.4 L-1.4 7.4 Z" fill="${ombre(teinte,.72)}"/>
      </g>
    </g>
  </g>`;
}

/* ------------------------------------------------------------
   LA SILHOUETTE COMPLÈTE
   ------------------------------------------------------------ */
function silhouette2(D = 1, ph = 0){
  const peau = pick2(TEINTES_R.peau), hab = pick2(TEINTES_R.habit),
        bas = pick2(TEINTES_R.bas), chev = pick2(TEINTES_R.cheveux),
        chauss = pick2(TEINTES_R.chaussure);
  const acc = pick2(ACC_R);
  const jupe = Math.random() < .3;
  const manteau = Math.random() < .28;
  const cheveuxLongs = Math.random() < .38;
  const corpulence = .9 + Math.random()*.26;
  const stature = .93 + Math.random()*.2;
  const habClair = eclaire(hab, 1.14);
  const habOmbre = ombre(hab, .8);

  return `<g transform="scale(${corpulence.toFixed(2)} ${stature.toFixed(2)})">
    <!-- jambe arrière d'abord : elle passe derrière le torse -->
    ${jambe("B", bas, chauss, jupe, D, ph)}
    <!-- bras arrière -->
    ${bras("A", hab, peau, manteau, D, ph)}
    <!-- jambe avant -->
    ${jambe("A", bas, chauss, jupe, D, ph)}

    <g class="corps">
      <animateTransform attributeName="transform" type="translate"
        dur="${(D/2).toFixed(2)}s" repeatCount="indefinite" calcMode="spline"
        keyTimes="0;.5;1" values="0 .7;0 -.9;0 .7"
        keySplines=".42 0 .58 1;.42 0 .58 1" begin="${ph.toFixed(2)}s" additive="sum"/>
      <animateTransform attributeName="transform" type="rotate"
        dur="${D.toFixed(2)}s" repeatCount="indefinite" calcMode="spline"
        keyTimes="0;.25;.5;.75;1" values="-2.5;0;2.5;0;-2.5"
        keySplines=".42 0 .58 1;.42 0 .58 1;.42 0 .58 1;.42 0 .58 1"
        begin="${ph.toFixed(2)}s" additive="sum"/>
      ${jupe ? `<path d="M-5.4 -19.4 L5.4 -19.4 L7 -9 L-7 -9 Z" fill="${hab}"/>
        <path d="M-5.4 -19.4 L5.4 -19.4 L5.8 -16 L-5.8 -16 Z" fill="${habOmbre}" opacity=".45"/>
        <path d="M-1.4 -19.4 L-2.6 -9 L-4.4 -9 L-2.8 -19.4 Z" fill="#fff" opacity=".06"/>` : ""}

      <!-- torse : épaules marquées, taille resserrée -->
      <path d="M-4.8 -30.2 Q0 -32.2 4.8 -30.2 L5.4 -22 L4.8 -13.2 L-4.8 -13.2 L-5.4 -22 Z"
        fill="${hab}"/>
      ${manteau ? `<path d="M-5.5 -30.2 Q0 -32.2 5.5 -30.2 L6.4 -9.4 L-6.4 -9.4 Z"
          fill="${hab}" class="pan"/>
        <path d="M0 -31.2 L0 -9.4" stroke="${habOmbre}" stroke-width=".9" opacity=".7"/>
        <path d="M-5.5 -30.2 Q-2.8 -31.4 0 -31.4 L0 -9.4 L-6.4 -9.4 Z" fill="#fff" opacity=".055"/>
        <path d="M-2.5 -29.6 L0 -24.4 L-1.6 -23.6 L-4 -28.4 Z" fill="${habOmbre}" opacity=".6"/>
        <path d="M2.5 -29.6 L0 -24.4 L1.6 -23.6 L4 -28.4 Z" fill="${habOmbre}" opacity=".6"/>`
      : `<path d="M-4.8 -30.2 Q0 -32.2 4.8 -30.2 L5.1 -25.4 L-5.1 -25.4 Z" fill="${habOmbre}" opacity=".42"/>
         <path d="M-4.8 -30.2 Q-2.4 -31.4 0 -31.4 L0 -13.2 L-4.8 -13.2 Z" fill="#fff" opacity=".06"/>
         <path d="M3.7 -29.6 L4.8 -13.2 L3.7 -13.2 L2.8 -29.2 Z" fill="${habOmbre}" opacity=".4"/>`}

      <!-- ceinture -->
      ${jupe ? "" : `<path d="M-5.4 -14.4 L5.4 -14.4 L5.4 -12.8 L-5.4 -12.8 Z" fill="${ombre(bas,.7)}"/>`}

      <!-- cou -->
      <path d="M-1.5 -33.4 L1.5 -33.4 L1.5 -29.8 L-1.5 -29.8 Z" fill="${peau}"/>
      <path d="M-1.5 -33.4 L1.5 -33.4 L1.5 -31.6 L-1.5 -31.6 Z" fill="${ombre(peau,.76)}"/>

      <g class="tete">
        <animateTransform attributeName="transform" type="translate"
          dur="${(D/2).toFixed(2)}s" repeatCount="indefinite" calcMode="spline"
          keyTimes="0;.5;1" values="0 -.2;0 .28;0 -.2"
          keySplines=".42 0 .58 1;.42 0 .58 1" begin="${ph.toFixed(2)}s"/>
        <!-- crâne -->
        <ellipse cx="0" cy="-36.6" rx="3.7" ry="4.1" fill="${peau}"/>
        <!-- volume : joue à l'ombre -->
        <path d="M1.2 -39.9 q2.5 1.9 2.5 3.4 q0 2.2 -2 3.6 q1.3 -3.4 -.5 -7 Z"
          fill="${ombre(peau,.86)}"/>
        <!-- oreille -->
        <ellipse cx="-3.5" cy="-36.2" rx=".95" ry="1.3" fill="${ombre(peau,.9)}"/>
        <!-- l'œil : un point, visible seulement de près -->
        <circle cx="1.6" cy="-36.9" r=".52" fill="#2a1c14" opacity=".72"/>
        ${cheveuxLongs
          ? `<path d="M-3.9 -37.6 Q0 -42.6 3.9 -37.6 L4.1 -30.6 Q2.9 -28.8 2.2 -31
               L2 -36.8 Q0 -39.1 -2 -36.8 L-2.2 -31 Q-2.9 -28.8 -4.1 -30.6 Z" fill="${chev}"/>
             <path d="M-3.9 -37.6 Q-1.7 -41.4 0 -42 Q-1.9 -39.2 -2.8 -36.6 Z"
               fill="${eclaire(chev,1.22)}" opacity=".5"/>`
          : `<path d="M-3.8 -37.4 Q0 -42.4 3.8 -37.4 Q2.2 -39.2 0 -39.2 Q-2.2 -39.2 -3.8 -37.4 Z"
               fill="${chev}"/>
             <path d="M-3.8 -37.4 Q-4.7 -34 -3.1 -32.8 L-2.8 -36.4 Z" fill="${chev}"/>
             <path d="M-3.1 -39 Q-.9 -41 1.2 -40.1 Q-.9 -39.9 -2.4 -38.3 Z"
               fill="${eclaire(chev,1.25)}" opacity=".45"/>`}
        ${accessoire2(acc, hab)}
      </g>
    </g>

    <!-- bras avant : il passe devant le torse -->
    ${bras("B", hab, peau, manteau, D, ph)}
  </g>`;
}

function spawnPassant(mouille){
  const r = Math.random(); let acc = 0, plan = PLANS_R[0];
  for(const p of PLANS_R){ acc += p.poids; if(r <= acc){ plan = p; break; } }

  const versDroite = Math.random() < .5;
  const entre = Math.random() < .28 && plan.id !== "planLoin";


  const x0 = versDroite ? -50 : 530;
  const x1 = entre ? 240 : (versDroite ? 530 : -50);
  const g = document.createElementNS(SVG_NS2, "g");
  const duree = plan.duree[0] + Math.random()*(plan.duree[1]-plan.duree[0]);

  /* ------------------------------------------------------------
     ACCORDER LE PAS AU DÉPLACEMENT

     Le pied ne doit pas glisser sur le trottoir. On mesure donc
     le chemin parcouru, on le divise par la longueur d'une
     foulée — ce que les jambes couvrent réellement, environ
     douze unités à l'échelle du personnage — et on en déduit
     combien de temps dure chaque foulée.

     Sans ce calcul, les jambes battaient à un rythme arbitraire
     pendant que le corps filait : les passants dansaient sur
     place au lieu de marcher.
     ------------------------------------------------------------ */
  const FOULEE = 12.4;                       /* unités couvertes par cycle */
  const trajet = Math.abs(x1 - x0);
  const foulees = Math.max(1, trajet / (FOULEE * plan.k));
  const corpulence = 0.94 + Math.random()*0.12;   /* petite variation de pas */
  const cadence = Number((duree / foulees * corpulence).toFixed(3));
  const phase = Number((-Math.random() * cadence).toFixed(3));
  const s = silhouette2(cadence, phase);

  g.setAttribute("class", "passantR" + (plan.flou ? " lointain" : ""));
  g.setAttribute("opacity", plan.opac);
  g.style.cssText = `--x0:${x0}px;--x1:${x1}px;--cad:${cadence}s;`
    + `--ph:${phase}s;animation-duration:${duree}s`;
  g.innerHTML = `
    <g transform="translate(0 ${plan.y}) scale(${(plan.k*(versDroite?1:-1)).toFixed(3)} ${plan.k})">
      <ellipse class="ombreSol" cx="0" cy="0.6" rx="6.4" ry="1.7" fill="#000" opacity=".32"/>
      ${mouille ? `<g transform="scale(1 -0.5) translate(0 -1.6)" opacity=".14">${s}</g>` : ""}
      ${s}
    </g>`;
  const cible = document.getElementById(plan.id);
  if(!cible) return;
  cible.appendChild(g);

  /* Celui qui entre disparaît vite et en s'enfonçant légèrement,
     comme s'il passait la porte. L'ancien fondu d'une demi-seconde
     le laissait flotter en transparence devant la façade. */
  setTimeout(()=>{
    if(entre){
      g.style.transition = "opacity .22s ease-in";
      g.style.opacity = "0";
      const interne = g.firstElementChild;
      if(interne) interne.style.transition = "transform .22s ease-in";
    }
    setTimeout(()=>g.remove(), entre ? 260 : 400);
  }, duree*1000 - (entre ? 240 : 300));
}

/* ---- exports ---- */
export {
  ACC_R,
  CYCLE,
  PLANS_R,
  SVG_NS2,
  TEINTES_R,
  accessoire2,
  bras,
  eclaire,
  jambe,
  ombre,
  pick2,
  pivot,
  silhouette2,
  spawnPassant
};



