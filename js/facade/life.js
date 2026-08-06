import { ANIMATIONS_LEGERES, quitteLieu } from "../ambiance.js?v=2ab9afab";
import { Etat } from "../game-state.js?v=2ab9afab";
import { confirmeOuverture, parleBob, phaseSelonHeure } from "../cinema.js?v=2ab9afab";

/* ============================================================
   LA VIE DU CINÉMA
   Une couche posée sur la façade : météo, portes, véhicules,
   oiseaux, fumée, néon — et des zones tactiles pour que le
   bâtiment réponde quand on le touche.
   Tout est en transform et opacity. Rien ne tourne hors écran.
   ============================================================ */

const SVG_NS = "http://www.w3.org/2000/svg";
let minuteurs = [];
let vieActive = false;

/* le décor est modeste sur un appareil modeste.
   Fonction et non constante : la valeur n'est lue qu'à l'usage. */
function densite(){ return ANIMATIONS_LEGERES ? 0.35 : 1; }

function planifie(fn, delai){
  const id = setTimeout(()=>{
    if(!document.hidden) fn();
    minuteurs = minuteurs.filter(m=>m !== id);
  }, delai);
  minuteurs.push(id);
  return id;
}
function arreteLaVie(){ minuteurs.forEach(clearTimeout); minuteurs = []; }

/* ============================================================
   MÉTÉO — déterministe par jour de jeu, elle change le décor
   et donne à Bob quelque chose à dire.
   ============================================================ */
const METEOS = {
  clair:  {nom:"Beau temps",  bob:"Grand ciel dégagé. Les gens traînent dehors, mais ils finissent par avoir soif de pénombre."},
  nuages: {nom:"Nuageux",     bob:"Ciel bouché. C'est exactement le temps qui remplit les salles."},
  pluie:  {nom:"Pluie",       bob:"Il pleut. Notre meilleur agent commercial, et il ne demande rien."},
  brume:  {nom:"Brume",       bob:"Une brume à couper au couteau. L'enseigne a un halo, c'est presque du cinéma."},
  vent:   {nom:"Vent",        bob:"Le vent claque dans l'auvent. Ne t'inquiète pas, il tient depuis 1953."}
};
function meteoDuJour(){
  const graine = (Number(Etat.cinema?.jour) || 1) * 2654435761 % 100;
  if(graine < 46) return "clair";
  if(graine < 68) return "nuages";
  if(graine < 84) return "pluie";
  if(graine < 93) return "brume";
  return "vent";
}

function poseMeteo(svg, meteo){
  const g = document.createElementNS(SVG_NS, "g");
  g.setAttribute("class", "coucheMeteo");
  g.setAttribute("pointer-events", "none");

  if(meteo === "pluie"){
    const n = Math.round(26 * densite());
    g.innerHTML = `<g class="pluie">${[...Array(n)].map(()=>{
      const x = Math.random()*520 - 20, d = (0.55 + Math.random()*0.5).toFixed(2);
      const r = (-Math.random()*1.4).toFixed(2), l = 9 + Math.random()*9;
      return `<line x1="${x.toFixed(0)}" y1="-20" x2="${(x-8).toFixed(0)}" y2="${(-20+l).toFixed(0)}"
        stroke="#bcd4e8" stroke-width="1.1" stroke-linecap="round" opacity=".45"
        style="animation-duration:${d}s;animation-delay:${r}s"/>`;
    }).join("")}</g>
    <g class="flaques" opacity=".28">
      <ellipse cx="130" cy="440" rx="46" ry="5" fill="#8fb6d8"/>
      <ellipse cx="342" cy="448" rx="38" ry="4" fill="#8fb6d8"/>
      <ellipse cx="240" cy="486" rx="60" ry="6" fill="#8fb6d8" opacity=".7"/>
    </g>`;
  }
  else if(meteo === "brume"){
    g.innerHTML = `<g class="brume">
      <ellipse cx="140" cy="360" rx="230" ry="58" fill="#c8d6e0" opacity=".13" class="nappeA"/>
      <ellipse cx="350" cy="410" rx="260" ry="52" fill="#c8d6e0" opacity=".11" class="nappeB"/>
    </g>`;
  }
  else if(meteo === "vent"){
    const n = Math.round(7 * densite());
    g.innerHTML = `<g class="feuilles">${[...Array(n)].map((_,i)=>{
      const y = 340 + Math.random()*130, d = 6 + Math.random()*5;
      return `<path d="M0 0 q4 -3 7 0 q-3 4 -7 0Z" fill="#8c6a3a" opacity=".65"
        style="--yv:${y.toFixed(0)}px;animation-duration:${d.toFixed(1)}s;animation-delay:${(-i*1.3).toFixed(1)}s"/>`;
    }).join("")}</g>`;
  }
  if(g.innerHTML) svg.appendChild(g);
}

