import { ANIMATIONS_LEGERES } from "../ambiance.js?v=2ab9afab";
import { deblocagesDuNiveau, phraseBob, sonNiveau } from "../progression.js?v=2ab9afab";
import { echappe, texteSur } from "./emblems.js?v=2ab9afab";
import { icone } from "./icons.js?v=2ab9afab";

/* ============================================================
   CÉLÉBRATION — la récompense qu'on regarde, pas qu'on lit.
   Un seul canvas pour les particules, du SVG pour Bob et la
   salle qui applaudit. Tout se démonte à la fin.
   ============================================================ */

/* ------------------------------------------------------------
   PARTICULES — un canvas, une boucle, aucune surcharge du DOM
   ------------------------------------------------------------ */
function lanceParticules(canvas, mode, duree = 4200){
  const ctx = canvas.getContext("2d", {alpha:true});
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const L = canvas.clientWidth, H = canvas.clientHeight;
  canvas.width = L * dpr; canvas.height = H * dpr;
  ctx.scale(dpr, dpr);

  const COULEURS = ["#e8b84b","#f7dd9a","#a82b3d","#f2e8d5","#5fd8c8","#e8443a"];
  const legere = typeof ANIMATIONS_LEGERES !== "undefined" && ANIMATIONS_LEGERES;
  const NB = legere ? 42 : 110;
  const p = [];

  /* confettis : ils tombent en tournant sur eux-mêmes */
  function confetti(){
    return {
      x: Math.random()*L, y: -20 - Math.random()*H*0.5,
      vx: (Math.random()-.5)*1.1, vy: 1.6 + Math.random()*2.4,
      w: 4 + Math.random()*5, h: 7 + Math.random()*7,
      rot: Math.random()*Math.PI, vr: (Math.random()-.5)*0.22,
      c: COULEURS[(Math.random()*COULEURS.length)|0], type:"c"
    };
  }
  /* fusée : elle monte, ralentit, explose en gerbe */
  function fusee(){
    return {
      x: L*(0.2 + Math.random()*0.6), y: H + 10,
      vx: (Math.random()-.5)*0.5, vy: -(5.5 + Math.random()*2.5),
      cible: H*(0.18 + Math.random()*0.28),
      c: COULEURS[(Math.random()*COULEURS.length)|0], type:"f"
    };
  }
  function gerbe(x, y, c){
    const n = legere ? 14 : 26;
    for(let i=0;i<n;i++){
      const a = (Math.PI*2*i)/n + Math.random()*.2;
      const v = 1.8 + Math.random()*2.6;
      p.push({x, y, vx:Math.cos(a)*v, vy:Math.sin(a)*v, r:1.6+Math.random()*1.6,
              vie:1, c, type:"e"});
    }
  }

  if(mode === "confettis" || mode === "les_deux")
    for(let i=0;i<NB;i++) p.push(confetti());

  let t0 = performance.now(), fin = false, prochaineFusee = 0;
  function boucle(t){
    const dt = Math.min(32, t - t0) / 16.67; t0 = t;
    ctx.clearRect(0, 0, L, H);

    if((mode === "feux" || mode === "les_deux") && t > prochaineFusee && !fin){
      p.push(fusee());
      prochaineFusee = t + (legere ? 900 : 520) + Math.random()*420;
    }

    for(let i = p.length - 1; i >= 0; i--){
      const o = p[i];
      if(o.type === "c"){
        o.x += o.vx*dt; o.y += o.vy*dt; o.rot += o.vr*dt;
        o.vx += Math.sin(o.y/40)*0.02*dt;                 /* léger balancement */
        ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(o.rot);
        ctx.fillStyle = o.c; ctx.globalAlpha = .92;
        ctx.fillRect(-o.w/2, -o.h/2, o.w, o.h*Math.abs(Math.cos(o.rot)));
        ctx.restore();
        if(o.y > H + 30){ if(fin) p.splice(i,1); else Object.assign(o, confetti()); }
      }
      else if(o.type === "f"){
        o.x += o.vx*dt; o.y += o.vy*dt; o.vy += 0.09*dt;
        ctx.beginPath(); ctx.arc(o.x, o.y, 2.2, 0, 7);
        ctx.fillStyle = o.c; ctx.globalAlpha = .95; ctx.fill();
        if(o.vy >= -0.6 || o.y <= o.cible){ gerbe(o.x, o.y, o.c); p.splice(i,1); }
      }
      else{
        o.x += o.vx*dt; o.y += o.vy*dt; o.vy += 0.055*dt; o.vie -= 0.014*dt;
        if(o.vie <= 0){ p.splice(i,1); continue; }
        ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, 7);
        ctx.fillStyle = o.c; ctx.globalAlpha = Math.max(0, o.vie); ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    if(!fin || p.length) canvas._raf = requestAnimationFrame(boucle);
  }
  canvas._raf = requestAnimationFrame(boucle);
  setTimeout(()=>{ fin = true; }, duree);
  return ()=>{ fin = true; cancelAnimationFrame(canvas._raf); };
}

/* ------------------------------------------------------------
   LA SALLE QUI APPLAUDIT
   ------------------------------------------------------------ */
function sallePublicSVG(){
  const rangs = [
    {y:96, k:1,   n:9,  o:.45},
    {y:118, k:1.2, n:8, o:.7},
    {y:142, k:1.45, n:7, o:1}
  ];
  return `<svg viewBox="0 0 320 160" class="salleApplaudit" xmlns="http://www.w3.org/2000/svg"
    role="img" aria-label="Le public applaudit">
    <defs><linearGradient id="ecranCel" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff8e2"/><stop offset="1" stop-color="#e8d9a8"/>
    </linearGradient></defs>
    <rect width="320" height="160" fill="#160a10"/>
    <rect x="42" y="12" width="236" height="62" rx="2" fill="url(#ecranCel)" class="ecranBrille"/>
    <rect x="38" y="8" width="244" height="70" rx="3" fill="none" stroke="#caa24a" stroke-width="2.5"/>
    ${rangs.map((r,ri)=>`<g opacity="${r.o}">
      ${[...Array(r.n)].map((_,i)=>{
        const x = 24 + i*(272/r.n);
        return `<g transform="translate(${x} ${r.y}) scale(${r.k})" class="specApplaudit"
          style="animation-delay:${((ri*0.11)+(i*0.07)).toFixed(2)}s">
          <circle cx="0" cy="-9" r="5" fill="#1c1218"/>
          <path d="M-7 0 Q0 -5 7 0 L7 8 L-7 8 Z" fill="#241820"/>
          <g class="mains">
            <circle cx="-8" cy="-2" r="2.6" fill="#2a1e26"/>
            <circle cx="8" cy="-2" r="2.6" fill="#2a1e26"/>
          </g>
        </g>`;}).join("")}
    </g>`).join("")}
  </svg>`;
}

/* Bob qui applaudit, mains qui se rejoignent */
function bobApplaudit(){
  return `<svg viewBox="0 0 120 130" class="bobCelebre" xmlns="http://www.w3.org/2000/svg"
    role="img" aria-label="Bob applaudit">
    <g class="bobCorps">
      <path d="M38 130 L38 96 Q38 84 60 84 Q82 84 82 96 L82 130 Z" fill="#571520"/>
      <circle cx="60" cy="62" r="26" fill="#f0c9a0"/>
      <path d="M40 70 Q50 78 60 71 Q70 78 80 70 Q72 84 60 76 Q48 84 40 70" fill="#4a3527"/>
      <path d="M44 52 Q51 47 57 51 M63 51 Q69 47 76 52" stroke="#4a3527" stroke-width="4"
        fill="none" stroke-linecap="round"/>
      <circle cx="51" cy="58" r="2.6" fill="#1c1210"/><circle cx="69" cy="58" r="2.6" fill="#1c1210"/>
      <path d="M34 48 Q60 26 86 48 L86 42 Q60 20 34 42 Z" fill="#571520"/>
      <rect x="52" y="36" width="16" height="7" rx="2" fill="#e8b84b"/>
    </g>
    <g class="mainG"><ellipse cx="30" cy="98" rx="9" ry="7" fill="#f0c9a0"/></g>
    <g class="mainD"><ellipse cx="90" cy="98" rx="9" ry="7" fill="#f0c9a0"/></g>
  </svg>`;
}

/* ------------------------------------------------------------
   LA CÉRÉMONIE
   ------------------------------------------------------------ */
function celebreNiveau(niv){
  /* On n'annonce que ce qui existe vraiment. La table NIVEAUX décrit
     une feuille de route ; annoncer un bar ou une terrasse qui ne
     sont pas construits revient à promettre pour rien. */
  const recompensesReelles = typeof deblocagesDuNiveau === "function"
    ? deblocagesDuNiveau(niv.n) : [];

  return new Promise(resolve=>{
    if(typeof sonNiveau === "function") sonNiveau();

    const o = document.createElement("div");
    o.className = "voileCelebration";
    o.innerHTML = `
      <canvas class="canvasFete" aria-hidden="true"></canvas>

      <div class="scèneCelebration">
        <div class="banniereNiveau">
          <span class="bnRuban gauche"></span>
          <span class="bnCorps">
            <span class="bnSur">Cinéma</span>
            <b class="bnNiveau">niveau ${niv.n}</b>
          </span>
          <span class="bnRuban droite"></span>
        </div>

        <div class="celTitre" id="celTitre"></div>

        <div class="celSalle">${sallePublicSVG()}</div>

        <div class="celBob">
          ${bobApplaudit()}
          <div class="celBulle"><b>Bob</b><span id="celBobDit"></span></div>
        </div>

        ${(recompensesReelles || []).length ? `
          <div class="celDebloque">Débloqué</div>
          <div class="celListe">
            ${recompensesReelles.map((r,i)=>`
              <div class="celRecompense" style="animation-delay:${(1.1 + i*.22).toFixed(2)}s">
                ${icone(r.ic)}<span><b>${echappe(r.nom)}</b><small>${echappe(r.desc)}</small></span>
              </div>`).join("")}
          </div>` : ""}

        <button class="btnOr celFermer" id="celFermer">Continuer</button>
      </div>`;
    document.body.appendChild(o);
    document.body.classList.add("celebrationEnCours");

    texteSur(document.getElementById("celTitre"), niv.titre || "");
    texteSur(document.getElementById("celBobDit"),
      (typeof phraseBob === "function" ? phraseBob(niv.n) : "Bravo, patron."));

    /* le cinéma s'illumine derrière le voile */
    illumineLaFacade();

    const stop = lanceParticules(o.querySelector(".canvasFete"),
      niv.palier ? "les_deux" : "confettis", niv.palier ? 6000 : 4200);

    const fermer = ()=>{
      stop();
      o.classList.add("sortie");
      document.body.classList.remove("celebrationEnCours");
      setTimeout(()=>{ o.remove(); resolve(); }, 340);
    };
    o.querySelector("#celFermer").onclick = fermer;
    /* sortie automatique si le joueur ne touche rien */
    setTimeout(()=>{ if(document.body.contains(o)) fermer(); }, niv.palier ? 11000 : 8500);
  });
}

/* la façade brille un instant : la récompense se voit sur le bâtiment */
function illumineLaFacade(){
  const f = document.getElementById("facade");
  if(!f) return;
  f.classList.add("facadeIllumine");
  setTimeout(()=>f.classList.remove("facadeIllumine"), 5200);
}

/* ------------------------------------------------------------
   PETITES CÉLÉBRATIONS — pour les trophées et les récompenses
   ------------------------------------------------------------ */
function celebreTrophee(nom, description, icone_ = "etoile"){
  const o = document.createElement("div");
  o.className = "voileTrophee";
  o.innerHTML = `
    <canvas class="canvasFete petite" aria-hidden="true"></canvas>
    <div class="carteTrophee">
      <div class="ctLueur"></div>
      <div class="ctIco">${icone(icone_, "icoTrophee")}</div>
      <div class="ctSur">Trophée obtenu</div>
      <div class="ctNom" id="ctNom"></div>
      <div class="ctDesc" id="ctDesc"></div>
    </div>`;
  document.body.appendChild(o);
  texteSur(document.getElementById("ctNom"), nom);
  texteSur(document.getElementById("ctDesc"), description || "");
  const stop = lanceParticules(o.querySelector(".canvasFete"), "confettis", 2600);
  setTimeout(()=>{
    stop(); o.classList.add("sortie");
    setTimeout(()=>o.remove(), 340);
  }, 3400);
}

/* ---- exports ---- */
export {
  bobApplaudit,
  celebreNiveau,
  celebreTrophee,
  illumineLaFacade,
  lanceParticules,
  sallePublicSVG
};
