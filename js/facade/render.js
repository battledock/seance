import { etatBatiment, murSelonEtat } from "./ages.js?v=2ab9afab";
import {
  PALETTES,
  ampoules,
  decoupe,
  fenetreVoisin,
  pilastre
} from "./palettes.js?v=2ab9afab";
import { A } from "../ui/genre-posters.js?v=2ab9afab";

/* ============================================================
   FAÇADE ÉVOLUTIVE — le même bâtiment à travers six âges
   ============================================================ */

function dessineFacadeEvolutive(opts = {}){
  const phase = opts.phase || "nuit";
  const P = PALETTES[phase];
  const E = etatBatiment(opts.niveau || 1);
  const M = murSelonEtat(P, E);
  const lum = P.lumieres;
  const nomBrut = (opts.nom || "LE COSMOS").toUpperCase();
  const logo = opts.logo || "★";
  const seances = E.affiches ? (opts.seances || []) : [];
  const tailleNom = nomBrut.length > 15 ? 17 : nomBrut.length > 11 ? 21 : 25;

  /* les lettres tombent quand l'enseigne est ruinée */
  const nom = nomBrut;
  const enseigneVive = E.enseigneAllumee && lum;

  /* ---------- fabriques dépendantes de l'état ---------- */
  const ecaillure = (x, y, l, h) => E.peintureEcaillee
    ? `<path d="M${x} ${y} l${l*.3} ${-h*.4} l${l*.5} ${h*.2} l${l*.2} ${h*.5} l${-l*.4} ${h*.3} Z"
        fill="#000" opacity="${(.10 + E.usure*.10).toFixed(2)}"/>` : "";

  const coulure = (x, y, h) => E.rouille
    ? `<path d="M${x} ${y} q1.5 ${h*.5} 0 ${h}" stroke="#6a4a2a"
        stroke-width="${(1 + E.usure).toFixed(1)}" fill="none"
        opacity="${(.18 + E.usure*.22).toFixed(2)}"/>` : "";

  return `
<svg viewBox="0 0 480 520" class="facadeRiche" xmlns="http://www.w3.org/2000/svg"
  role="img" aria-label="Façade du cinéma ${nomBrut}, ${E.age.nom}">
<defs>
  <linearGradient id="cielG" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${P.ciel[0]}"/>
    <stop offset=".55" stop-color="${P.ciel[1]}"/>
    <stop offset="1" stop-color="${P.ciel[2]}"/>
  </linearGradient>
  <linearGradient id="murG" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="${M.fonce}"/>
    <stop offset=".35" stop-color="${M.clair}"/>
    <stop offset="1" stop-color="${M.fonce}"/>
  </linearGradient>
  <linearGradient id="pierreG" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="${M.pierre}" stop-opacity=".55"/>
    <stop offset=".4" stop-color="${M.pierre}"/>
    <stop offset="1" stop-color="${P.murOmbre}"/>
  </linearGradient>
  <linearGradient id="orG" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${E.usure > .5 ? "#8a7a5a" : "#f7dd9a"}"/>
    <stop offset=".5" stop-color="${E.usure > .5 ? "#6a5a3a" : "#caa24a"}"/>
    <stop offset="1" stop-color="${E.usure > .5 ? "#4a3e28" : "#8a6c2a"}"/>
  </linearGradient>
  <linearGradient id="laitonG" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${E.rouille ? "#8a7a52" : "#e8cf8a"}"/>
    <stop offset=".5" stop-color="${E.rouille ? "#5a4a2a" : "#a8862f"}"/>
    <stop offset="1" stop-color="${E.rouille ? "#7a6a48" : "#d8bd76"}"/>
  </linearGradient>
  <linearGradient id="afficheG" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#fff" stop-opacity=".2"/>
    <stop offset=".5" stop-color="#000" stop-opacity="0"/>
    <stop offset="1" stop-color="#000" stop-opacity=".3"/>
  </linearGradient>
  <linearGradient id="trottoirG" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${P.trottoir[0]}"/><stop offset="1" stop-color="${P.trottoir[1]}"/>
  </linearGradient>
  <linearGradient id="routeG" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${P.route[0]}"/><stop offset="1" stop-color="${P.route[1]}"/>
  </linearGradient>
  <radialGradient id="ampouleG" cx=".4" cy=".35" r=".7">
    <stop offset="0" stop-color="#fffdf0"/><stop offset=".5" stop-color="#ffdf9a"/>
    <stop offset="1" stop-color="#e8a83a"/>
  </radialGradient>
  <radialGradient id="haloG" cx=".5" cy=".5" r=".5">
    <stop offset="0" stop-color="#ffdf9a" stop-opacity=".55"/>
    <stop offset=".45" stop-color="#ffc76a" stop-opacity=".18"/>
    <stop offset="1" stop-color="#ffc76a" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="solHaloG" cx=".5" cy=".5" r=".5">
    <stop offset="0" stop-color="#ffdf9a" stop-opacity=".4"/>
    <stop offset="1" stop-color="#ffdf9a" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="vitreG" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${enseigneVive ? "#4a3a28" : "#2a3038"}"/>
    <stop offset=".5" stop-color="${enseigneVive ? "#7a5a30" : "#3a4048"}"/>
    <stop offset="1" stop-color="${enseigneVive ? "#3a2a1c" : "#22282e"}"/>
  </linearGradient>
  <linearGradient id="tapisG" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#a82b3d"/><stop offset="1" stop-color="#6e1424"/>
  </linearGradient>
  <linearGradient id="coneG" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#ffe9b0" stop-opacity=".3"/>
    <stop offset="1" stop-color="#ffe9b0" stop-opacity="0"/>
  </linearGradient>
  <linearGradient id="planchesG" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#8a6c48"/><stop offset="1" stop-color="#5a4430"/>
  </linearGradient>
  <radialGradient id="vignetteG" cx=".5" cy=".45" r=".72">
    <stop offset=".55" stop-color="#000" stop-opacity="0"/>
    <stop offset="1" stop-color="#000" stop-opacity="${P.vignette}"/>
  </radialGradient>
  <filter id="flouLeger" x="-20%" y="-20%" width="140%" height="140%">
    <feGaussianBlur stdDeviation="1.6"/>
  </filter>
  <filter id="flouFort" x="-30%" y="-30%" width="160%" height="160%">
    <feGaussianBlur stdDeviation="5"/>
  </filter>
  <pattern id="grain" width="60" height="60" patternUnits="userSpaceOnUse">
    ${[...Array(48)].map(()=>`<circle cx="${(Math.random()*60).toFixed(1)}"
      cy="${(Math.random()*60).toFixed(1)}" r=".45" fill="#fff" opacity=".05"/>`).join("")}
  </pattern>
  <pattern id="salissure" width="80" height="80" patternUnits="userSpaceOnUse">
    ${[...Array(10)].map(()=>`<ellipse cx="${(Math.random()*80).toFixed(0)}"
      cy="${(Math.random()*80).toFixed(0)}" rx="${(6+Math.random()*14).toFixed(0)}"
      ry="${(4+Math.random()*9).toFixed(0)}" fill="#2a2418"
      opacity="${(.05 + Math.random()*.06).toFixed(3)}"/>`).join("")}
  </pattern>
</defs>

<!-- ═══ CIEL ═══ -->
<rect width="480" height="520" fill="url(#cielG)"/>
${phase === "nuit" ? `<g class="etoiles">${[...Array(46)].map((_,i)=>
  `<circle cx="${(Math.random()*480).toFixed(0)}" cy="${(Math.random()*190).toFixed(0)}"
    r="${(0.5+Math.random()*0.9).toFixed(2)}" fill="#fff"
    opacity="${(.3+Math.random()*.6).toFixed(2)}"
    style="animation-delay:${(i*.17).toFixed(2)}s"/>`).join("")}</g>` : ""}

${phase === "nuit"
  ? `<g><circle cx="392" cy="${P.soleilY}" r="42" fill="#dfe8ff" opacity=".1" filter="url(#flouFort)"/>
     <circle cx="392" cy="${P.soleilY}" r="19" fill="#eef2ff"/>
     <circle cx="384" cy="${P.soleilY - 6}" r="17" fill="${P.ciel[0]}"/></g>`
  : `<g><circle cx="${phase==="crepuscule"?96:368}" cy="${P.soleilY}" r="58"
       fill="${P.soleil}" opacity=".2" filter="url(#flouFort)"/>
     <circle cx="${phase==="crepuscule"?96:368}" cy="${P.soleilY}" r="${phase==="crepuscule"?26:19}"
       fill="${P.soleil}" opacity=".9"/></g>`}

<g opacity="${phase==="nuit"?.22:.5}">
  <g class="nuageA">
    <ellipse cx="120" cy="72" rx="46" ry="14" fill="#fff" opacity=".5"/>
    <ellipse cx="150" cy="66" rx="34" ry="13" fill="#fff" opacity=".42"/>
    <ellipse cx="96" cy="78" rx="28" ry="10" fill="#fff" opacity=".36"/>
  </g>
  <g class="nuageB">
    <ellipse cx="344" cy="122" rx="54" ry="12" fill="#fff" opacity=".3"/>
    <ellipse cx="376" cy="116" rx="30" ry="11" fill="#fff" opacity=".26"/>
  </g>
</g>

<!-- ═══ VILLE ═══ -->
<g opacity=".55">
  <path d="M0 208 L28 208 L28 176 L56 176 L56 196 L92 196 L92 164 L124 164 L124 200
           L166 200 L166 182 L200 182 L200 206 L246 206 L246 172 L282 172 L282 198
           L324 198 L324 178 L360 178 L360 202 L410 202 L410 186 L452 186 L452 204
           L480 204 L480 260 L0 260 Z" fill="${P.immeubles[2]}"/>
</g>
<g opacity=".78">
  <path d="M0 230 L44 230 L44 202 L88 202 L88 222 L132 222 L132 194 L182 194 L182 226
           L232 226 L232 208 L286 208 L286 232 L340 232 L340 200 L392 200 L392 228
           L446 228 L446 214 L480 214 L480 280 L0 280 Z" fill="${P.immeubles[1]}"/>
  ${lum ? [...Array(26)].map(()=>fenetreVoisin((Math.random()*470).toFixed(0),
    (212+Math.random()*54).toFixed(0), 3, 4, P, Math.random()<.6)).join("") : ""}
</g>
<g>
  <rect x="0" y="188" width="72" height="196" fill="${P.immeubles[0]}"/>
  <rect x="0" y="184" width="72" height="6" fill="${P.toit}"/>
  ${[0,1,2,3].map(r=>[0,1,2].map(c=>
    fenetreVoisin(9 + c*22, 204 + r*40, 13, 22, P, lum && Math.random()<.62)).join("")).join("")}
  <rect x="408" y="176" width="72" height="208" fill="${P.immeubles[0]}"/>
  <rect x="408" y="172" width="72" height="6" fill="${P.toit}"/>
  ${[0,1,2,3,4].map(r=>[0,1].map(c=>
    fenetreVoisin(422 + c*26, 192 + r*38, 15, 22, P, lum && Math.random()<.55)).join("")).join("")}
  <rect x="404" y="176" width="4" height="208" fill="${P.toit}" opacity=".7"/>
</g>
<rect x="0" y="180" width="480" height="120" fill="${P.brume}" opacity="${P.brumeOpac}"/>

<!-- ═══ LE CINÉMA ═══ -->
<g>
  <!-- couronnement : un gradin de plus par âge -->
  ${E.couronnement >= 1 ? `<rect x="86" y="118" width="308" height="14" fill="url(#pierreG)"/>` : ""}
  ${E.couronnement >= 2 ? `<rect x="98" y="104" width="284" height="16" fill="url(#pierreG)"/>` : ""}
  ${E.couronnement >= 3 ? `<rect x="118" y="88" width="244" height="18" fill="url(#pierreG)"/>` : ""}
  ${E.couronnement >= 4 ? `<rect x="152" y="72" width="176" height="18" fill="url(#pierreG)"/>` : ""}
  ${E.couronnement >= 5 ? `<rect x="196" y="58" width="88" height="16" fill="url(#pierreG)"/>` : ""}
  ${E.filetsDores ? `<g fill="url(#orG)">
    <rect x="86" y="130" width="308" height="3"/>
    ${E.couronnement>=2?`<rect x="98" y="118" width="284" height="2"/>`:""}
    ${E.couronnement>=3?`<rect x="118" y="104" width="244" height="2"/>`:""}
    ${E.couronnement>=4?`<rect x="152" y="88" width="176" height="2"/>`:""}
    ${E.couronnement>=5?`<rect x="196" y="72" width="88" height="2"/>`:""}
  </g>` : ""}
  ${E.eventail ? `<g transform="translate(240 58)">
    ${[...Array(7)].map((_,i)=>{
      const a = -90 + (i-3)*15;
      return `<path d="M0 0 L${(Math.cos(a*Math.PI/180)*30).toFixed(1)}
        ${(Math.sin(a*Math.PI/180)*30).toFixed(1)}" stroke="url(#orG)" stroke-width="2.4"
        stroke-linecap="round" opacity=".8"/>`;}).join("")}
    <circle cx="0" cy="0" r="5" fill="url(#orG)"/>
  </g>` : ""}

  <!-- corps -->
  <rect x="86" y="132" width="308" height="248" fill="url(#murG)"/>
  <g stroke="#000" stroke-opacity=".07" stroke-width="1">
    ${[...Array(9)].map((_,i)=>`<path d="M86 ${146+i*26} L394 ${146+i*26}"/>`).join("")}
  </g>
  ${E.usure > .05 ? `<rect x="86" y="132" width="308" height="248" fill="url(#salissure)"
    opacity="${(E.usure).toFixed(2)}"/>` : ""}
  <rect x="86" y="132" width="308" height="16" fill="#000" opacity=".18"/>
  ${ecaillure(120, 200, 40, 30)}${ecaillure(300, 250, 46, 34)}${ecaillure(180, 320, 34, 26)}
  ${coulure(96, 148, 60)}${coulure(384, 148, 74)}${coulure(240, 210, 40)}

  <!-- pilastres -->
  ${E.pilastres ? `
    ${pilastre(92, 148, 340, 20, {pierre:M.pierre, murOmbre:P.murOmbre})}
    ${pilastre(368, 148, 340, 20, {pierre:M.pierre, murOmbre:P.murOmbre})}
    ${pilastre(150, 152, 214, 12, {pierre:M.pierre, murOmbre:P.murOmbre})}
    ${pilastre(318, 152, 214, 12, {pierre:M.pierre, murOmbre:P.murOmbre})}`
  : `<g opacity=".5">
      <rect x="92" y="148" width="20" height="192" fill="url(#pierreG)"/>
      <rect x="368" y="148" width="20" height="192" fill="url(#pierreG)"/>
    </g>`}
  ${E.basReliefs ? `<g opacity=".35" fill="${M.pierre}">
    <path d="M176 168 l14 -12 l14 12 l-14 12 Z"/>
    <path d="M276 168 l14 -12 l14 12 l-14 12 Z"/>
  </g>` : ""}

  <!-- ═══ ENSEIGNE ═══ -->
  <g>
    <rect x="118" y="150" width="244" height="52" rx="3"
      fill="#1a1218" opacity="${E.enseigneComplete ? .85 : .6}"/>
    <rect x="118" y="150" width="244" height="52" rx="3" fill="none"
      stroke="url(#orG)" stroke-width="2" opacity="${E.enseigneComplete ? 1 : .5}"/>
    ${enseigneVive ? `<rect x="122" y="154" width="236" height="44" rx="2"
      fill="url(#haloG)" filter="url(#flouLeger)"/>` : ""}
    <text x="240" y="186" text-anchor="middle" font-family="Marcellus, Georgia"
      font-size="${tailleNom}" letter-spacing="4"
      fill="${enseigneVive ? "#ffe9b0" : E.enseigneComplete ? "#e8dcc4" : "#7a6e60"}"
      class="${E.enseigneGresille && lum ? "neonFatigue" : enseigneVive ? "neonVivant" : ""}"
      ${enseigneVive ? 'style="filter:drop-shadow(0 0 8px rgba(255,200,110,.85))"' : ""}>${logo} ${nom}</text>
    ${E.ampouleMorte ? `<circle cx="196" cy="150" r="2" fill="#4a4238" opacity=".8"/>
      <circle cx="301" cy="202" r="2" fill="#4a4238" opacity=".8"/>` : ""}
    ${E.ampoulesEnseigne ? ampoules(126, 354, 150, 14, 2.2) + ampoules(126, 354, 202, 14, 2.2)
      : `<g fill="#4a4238" opacity=".6">
          ${[...Array(14)].map((_,i)=>`<circle cx="${126 + i*17.5}" cy="150" r="2"/>`).join("")}
        </g>`}
  </g>

  <!-- ═══ MARQUEE ═══ -->
  ${E.marquee ? `<g>
    ${E.marqueeVolume ? `
      <path d="M96 262 L384 262 L360 284 L120 284 Z"
        fill="${enseigneVive ? "#4a3418" : "#2a2018"}"/>
      ${enseigneVive ? `<path d="M96 262 L384 262 L360 284 L120 284 Z" fill="url(#haloG)"/>` : ""}
      ${E.ampoulesMarquee ? (E.chenillard
        ? ampoulesChenillard(132, 348, 274, 12, 2.8) : ampoules(132, 348, 274, 12, 2.8)) : ""}
      <path d="M92 232 L388 232 L384 262 L96 262 Z" fill="url(#pierreG)"/>
      <rect x="92" y="228" width="296" height="6" rx="2" fill="url(#orG)"/>
      <path d="M92 232 L96 262 L120 284 L112 284 L88 258 Z" fill="#000" opacity=".22"/>`
    : `<!-- auvent simple, encore de guingois -->
      <path d="M96 236 L384 232 L380 258 L100 262 Z" fill="url(#pierreG)" opacity=".92"/>
      <path d="M96 236 L384 232 L384 236 L96 240 Z" fill="url(#orG)" opacity=".5"/>
      ${coulure(140, 258, 22)}${coulure(320, 256, 26)}`}
    ${E.texteMarquee ? `<text x="240" y="252" text-anchor="middle" font-family="Courier New"
      font-size="11" letter-spacing="2.5" font-weight="bold"
      fill="${enseigneVive ? "#241a12" : "#3a2c22"}">${seances.length
        ? "CE SOIR " + (seances[0].heure || "").replace("h","H") : "PROCHAINEMENT"}</text>` : ""}
  </g>` : ""}

  <!-- ═══ VITRINES ═══ -->
  ${vitrineEtat(104, 296, 62, 92, seances[0], enseigneVive, E)}
  ${vitrineEtat(314, 296, 62, 92, seances[1], enseigneVive, E)}
  ${E.verriere ? `<g>
    <path d="M170 286 L310 286 L322 272 L158 272 Z" fill="#9fc4d8" opacity=".22"/>
    <path d="M170 286 L310 286 L322 272 L158 272 Z" fill="none" stroke="url(#orG)" stroke-width="2"/>
    <g stroke="url(#orG)" stroke-width="1.2" opacity=".7">
      <path d="M198 286 L192 272"/><path d="M240 286 L240 272"/><path d="M282 286 L288 272"/>
    </g>
    ${enseigneVive ? `<path d="M170 286 L310 286 L322 272 L158 272 Z" fill="#ffdf9a" opacity=".1"/>` : ""}
  </g>` : ""}

  <!-- ═══ ENTRÉE ═══ -->
  <g>
    <path d="M178 288 L302 288 L292 300 L188 300 Z" fill="#000" opacity=".3"/>
    <rect x="180" y="296" width="120" height="92" fill="#100a10"/>
    ${enseigneVive ? `<rect x="184" y="300" width="112" height="84" fill="#ffdf9a" opacity=".1"/>` : ""}
    <rect x="184" y="300" width="54" height="84" rx="2" fill="url(#vitreG)"
      stroke="${E.portesDorees ? "url(#orG)" : "url(#laitonG)"}" stroke-width="${E.portesDorees ? 3 : 2}"/>
    <rect x="242" y="300" width="54" height="84" rx="2" fill="url(#vitreG)"
      stroke="${E.portesDorees ? "url(#orG)" : "url(#laitonG)"}" stroke-width="${E.portesDorees ? 3 : 2}"/>
    <path d="M190 380 L216 304 L226 304 L200 380 Z" fill="#fff" opacity=".08"/>
    <path d="M248 380 L274 304 L284 304 L258 380 Z" fill="#fff" opacity=".08"/>
    <rect x="228" y="332" width="4" height="24" rx="2"
      fill="${E.portesDorees ? "url(#orG)" : "url(#laitonG)"}"/>
    <rect x="248" y="332" width="4" height="24" rx="2"
      fill="${E.portesDorees ? "url(#orG)" : "url(#laitonG)"}"/>
    ${E.portesDorees ? `<g opacity=".55">
      <path d="M196 314 l10 -8 l10 8 l-10 8 Z M264 314 l10 -8 l10 8 l-10 8 Z" fill="url(#orG)"/>
    </g>` : ""}
    ${E.imposte ? `<rect x="184" y="290" width="112" height="8" fill="url(#laitonG)" opacity=".8"/>` : ""}
    ${E.appliques ? [168, 306].map(x=>`<g transform="translate(${x} 312)">
      <path d="M0 0 l7 -9 l7 9 l-3 14 l-8 0 Z" fill="url(#laitonG)"/>
      ${lum ? `<circle cx="7" cy="6" r="9" fill="url(#haloG)"/>
        <circle cx="7" cy="4" r="3" fill="#fff4d0" class="amp"/>` : ""}
    </g>`).join("") : ""}
  </g>

  ${E.plaque ? `<g transform="translate(322 356)">
    <rect x="0" y="0" width="52" height="17" rx="2" fill="url(#laitonG)"/>
    <rect x="1.5" y="1.5" width="49" height="14" rx="1.5" fill="none"
      stroke="#6a5220" stroke-width=".8"/>
    <text x="26" y="11.5" text-anchor="middle" font-family="Courier New" font-size="5.4"
      letter-spacing=".3" fill="#3a2408">CINEMA DU QUARTIER</text>
  </g>` : ""}


  <!-- ═══ ENSEIGNE VERTICALE ═══ -->
  ${E.enseigneVerticale ? `<g>
    <rect x="60" y="126" width="34" height="196" rx="4" fill="#1a1218"
      stroke="url(#orG)" stroke-width="2.4"/>
    <rect x="60" y="126" width="34" height="196" rx="4" fill="none"
      stroke="url(#orG)" stroke-width="1" opacity=".5" transform="translate(2 2)"/>
    ${lum ? `<rect x="63" y="129" width="28" height="190" rx="3" fill="url(#haloG)"
      filter="url(#flouLeger)"/>` : ""}
    ${(opts.nom || "CINE").toUpperCase().replace(/[^A-Z]/g,"").slice(0,8).split("").map((c,k)=>
      `<text x="77" y="${152 + k*23}" text-anchor="middle" font-family="Marcellus, Georgia"
        font-size="17" fill="${lum ? "#ffe9b0" : "#c8bca4"}"
        ${lum ? 'style="filter:drop-shadow(0 0 6px rgba(255,200,110,.8))"' : ""}
        class="${lum ? "lettreBlade" : ""}" style="animation-delay:${(k*.22).toFixed(2)}s">${c}</text>`
      ).join("")}
    <path d="M60 126 l17 -16 l17 16 Z" fill="url(#orG)"/>
    ${[...Array(9)].map((_,k)=>`<circle cx="56" cy="${140 + k*21}" r="2"
      fill="url(#ampouleG)" class="amp a${k%4}"/>
      <circle cx="98" cy="${140 + k*21}" r="2" fill="url(#ampouleG)" class="amp a${(k+2)%4}"/>`).join("")}
  </g>` : ""}

  <!-- ═══ HORLOGE DE FRONTON ═══ -->
  ${E.horloge ? `<g transform="translate(240 106)">
    <circle cx="0" cy="0" r="21" fill="#1a1218" stroke="url(#orG)" stroke-width="2.6"/>
    <circle cx="0" cy="0" r="17" fill="${lum ? "#3a2a18" : "#2a2620"}"/>
    ${[...Array(12)].map((_,k)=>{
      const a = k*30*Math.PI/180;
      return `<line x1="${(Math.sin(a)*14).toFixed(1)}" y1="${(-Math.cos(a)*14).toFixed(1)}"
        x2="${(Math.sin(a)*16).toFixed(1)}" y2="${(-Math.cos(a)*16).toFixed(1)}"
        stroke="url(#orG)" stroke-width="1.4"/>`;}).join("")}
    <line x1="0" y1="0" x2="0" y2="-9" stroke="#e8dcc4" stroke-width="2" stroke-linecap="round"
      class="aiguilleH"/>
    <line x1="0" y1="0" x2="9" y2="2" stroke="#e8dcc4" stroke-width="1.4" stroke-linecap="round"
      class="aiguilleM"/>
    <circle cx="0" cy="0" r="2" fill="url(#orG)"/>
  </g>` : ""}

  <!-- ═══ FENÊTRES D'ÉTAGE ═══ -->
  ${E.fenetresEtage ? `<g>
    ${[126, 186, 246, 306].map(x=>`<g>
      <rect x="${x}" y="206" width="28" height="18" rx="2" fill="${lum ? "#ffcf8a" : "#4a5058"}"
        opacity="${lum ? .85 : .6}"/>
      <rect x="${x-2}" y="204" width="32" height="3" fill="url(#pierreG)"/>
      <rect x="${x-2}" y="224" width="32" height="3" fill="url(#pierreG)"/>
      <line x1="${x+14}" y1="206" x2="${x+14}" y2="224" stroke="#2a2620" stroke-width="1.2"/>
    </g>`).join("")}
  </g>` : ""}

  ${E.echafaudage ? `<g opacity=".85">
    <g stroke="#6a6258" stroke-width="2.6" fill="none">
      <path d="M96 380 L96 210 M136 380 L136 210 M344 380 L344 210 M384 380 L384 210"/>
      <path d="M92 300 L140 300 M340 300 L388 300"/>
      <path d="M92 244 L140 244 M340 244 L388 244"/>
      <path d="M96 300 L136 244 M344 300 L384 244"/>
    </g>
    <rect x="92" y="294" width="48" height="6" fill="#8a6c48"/>
    <rect x="340" y="294" width="48" height="6" fill="#8a6c48"/>
    <rect x="92" y="238" width="48" height="6" fill="#8a6c48"/>
    <rect x="340" y="238" width="48" height="6" fill="#8a6c48"/>
  </g>` : ""}
</g>

<!-- ═══ TROTTOIR ═══ -->
<g>
  <path d="M0 384 L480 384 L480 452 L0 452 Z" fill="url(#trottoirG)"/>
  <g stroke="#000" stroke-opacity=".12" stroke-width="1.2">
    ${[...Array(11)].map((_,i)=>{
      const xh = i*48, xb = (i - 5.5)*72 + 240;
      return `<path d="M${xh} 384 L${xb.toFixed(0)} 452"/>`;}).join("")}
    <path d="M0 404 L480 404"/><path d="M0 426 L480 426"/>
  </g>
  ${E.trottoirFissure ? `<g stroke="#000" stroke-opacity=".26" stroke-width="1.6" fill="none">
    <path d="M42 392 l18 14 l-8 12 l22 16"/>
    <path d="M396 400 l-16 12 l12 14 l-18 14"/>
    <path d="M150 436 l24 8 l-10 8"/>
  </g>` : ""}
  ${E.herbes ? `<g opacity="${(.55 + E.usure*.35).toFixed(2)}">
    ${[70, 196, 268, 366, 430].map(x=>`<g transform="translate(${x} 388)">
      <path d="M0 0 q-3 -9 -1 -14 M2 0 q2 -11 5 -15 M-3 0 q-5 -7 -8 -10"
        stroke="#5a7a3a" stroke-width="1.4" fill="none" stroke-linecap="round"/>
    </g>`).join("")}
    <path d="M86 384 q10 -8 22 -2 q-8 4 -22 2" fill="#4a6b32" opacity=".7"/>
    <path d="M372 384 q12 -9 24 -3 q-10 5 -24 3" fill="#4a6b32" opacity=".6"/>
  </g>` : ""}
  <path d="M0 452 L480 452 L480 462 L0 462 Z" fill="${P.trottoir[1]}"/>
  <path d="M0 462 L480 462 L480 466 L0 466 Z" fill="#000" opacity=".28"/>
</g>

<!-- ═══ ÉTOILES DU TROTTOIR ═══ -->
${E.etoilesSol ? `<g opacity=".8">
  ${[[112,412],[152,432],[352,414],[392,436],[72,428]].map(([x,y],k)=>`<g transform="translate(${x} ${y})">
    <circle cx="0" cy="0" r="13" fill="#2a2620" opacity=".55"/>
    <path d="M0 -10 L2.8 -3 L10 -3 L4.4 1.4 L6.6 8.6 L0 4.4 L-6.6 8.6 L-4.4 1.4 L-10 -3 L-2.8 -3 Z"
      fill="url(#orG)"/>
  </g>`).join("")}
</g>` : ""}

<!-- ═══ GUICHET ═══ -->
${E.guichet ? `<g transform="translate(206 372)">
  <ellipse cx="34" cy="46" rx="42" ry="7" fill="#000" opacity=".3"/>
  <path d="M0 8 L68 8 L62 46 L6 46 Z" fill="url(#pierreG)"/>
  <path d="M-4 0 L72 0 L68 10 L0 10 Z" fill="url(#orG)"/>
  <path d="M10 16 L58 16 L54 38 L14 38 Z" fill="${lum ? "#5a4020" : "#2a3038"}"
    stroke="url(#laitonG)" stroke-width="1.6"/>
  ${lum ? `<path d="M10 16 L58 16 L54 38 L14 38 Z" fill="#ffdf9a" opacity=".22"/>
    <circle cx="34" cy="4" r="12" fill="url(#haloG)"/>` : ""}
  <path d="M22 38 L46 38 L45 42 L23 42 Z" fill="url(#laitonG)"/>
  <text x="34" y="30" text-anchor="middle" font-family="Courier New" font-size="6.5"
    letter-spacing=".8" fill="${lum ? "#f7dd9a" : "#8a8278"}">CAISSE</text>
</g>` : ""}

${E.tapis ? `<g>
  <path d="M186 388 L294 388 L${E.tapisLong ? 340 : 322} 452 L${E.tapisLong ? 140 : 158} 452 Z"
    fill="url(#tapisG)"/>
  <path d="M190 388 L${E.tapisLong ? 144 : 162} 452 M290 388 L${E.tapisLong ? 336 : 318} 452"
    stroke="#e8b84b" stroke-width="2.4" opacity=".7"/>
  <path d="M186 388 L294 388 L292 394 L188 394 Z" fill="#fff" opacity=".08"/>
</g>` : ""}

<!-- ═══ ROUTE ═══ -->
<g>
  <path d="M0 466 L480 466 L480 520 L0 520 Z" fill="url(#routeG)"/>
  <g stroke="#c8c0a8" stroke-opacity="${E.usure > .6 ? ".14" : ".3"}" stroke-width="3"
     stroke-dasharray="26 22"><path d="M0 500 L480 500"/></g>
  <ellipse cx="72" cy="478" rx="15" ry="5" fill="#000" opacity=".3"/>
  <ellipse cx="72" cy="477" rx="13" ry="4" fill="${P.route[0]}"/>
  ${enseigneVive ? `<g opacity=".2" filter="url(#flouFort)">
    <ellipse cx="240" cy="486" rx="110" ry="18" fill="#ffdf9a"/>
    <ellipse cx="240" cy="504" rx="70" ry="11" fill="#ffc76a"/>
  </g>` : ""}
</g>

<!-- ═══ MOBILIER ═══ -->
<g>
  <!-- lampadaire gauche : cassé au premier âge -->
  <g transform="translate(56 384)">
    <ellipse cx="0" cy="4" rx="11" ry="3.5" fill="#000" opacity=".26"/>
    <rect x="-4" y="-2" width="8" height="6" rx="1.5" fill="#2a2620"/>
    <rect x="-2" y="-96" width="4" height="96" fill="#2e2a22"/>
    <rect x="-2" y="-96" width="1.4" height="96" fill="#fff" opacity=".12"/>
    <path d="M0 -96 q0 -12 14 -12" stroke="#2e2a22" stroke-width="4" fill="none"/>
    <path d="M8 -108 l14 0 l4 12 l-22 0 Z" fill="#2e2a22"/>
    ${lum && !E.lampadaireCasse ? `<circle cx="15" cy="-98" r="26" fill="url(#haloG)"/>
      <path d="M6 -95 L24 -95 L44 -6 L-14 -6 Z" fill="url(#coneG)"/>
      <ellipse cx="15" cy="-2" rx="34" ry="9" fill="url(#solHaloG)"/>
      <circle cx="15" cy="-97" r="4" fill="#fff4d0"/>` : ""}
    ${lum && E.lampadaireCasse ? `<circle cx="15" cy="-98" r="14" fill="url(#haloG)" class="vacille"/>
      <circle cx="15" cy="-97" r="2.6" fill="#fff4d0" class="vacille"/>
      <path d="M9 -104 l5 5 M20 -103 l-5 5" stroke="#1a1a1a" stroke-width="1"/>` : ""}
  </g>
  ${E.lampadaires >= 2 ? `<g transform="translate(424 384)">
    <ellipse cx="0" cy="4" rx="11" ry="3.5" fill="#000" opacity=".26"/>
    <rect x="-4" y="-2" width="8" height="6" rx="1.5" fill="#2a2620"/>
    <rect x="-2" y="-88" width="4" height="88" fill="#2e2a22"/>
    <path d="M0 -88 q0 -12 -14 -12" stroke="#2e2a22" stroke-width="4" fill="none"/>
    <path d="M-8 -100 l-14 0 l-4 12 l22 0 Z" fill="#2e2a22"/>
    ${lum ? `<circle cx="-15" cy="-90" r="24" fill="url(#haloG)"/>
      <path d="M-6 -87 L-24 -87 L-42 -6 L14 -6 Z" fill="url(#coneG)"/>
      <ellipse cx="-15" cy="-2" rx="30" ry="8" fill="url(#solHaloG)"/>
      <circle cx="-15" cy="-89" r="3.6" fill="#fff4d0"/>` : ""}
  </g>` : ""}

  ${E.banc ? `<g transform="translate(374 410)">
    <ellipse cx="20" cy="22" rx="26" ry="4" fill="#000" opacity=".24"/>
    <rect x="0" y="0" width="40" height="4" rx="2" fill="#7a5a3a"/>
    <rect x="0" y="6" width="40" height="4" rx="2" fill="#8a6642"/>
    <rect x="2" y="10" width="4" height="12" fill="#3a3630"/>
    <rect x="34" y="10" width="4" height="12" fill="#3a3630"/>
    <rect x="0" y="-10" width="40" height="3.4" rx="1.7" fill="#7a5a3a"/>
    <rect x="1" y="-10" width="3" height="12" fill="#3a3630"/>
    <rect x="36" y="-10" width="3" height="12" fill="#3a3630"/>
  </g>` : ""}
  ${E.jardiniere ? `<g transform="translate(86 402)">
    <ellipse cx="14" cy="30" rx="18" ry="4" fill="#000" opacity=".24"/>
    <path d="M2 12 L26 12 L23 30 L5 30 Z" fill="#8a6a4a"/>
    <rect x="0" y="9" width="28" height="5" rx="1.5" fill="#9a7a58"/>
    <path d="M14 12 q-13 -14 -4 -26 q9 9 4 26" fill="#3d6b3a"/>
    <path d="M14 12 q13 -16 5 -30 q-11 11 -5 30" fill="#4a7d46"/>
    <path d="M14 12 q-18 -6 -18 -20 q15 6 18 20" fill="#35603a"/>
  </g>` : ""}
  ${E.potelets ? `<g>
    ${[152, 200, 280, 328].map(x=>`<g transform="translate(${x} 400)">
      <ellipse cx="0" cy="30" rx="6" ry="2.4" fill="#000" opacity=".24"/>
      <rect x="-2.6" y="0" width="5.2" height="30" rx="2.6" fill="url(#laitonG)"/>
      <circle cx="0" cy="-2" r="4" fill="url(#laitonG)"/>
    </g>`).join("")}
    <path d="M152 398 q24 12 48 0 M280 398 q24 12 48 0" stroke="#8c1f2e"
      stroke-width="3" fill="none" opacity=".85"/>
  </g>` : ""}
  ${E.corbeille ? `<g transform="translate(444 416)">
    <ellipse cx="8" cy="24" rx="11" ry="3" fill="#000" opacity=".22"/>
    <path d="M0 0 L16 0 L14 24 L2 24 Z" fill="#3a3630"/>
    <rect x="-1" y="-2" width="18" height="3.4" rx="1.7" fill="#4a4640"/>
  </g>` : ""}
  ${E.pigeons ? `<g class="pigeons">
    ${[[142,382],[168,381],[402,383]].map(([x,y],i)=>`<g transform="translate(${x} ${y})"
      style="animation-delay:${(i*1.7).toFixed(1)}s">
      <ellipse cx="0" cy="-3" rx="5" ry="3.4" fill="#6a6a72"/>
      <circle cx="4.4" cy="-6" r="2.4" fill="#5a5a64"/>
      <path d="M6.6 -6.2 l2.4 .8 l-2.4 .8 Z" fill="#c08a3a"/>
      <path d="M-5 -3 l-3.4 1.4 l3 1.4 Z" fill="#5a5a64"/>
      <path d="M-1 0 l0 3 M2 0 l0 3" stroke="#c08a3a" stroke-width=".9"/>
    </g>`).join("")}
  </g>` : ""}
</g>

${enseigneVive ? `<g>
  <ellipse cx="240" cy="424" rx="180" ry="52" fill="url(#solHaloG)" opacity=".7"/>
  <ellipse cx="240" cy="398" rx="92" ry="24" fill="#ffdf9a" opacity=".12" filter="url(#flouLeger)"/>
</g>` : ""}

<!-- ═══ PROJECTEURS DE PREMIÈRE ═══ -->
${E.projecteursCiel && lum ? `<g class="projecteurs" opacity=".5">
  <path d="M112 452 L46 0 L106 0 Z" fill="url(#coneG)" class="faisceauA"/>
  <path d="M368 452 L410 0 L470 0 Z" fill="url(#coneG)" class="faisceauB"/>
  <g transform="translate(104 434)">
    <ellipse cx="8" cy="12" rx="16" ry="4" fill="#000" opacity=".3"/>
    <path d="M0 12 L16 12 L13 2 L3 2 Z" fill="#3a3630"/>
    <ellipse cx="8" cy="2" rx="9" ry="3.4" fill="#fff4d0"/>
  </g>
  <g transform="translate(360 434)">
    <ellipse cx="8" cy="12" rx="16" ry="4" fill="#000" opacity=".3"/>
    <path d="M0 12 L16 12 L13 2 L3 2 Z" fill="#3a3630"/>
    <ellipse cx="8" cy="2" rx="9" ry="3.4" fill="#fff4d0"/>
  </g>
</g>` : ""}

<g id="planLoin"></g>
<g id="planMilieu"></g>
<g id="planProche"></g>

<rect width="480" height="520" fill="url(#grain)" opacity=".5" pointer-events="none"/>
<rect width="480" height="520" fill="url(#vignetteG)" pointer-events="none"/>
</svg>`;
}