/* ============================================================
   PORTES — elles s'ouvrent vraiment quand quelqu'un entre
   ============================================================ */
function preparePortes(svg){
  const portes = svg.querySelectorAll('rect[x="184"][y="300"], rect[x="242"][y="300"]');
  if(portes.length < 2) return null;
  portes[0].classList.add("porteG");
  portes[1].classList.add("porteD");
  const lueur = document.createElementNS(SVG_NS, "rect");
  lueur.setAttribute("x","186"); lueur.setAttribute("y","302");
  lueur.setAttribute("width","108"); lueur.setAttribute("height","80");
  lueur.setAttribute("fill","#ffdf9a"); lueur.setAttribute("class","lueurSeuil");
  lueur.setAttribute("pointer-events","none");
  portes[0].parentNode.insertBefore(lueur, portes[0]);
  return {g:portes[0], d:portes[1], lueur};
}
let refPortes = null;
function ouvreLesPortes(){
  if(!refPortes || ANIMATIONS_LEGERES) return;
  refPortes.g.classList.add("battante");
  refPortes.lueur.classList.add("visible");
  /* le second battant suit de peu : deux personnes ne poussent jamais ensemble */
  planifie(()=>refPortes.d.classList.add("battante"), 110);
  planifie(()=>{
    refPortes.g.classList.remove("battante");
    refPortes.lueur.classList.remove("visible");
  }, 1500);
  planifie(()=>refPortes.d.classList.remove("battante"), 1640);
}

/* ============================================================
   PASSAGES RARES — une voiture, des oiseaux, de la fumée
   ============================================================ */
function voiture(svg){
  const nuit = ["nuit","aube","crepuscule"].includes(phaseSelonHeure());
  const versDroite = Math.random() < .5;
  const teintes = ["#7c2b2b","#2b4a7c","#3a3a3a","#6b6b5a","#2b6b52"];
  const c = teintes[Math.floor(Math.random()*teintes.length)];
  const g = document.createElementNS(SVG_NS,"g");
  g.setAttribute("class","voiturePasse");
  g.style.cssText = `--x0:${versDroite?-140:620}px;--x1:${versDroite?620:-140}px;animation-duration:${(5+Math.random()*3).toFixed(1)}s`;
  g.innerHTML = `<g transform="translate(0 480) scale(${versDroite?1.2:-1.2} 1.2)">
    <ellipse cx="34" cy="15" rx="40" ry="4" fill="#000" opacity=".3"/>
    <path d="M4 12 L14 12 L22 2 L48 2 L56 12 L66 12 L66 20 L4 20 Z" fill="${c}"/>
    <path d="M24 4 L46 4 L52 11 L20 11 Z" fill="#9fc4d8" opacity=".55"/>
    <circle cx="18" cy="20" r="5" fill="#1a1a1a"/><circle cx="54" cy="20" r="5" fill="#1a1a1a"/>
    ${nuit ? `<ellipse cx="72" cy="14" rx="16" ry="5" fill="#ffe9b0" opacity=".45"/>
      <circle cx="65" cy="14" r="2.4" fill="#fff6d8"/>` : ""}
  </g>`;
  svg.appendChild(g);
  planifie(()=>g.remove(), 9000);
}

function oiseaux(svg){
  const n = 3 + Math.floor(Math.random()*3);
  const g = document.createElementNS(SVG_NS,"g");
  g.setAttribute("class","volOiseaux");
  g.setAttribute("pointer-events","none");
  g.innerHTML = [...Array(n)].map((_,i)=>{
    const y = 40 + Math.random()*60, dx = i*16, d = (-i*0.22).toFixed(2);
    return `<path d="M0 0 q4 -4 8 0 q4 -4 8 0" stroke="#2a2a2a" stroke-width="1.6"
      fill="none" opacity=".55" transform="translate(${dx} ${y.toFixed(0)})"
      style="animation-delay:${d}s"/>`;
  }).join("");
  g.style.animationDuration = (11 + Math.random()*4).toFixed(1) + "s";
  svg.appendChild(g);
  planifie(()=>g.remove(), 17000);
}

function fumee(svg){
  if(ANIMATIONS_LEGERES) return;
  const g = document.createElementNS(SVG_NS,"g");
  g.setAttribute("class","fumeeCheminee");
  g.setAttribute("pointer-events","none");
  g.innerHTML = [...Array(4)].map((_,i)=>
    `<circle cx="372" cy="140" r="${5+i*2}" fill="#d8d2c8" opacity=".16"
      style="animation-delay:${(i*2.2).toFixed(1)}s"/>`).join("");
  svg.appendChild(g);
}

/* ============================================================
   ENSEIGNE — respiration et rare grésillement
   ============================================================ */
function animeEnseigne(svg){
  const t = svg.querySelector('text[y="186"]');
  if(!t) return;
  t.classList.add("enseigneVivante");
  const gresille = ()=>{
    if(!document.hidden && Math.random() < .5){
      t.classList.add("gresille");
      planifie(()=>t.classList.remove("gresille"), 700);
    }
    planifie(gresille, 12000 + Math.random()*22000);
  };
  planifie(gresille, 8000 + Math.random()*12000);
}

/* ============================================================
   ZONES TACTILES — le bâtiment répond quand on le touche
   ============================================================ */
const ZONES = [
  {x:100, y:292, w:70, h:100, cle:"affiche", nom:"Affiche de gauche",
   url:"programmation.html",
   bob:["Cette affiche, c'est moi qui l'ai collée. De travers, mais avec le cœur.",
        "On peut changer ce qui passe. Le public suivra. Enfin, on espère."]},
  {x:310, y:292, w:70, h:100, cle:"affiche2", nom:"Affiche de droite",
   url:"programmation.html",
   bob:["Deux affiches, deux promesses. Il faut maintenant tenir les deux.",
        "Un bon programme, c'est la moitié du travail. L'autre moitié, c'est le balai."]},
  {x:180, y:288, w:120, h:104, cle:"portes", nom:"Les portes du cinéma",
   action:"ouvrir",
   bob:["Les portes attendent. Elles font ça très bien.",
        "Un coup d'épaule sur celle de gauche, elle coince quand il pleut."]},
  {x:118, y:150, w:244, h:52, cle:"enseigne", nom:"L'enseigne",
   url:"personnalisation.html",
   bob:["Notre nom, en lettres lumineuses. Je ne m'en lasse pas.",
        "On peut changer les couleurs. J'ai des idées. Beaucoup d'idées."]},
  {x:92, y:228, w:296, h:56, cle:"marquee", nom:"L'auvent",
   url:"programmation.html",
   bob:["L'auvent annonce la séance du soir. C'est notre vitrine sur la rue.",
        "J'ai changé les lettres au moins six mille fois. À la main."]},
  {x:0, y:384, w:480, h:82, cle:"trottoir", nom:"Le trottoir",
   url:"personnalisation.html",
   bob:["Le trottoir, c'est la première impression. Un banc, un pot de fleurs, et on n'est plus un hangar.",
        "J'ai balayé ce matin. Deux fois. Le vent n'était pas d'accord."]}
];