/* vitrine : toujours vitrée, le caisson s'anoblit avec les niveaux */
function vitrineEtat(x, y, l, h, seance, lum, E){
  const COUL = {"Drame":"#1f3a5c","Aventure":"#1d5c52","Animation":"#4a3f8c",
    "Documentaire":"#2a6b6b","Thriller familial":"#3a2a52","Comédie":"#c07a1f",
    "Romance":"#a83a5c","défaut":"#5a2a34"};
  const c = COUL[(seance && seance.genre)] || COUL["défaut"];
  const lignes = seance ? decoupe(String(seance.titre).toUpperCase(), 12).slice(0,3) : [];

  return `<g>
    <rect x="${x-4}" y="${y-4}" width="${l+8}" height="${h+8}" rx="2"
      fill="${E.vitrinesLaiton ? "url(#laitonG)" : "#5a5044"}"/>
    <rect x="${x-2}" y="${y-2}" width="${l+4}" height="${h+4}" rx="1" fill="#1a1218"/>
    ${seance ? `
      <rect x="${x}" y="${y}" width="${l}" height="${h}" fill="${c}"/>
      <rect x="${x}" y="${y}" width="${l}" height="${h}" fill="url(#afficheG)"/>
      <circle cx="${x + l/2}" cy="${y + h*.3}" r="${l*.22}" fill="#fff" opacity=".16"/>
      ${lignes.map((ln,i)=>`<text x="${x + l/2}" y="${y + h*.62 + i*9}" text-anchor="middle"
        font-family="Georgia" font-size="7" font-weight="bold" fill="#fdf3d2"
        letter-spacing=".4">${ln}</text>`).join("")}
      <text x="${x + l/2}" y="${y + h - 7}" text-anchor="middle" font-family="Courier New"
        font-size="6.5" fill="#fdf3d2" opacity=".75" letter-spacing="1">${seance.heure || ""}</text>`
    : `<rect x="${x}" y="${y}" width="${l}" height="${h}" fill="#2a241f"/>
      <text x="${x + l/2}" y="${y + h/2}" text-anchor="middle" font-family="Courier New"
        font-size="8" fill="#8a7e70" opacity=".5" letter-spacing="1.5">PROCHAINEMENT</text>`}
    <path d="M${x} ${y+h} L${x + l*.55} ${y} L${x + l*.85} ${y} L${x + l*.3} ${y+h} Z"
      fill="#fff" opacity="${E.vitrinesLaiton ? ".07" : ".045"}"/>
    ${lum ? `<rect x="${x}" y="${y}" width="${l}" height="${h}" fill="#ffdf9a" opacity=".07"/>` : ""}
  </g>`;
}

/* ampoules qui défilent, pour les soirs de première */
function ampoulesChenillard(x1, x2, y, n, r = 2.4){
  const pas = (x2 - x1) / (n - 1);
  return [...Array(n)].map((_,i)=>
    `<circle cx="${(x1 + i*pas).toFixed(1)}" cy="${y}" r="${r}"
      fill="url(#ampouleG)" class="chenille" style="animation-delay:${(i*.09).toFixed(2)}s"/>`).join("");
}

/* ---- exports ---- */
export {
  ampoulesChenillard,
  dessineFacadeEvolutive,
  vitrineEtat
};