function poseZones(svg){
  const g = document.createElementNS(SVG_NS,"g");
  g.setAttribute("class","zonesTactiles");
  ZONES.forEach(z=>{
    const r = document.createElementNS(SVG_NS,"rect");
    r.setAttribute("x",z.x); r.setAttribute("y",z.y);
    r.setAttribute("width",z.w); r.setAttribute("height",z.h);
    r.setAttribute("class","zoneTactile");
    r.setAttribute("role","button"); r.setAttribute("tabindex","0");
    r.setAttribute("aria-label",z.nom);
    const declenche = ()=>toucheZone(z, r);
    r.addEventListener("click", declenche);
    r.addEventListener("keydown", e=>{ if(e.key === "Enter" || e.key === " "){ e.preventDefault(); declenche(); }});
    g.appendChild(r);
  });
  svg.appendChild(g);
}

function toucheZone(z, rect){
  rect.classList.add("touchee");
  setTimeout(()=>rect.classList.remove("touchee"), 420);
  parleBob("« " + z.bob[Math.floor(Math.random()*z.bob.length)] + " »");
  if(z.cle === "portes") ouvreLesPortes();
  if(z.action === "ouvrir" && typeof confirmeOuverture === "function"){
    planifie(()=>confirmeOuverture(), 620);
    return;
  }
  if(z.url) planifie(()=>{ quitteLieu(z.url); }, 900);
}

/* ============================================================
   MISE EN ROUTE
   ============================================================ */
function animeLeCinema(){
  const svg = document.querySelector("#facade svg");
  if(!svg || vieActive) return;
  vieActive = true;

  const meteo = meteoDuJour();
  document.body.dataset.meteo = meteo;
  poseMeteo(svg, meteo);
  refPortes = preparePortes(svg);
  animeEnseigne(svg);
  fumee(svg);
  poseZones(svg);

  /* les passages rares, espacés pour ne jamais saturer */
  const boucleVoiture = ()=>{ voiture(svg); planifie(boucleVoiture, 38000 + Math.random()*52000); };
  planifie(boucleVoiture, 14000 + Math.random()*20000);

  const h = new Date().getHours();
  if(h >= 6 && h < 11){
    const boucleOiseaux = ()=>{ oiseaux(svg); planifie(boucleOiseaux, 45000 + Math.random()*40000); };
    planifie(boucleOiseaux, 6000);
  }

  /* les portes s'ouvrent de temps en temps, comme si quelqu'un entrait */
  const boucleEntree = ()=>{ ouvreLesPortes(); planifie(boucleEntree, 22000 + Math.random()*30000); };
  planifie(boucleEntree, 9000 + Math.random()*8000);

  /* on relâche tout quand l'onglet passe en arrière-plan */
  document.addEventListener("visibilitychange", ()=>{
    if(document.hidden) arreteLaVie();
    else if(!minuteurs.length){ planifie(boucleVoiture, 20000); planifie(boucleEntree, 12000); }
  });

  return meteo;
}

function bobMeteo(){
  const m = METEOS[meteoDuJour()];
  return m ? m.bob : null;
}

/* ---- exports ---- */
export {
  METEOS,
  SVG_NS,
  ZONES,
  animeEnseigne,
  animeLeCinema,
  arreteLaVie,
  bobMeteo,
  densite,
  fumee,
  meteoDuJour,
  minuteurs,
  oiseaux,
  ouvreLesPortes,
  planifie,
  poseMeteo,
  poseZones,
  preparePortes,
  refPortes,
  toucheZone,
  vieActive,
  voiture
};
