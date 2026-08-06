/* ============================================================
   AFFICHES VECTORIELLES
   Une scène dessinée par genre du catalogue. Aucune image :
   chaque film reçoit son affiche automatiquement, sans qu'il
   faille en produire ni en héberger une seule.
   Format 140 × 210, découpé en 2/3 par preserveAspectRatio.
   ============================================================ */

const A = {};

/* ---------- DRAME ---------- */
A["Drame"] = ()=>`<svg viewBox="0 0 140 210" preserveAspectRatio="xMidYMid slice">
  <defs><linearGradient id="drF" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#6a5a68"/><stop offset=".5" stop-color="#3e3244"/>
    <stop offset="1" stop-color="#181420"/></linearGradient></defs>
  <rect width="140" height="210" fill="url(#drF)"/>
  <!-- fenêtre et pluie -->
  <rect x="26" y="30" width="88" height="106" fill="#2a2434" stroke="#8a7c88" stroke-width="2"/>
  <path d="M70 30 L70 136 M26 83 L114 83" stroke="#8a7c88" stroke-width="2"/>
  <g stroke="#b9c8d8" stroke-width="1" opacity=".45">
    ${[...Array(22)].map((_,i)=>{const x=28+(i*29)%84,y=32+(i*41)%98;
      return `<path d="M${x} ${y} l-3 9"/>`;}).join("")}
  </g>
  <!-- silhouette de dos -->
  <g fill="#120e18">
    <circle cx="70" cy="128" r="14"/>
    <path d="M46 210 q0 -52 24 -52 q24 0 24 52 Z"/>
  </g>
  <path d="M0 196 L140 196 L140 210 L0 210 Z" fill="#0c0a12"/>
</svg>`;

/* ---------- AVENTURE ---------- */
A["Aventure"] = ()=>`<svg viewBox="0 0 140 210" preserveAspectRatio="xMidYMid slice">
  <defs><linearGradient id="avF" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#2a6a9a"/><stop offset=".45" stop-color="#154a72"/>
    <stop offset="1" stop-color="#07223a"/></linearGradient>
    <radialGradient id="avR" cx=".5" cy="0" r=".9">
      <stop offset="0" stop-color="#9fd4ee" stop-opacity=".5"/>
      <stop offset="1" stop-color="#9fd4ee" stop-opacity="0"/></radialGradient></defs>
  <rect width="140" height="210" fill="url(#avF)"/>
  <g opacity=".5"><path d="M30 0 L46 0 L70 210 L40 210 Z" fill="url(#avR)"/>
    <path d="M78 0 L88 0 L104 210 L86 210 Z" fill="url(#avR)"/></g>
  <g fill="#bfe3f5" opacity=".35">
    ${[...Array(14)].map((_,i)=>{const x=12+(i*37)%116,y=30+(i*53)%120;
      return `<path d="M${x} ${y} l5 -2 l0 4 Z"/>`;}).join("")}</g>
  <g fill="#0d2a3e" opacity=".92">
    <path d="M18 78 q28 -22 62 -8 q18 8 34 4 q-10 12 -30 14 q-30 12 -58 -2 Z"/>
    <path d="M52 62 l10 -20 l6 22 Z"/>
    <path d="M18 78 l-12 -12 l4 16 l-6 12 l14 -10 Z"/>
    <path d="M58 86 l-6 16 l14 -12 Z"/>
    <circle cx="72" cy="74" r="2.4" fill="#7fc4e4"/></g>
  <path d="M0 170 q22 -18 44 -6 q20 -14 42 -2 q26 -12 54 4 L140 210 L0 210 Z" fill="#04182a"/>
  <g fill="#031320"><circle cx="46" cy="150" r="9"/>
    <path d="M38 158 q8 -4 16 0 l3 22 l-22 0 Z"/>
    <path d="M36 164 l-12 10 l4 4 l12 -8 Z"/><path d="M56 164 l12 6 l-2 5 l-12 -4 Z"/>
    <path d="M36 180 l-6 18 l6 2 l6 -18 Z M50 180 l8 16 l-5 4 l-9 -16 Z"/></g>
  <g opacity=".55" fill="#bfe3f5"><circle cx="58" cy="138" r="2.4"/>
    <circle cx="64" cy="126" r="1.8"/><circle cx="60" cy="114" r="1.2"/></g>
</svg>`;

/* ---------- ANIMATION ---------- */
A["Animation"] = ()=>`<svg viewBox="0 0 140 210" preserveAspectRatio="xMidYMid slice">
  <defs><linearGradient id="anF" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#7fd4e8"/><stop offset=".5" stop-color="#a8e0c0"/>
    <stop offset="1" stop-color="#f6d98a"/></linearGradient></defs>
  <rect width="140" height="210" fill="url(#anF)"/>
  <circle cx="106" cy="36" r="20" fill="#fff3b8"/>
  <g fill="#fff" opacity=".7">
    <ellipse cx="34" cy="46" rx="22" ry="10"/><ellipse cx="50" cy="40" rx="14" ry="8"/>
    <ellipse cx="96" cy="72" rx="18" ry="7"/></g>
  <!-- collines -->
  <path d="M0 132 q26 -26 54 -6 q28 -22 56 -2 q18 -12 30 -2 L140 210 L0 210 Z" fill="#57b87a"/>
  <path d="M0 162 q34 -20 68 -4 q34 -16 72 0 L140 210 L0 210 Z" fill="#3d9660"/>
  <!-- personnage rond -->
  <g><ellipse cx="58" cy="164" rx="20" ry="19" fill="#f0a03a"/>
    <ellipse cx="58" cy="146" rx="15" ry="14" fill="#f7b95a"/>
    <circle cx="52" cy="144" r="3.4" fill="#2a1c10"/><circle cx="64" cy="144" r="3.4" fill="#2a1c10"/>
    <circle cx="53" cy="143" r="1.2" fill="#fff"/><circle cx="65" cy="143" r="1.2" fill="#fff"/>
    <path d="M52 152 q6 5 12 0" stroke="#2a1c10" stroke-width="2" fill="none" stroke-linecap="round"/>
    <path d="M46 134 q-6 -12 2 -14 q4 6 4 12 Z" fill="#f7b95a"/>
    <path d="M70 134 q6 -12 -2 -14 q-4 6 -4 12 Z" fill="#f7b95a"/>
    <ellipse cx="42" cy="168" rx="7" ry="5" fill="#f0a03a"/>
    <ellipse cx="74" cy="168" rx="7" ry="5" fill="#f0a03a"/></g>
  <!-- papillon -->
  <g transform="translate(100 120)"><path d="M0 0 q-9 -8 -3 -12 q6 -2 3 12" fill="#e8607a"/>
    <path d="M0 0 q9 -8 3 -12 q-6 -2 -3 12" fill="#e8607a"/></g>
</svg>`;

/* ---------- DOCUMENTAIRE ---------- */
A["Documentaire"] = ()=>`<svg viewBox="0 0 140 210" preserveAspectRatio="xMidYMid slice">
  <defs><linearGradient id="doF" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#d8cdb4"/><stop offset=".6" stop-color="#a89880"/>
    <stop offset="1" stop-color="#6a5c48"/></linearGradient></defs>
  <rect width="140" height="210" fill="url(#doF)"/>
  <circle cx="70" cy="72" r="44" fill="none" stroke="#4a4234" stroke-width="1.6" opacity=".5"/>
  <circle cx="70" cy="72" r="30" fill="none" stroke="#4a4234" stroke-width="1" opacity=".4"/>
  <!-- montagnes -->
  <path d="M0 138 L34 88 L58 124 L84 74 L116 130 L140 106 L140 210 L0 210 Z" fill="#5a5040"/>
  <path d="M34 88 L44 102 L24 102 Z M84 74 L96 92 L72 92 Z" fill="#e8e0cc" opacity=".7"/>
  <path d="M0 164 q30 -14 62 -2 q34 -12 78 2 L140 210 L0 210 Z" fill="#3e3628"/>
  <!-- oiseaux -->
  <g stroke="#3e3628" stroke-width="1.6" fill="none" opacity=".7">
    <path d="M24 46 q5 -4 10 0 q5 -4 10 0"/><path d="M96 34 q4 -3 8 0 q4 -3 8 0"/></g>
  <!-- objectif -->
  <g transform="translate(70 168)">
    <rect x="-24" y="-10" width="48" height="26" rx="4" fill="#241e16"/>
    <circle cx="0" cy="3" r="11" fill="#0d0a06" stroke="#8a7c60" stroke-width="2"/>
    <circle cx="0" cy="3" r="5" fill="#4a6a7a"/>
    <circle cx="-3" cy="0" r="2" fill="#c8dae4" opacity=".7"/>
    <rect x="-14" y="-15" width="12" height="6" rx="2" fill="#241e16"/></g>
</svg>`;

/* ---------- THRILLER FAMILIAL ---------- */
A["Thriller familial"] = ()=>`<svg viewBox="0 0 140 210" preserveAspectRatio="xMidYMid slice">
  <defs><linearGradient id="thF" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#1a2a48"/><stop offset=".55" stop-color="#101c34"/>
    <stop offset="1" stop-color="#070c18"/></linearGradient></defs>
  <rect width="140" height="210" fill="url(#thF)"/>
  <circle cx="104" cy="38" r="17" fill="#cfd8e8" opacity=".6"/>
  <circle cx="98" cy="34" r="15" fill="#141f38"/>
  <g fill="#22304e" opacity=".7"><ellipse cx="60" cy="44" rx="46" ry="6"/>
    <ellipse cx="102" cy="58" rx="34" ry="5"/></g>
  <g stroke="#0a1120" stroke-width="2.4" fill="none" stroke-linecap="round">
    <path d="M14 210 L14 130 M14 160 l-10 -14 M14 146 l10 -16"/>
    <path d="M128 210 L128 142 M128 168 l10 -12 M128 154 l-9 -14"/></g>
  <g fill="#0c1424">
    <path d="M38 210 L38 122 L70 100 L102 122 L102 210 Z"/>
    <path d="M34 124 L70 96 L106 124 L102 124 L70 102 L38 124 Z" fill="#060b16"/>
    <path d="M52 122 L52 88 L62 88 L62 116 Z"/><path d="M50 90 L57 78 L64 90 Z" fill="#060b16"/></g>
  <g fill="#e8a83a">
    <rect x="46" y="136" width="9" height="12" rx="1" opacity=".9"/>
    <rect x="66" y="136" width="9" height="12" rx="1" opacity=".55"/>
    <rect x="85" y="134" width="8" height="10" rx="1" opacity=".8"/>
    <path d="M64 182 l12 0 l0 28 l-12 0 Z" opacity=".7"/></g>
  <g fill="#4a5a7a" opacity=".22"><ellipse cx="40" cy="200" rx="60" ry="12"/>
    <ellipse cx="110" cy="206" rx="54" ry="10"/></g>
</svg>`;

/* ---------- COMÉDIE ---------- */
A["Comédie"] = ()=>`<svg viewBox="0 0 140 210" preserveAspectRatio="xMidYMid slice">
  <defs><linearGradient id="coF" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#f7c948"/><stop offset=".55" stop-color="#e8913a"/>
    <stop offset="1" stop-color="#c05a2a"/></linearGradient></defs>
  <rect width="140" height="210" fill="url(#coF)"/>
  <g stroke="#fff" stroke-width="7" opacity=".16">
    ${[...Array(9)].map((_,i)=>`<path d="M${-40+i*26} 210 L${20+i*26} 0"/>`).join("")}</g>
  <!-- deux masques -->
  <g transform="translate(46 92)">
    <ellipse cx="0" cy="0" rx="30" ry="36" fill="#fdf3d2"/>
    <path d="M-30 -6 q30 -22 60 0 q-30 -34 -60 0" fill="#e8b84b" opacity=".4"/>
    <path d="M-16 -8 q6 -8 12 0" stroke="#2e1c10" stroke-width="3.4" fill="none" stroke-linecap="round"/>
    <path d="M4 -8 q6 -8 12 0" stroke="#2e1c10" stroke-width="3.4" fill="none" stroke-linecap="round"/>
    <path d="M-16 12 q16 20 32 0 q-16 8 -32 0" fill="#2e1c10"/></g>
  <g transform="translate(96 128)">
    <ellipse cx="0" cy="0" rx="24" ry="29" fill="#c9a8b8" opacity=".9"/>
    <path d="M-12 -8 q5 6 10 0" stroke="#2e1c10" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M2 -8 q5 6 10 0" stroke="#2e1c10" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M-12 16 q12 -16 24 0 q-12 -6 -24 0" fill="#2e1c10"/></g>
  <!-- confettis -->
  <g>${[...Array(16)].map((_,i)=>{const x=6+(i*43)%128,y=8+(i*59)%190;
    const c=["#fff","#a83a5c","#3d9660","#2e5c8a"][i%4];
    return `<rect x="${x}" y="${y}" width="4" height="6" rx="1" fill="${c}" opacity=".6"
      transform="rotate(${i*37} ${x} ${y})"/>`;}).join("")}</g>
</svg>`;

/* ---------- ROMANCE ---------- */
A["Romance"] = ()=>`<svg viewBox="0 0 140 210" preserveAspectRatio="xMidYMid slice">
  <defs><linearGradient id="roF" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#f0c8b0"/><stop offset=".4" stop-color="#d99a92"/>
    <stop offset="1" stop-color="#8c4a58"/></linearGradient></defs>
  <rect width="140" height="210" fill="url(#roF)"/>
  <circle cx="70" cy="66" r="40" fill="#fbe0c8" opacity=".5"/>
  <g fill="#a83a5c" opacity=".3">
    ${[...Array(11)].map((_,i)=>{const x=8+(i*47)%124,y=14+(i*61)%150;
      return `<ellipse cx="${x}" cy="${y}" rx="3.4" ry="2" transform="rotate(${i*33} ${x} ${y})"/>`;
    }).join("")}</g>
  <g fill="#5a2434">
    <path d="M46 210 L46 140 q0 -18 -8 -26 q-6 -7 -2 -18 q4 -12 16 -12 q13 0 16 13
             q2 10 -4 16 q-7 8 -6 22 l0 65 Z"/></g>
  <g fill="#3e1a26">
    <path d="M96 210 L96 142 q0 -18 8 -27 q6 -7 2 -18 q-5 -12 -17 -12 q-13 0 -16 13
             q-2 10 4 17 q7 8 6 22 l0 65 Z"/></g>
  <path d="M70 122 q-3 8 0 14 q3 -6 0 -14" fill="#fbe0c8" opacity=".5"/>
</svg>`;

/* ---------- FILM NOIR ---------- */
A["Film noir"] = ()=>`<svg viewBox="0 0 140 210" preserveAspectRatio="xMidYMid slice">
  <rect width="140" height="210" fill="#12100e"/>
  <!-- store vénitien : bandes de lumière -->
  <g fill="#d8cfae" opacity=".2">
    ${[...Array(9)].map((_,i)=>`<path d="M0 ${16+i*22} L140 ${4+i*22} L140 ${14+i*22} L0 ${26+i*22} Z"/>`).join("")}</g>
  <!-- flaque de lumière au sol -->
  <ellipse cx="70" cy="192" rx="52" ry="16" fill="#d8cfae" opacity=".14"/>
  <!-- silhouette au chapeau -->
  <g fill="#050403">
    <path d="M52 210 L52 122 q0 -12 18 -12 q18 0 18 12 l0 88 Z"/>
    <circle cx="70" cy="96" r="14"/>
    <path d="M48 92 L92 92 L92 87 q-22 -12 -44 0 Z"/>
    <rect x="58" y="74" width="24" height="16" rx="2"/>
    <path d="M88 130 l16 30 l-7 4 l-15 -28 Z"/></g>
  <!-- fumée de cigarette -->
  <path d="M56 108 q-8 -18 2 -30 q6 -10 0 -20" stroke="#d8cfae" stroke-width="1.4"
    fill="none" opacity=".3"/>
  <circle cx="58" cy="106" r="1.6" fill="#e8843a"/>
</svg>`;

/* ---------- WESTERN ---------- */
A["Western"] = ()=>`<svg viewBox="0 0 140 210" preserveAspectRatio="xMidYMid slice">
  <defs><linearGradient id="weF" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#f4b45a"/><stop offset=".38" stop-color="#e07a3a"/>
    <stop offset=".72" stop-color="#a8482e"/><stop offset="1" stop-color="#4a2418"/></linearGradient></defs>
  <rect width="140" height="210" fill="url(#weF)"/>
  <circle cx="70" cy="82" r="34" fill="#ffe08a" opacity=".85"/>
  <!-- mesas -->
  <g fill="#7a3a24" opacity=".9">
    <path d="M0 118 L0 96 L26 96 L26 118 Z"/><path d="M104 122 L104 88 L134 88 L134 122 Z"/></g>
  <path d="M0 130 L140 130 L140 210 L0 210 Z" fill="#8a4a2a"/>
  <path d="M0 152 q34 -12 70 -2 q36 -10 70 2 L140 210 L0 210 Z" fill="#5a2e1c"/>
  <!-- cavalier -->
  <g fill="#1c0e08">
    <path d="M40 168 q10 -12 26 -10 q16 2 22 12 l-4 16 l-42 0 Z"/>
    <path d="M44 184 l-2 20 l6 0 l3 -18 Z M56 186 l-1 18 l6 0 l2 -18 Z
             M74 186 l2 18 l6 0 l-2 -18 Z M84 182 l4 22 l6 0 l-4 -22 Z"/>
    <path d="M86 168 l10 -10 l6 4 l-8 10 Z"/>
    <path d="M60 160 l4 -22 l8 0 l2 22 Z"/>
    <circle cx="67" cy="132" r="7"/>
    <path d="M52 130 L82 130 L82 126 q-15 -8 -30 0 Z"/>
    <rect x="60" y="118" width="14" height="10" rx="2"/></g>
  <!-- buisson -->
  <g fill="#4a2e18"><circle cx="20" cy="182" r="8"/><circle cx="28" cy="186" r="6"/></g>
</svg>`;

/* ---------- MUSICAL ---------- */
A["Musical"] = ()=>`<svg viewBox="0 0 140 210" preserveAspectRatio="xMidYMid slice">
  <defs><linearGradient id="muF" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#8c2f6a"/><stop offset=".5" stop-color="#5a1c4a"/>
    <stop offset="1" stop-color="#1e0a1c"/></linearGradient>
    <radialGradient id="muP" cx=".5" cy="0" r=".8">
      <stop offset="0" stop-color="#ffe08a" stop-opacity=".55"/>
      <stop offset="1" stop-color="#ffe08a" stop-opacity="0"/></radialGradient></defs>
  <rect width="140" height="210" fill="url(#muF)"/>
  <!-- poursuites -->
  <path d="M20 0 L44 0 L86 210 L14 210 Z" fill="url(#muP)"/>
  <path d="M104 0 L124 0 L136 210 L82 210 Z" fill="url(#muP)" opacity=".7"/>
  <!-- rideau haut -->
  <path d="M0 0 L140 0 L140 24 q-35 16 -70 0 q-35 16 -70 0 Z" fill="#7c1424"/>
  <!-- danseurs -->
  <g fill="#140812">
    <g transform="translate(52 150)">
      <circle cx="0" cy="-34" r="8"/>
      <path d="M-7 -26 q7 -4 14 0 l3 22 l-20 0 Z"/>
      <path d="M-7 -22 l-16 -12 l-3 6 l17 14 Z"/><path d="M7 -22 l18 -18 l4 5 l-19 19 Z"/>
      <path d="M-5 -4 l-10 32 l7 2 l9 -30 Z"/><path d="M6 -4 l12 28 l-6 4 l-13 -28 Z"/></g>
    <g transform="translate(94 158)">
      <circle cx="0" cy="-32" r="7"/>
      <path d="M-9 -25 q9 -4 18 0 l-2 12 l-14 0 Z"/>
      <path d="M-9 -13 q9 -3 18 0 l6 20 l-30 0 Z"/>
      <path d="M-8 -22 l-15 8 l3 6 l16 -8 Z"/><path d="M8 -22 l14 -14 l4 5 l-15 15 Z"/>
      <path d="M-6 7 l-6 24 l6 2 l6 -24 Z"/><path d="M6 7 l8 22 l-6 3 l-8 -23 Z"/></g></g>
  <!-- notes -->
  <g fill="#f7dd9a" opacity=".8">
    <g transform="translate(24 56)"><ellipse cx="0" cy="0" rx="5" ry="3.6" transform="rotate(-20)"/>
      <path d="M4 -1 L5 -16 L9 -15" stroke="#f7dd9a" stroke-width="1.8" fill="none"/></g>
    <g transform="translate(114 88) scale(.8)"><ellipse cx="0" cy="0" rx="5" ry="3.6" transform="rotate(-20)"/>
      <path d="M4 -1 L5 -16 L9 -15" stroke="#f7dd9a" stroke-width="2.2" fill="none"/></g></g>
  <path d="M0 194 L140 194 L140 210 L0 210 Z" fill="#0e0510"/>
</svg>`;

/* ---------- FANTASTIQUE ---------- */
A["Fantastique"] = ()=>`<svg viewBox="0 0 140 210" preserveAspectRatio="xMidYMid slice">
  <defs><linearGradient id="faF" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#2a1a5c"/><stop offset=".5" stop-color="#4a2a7a"/>
    <stop offset="1" stop-color="#120a28"/></linearGradient>
    <radialGradient id="faL" cx=".5" cy=".5" r=".5">
      <stop offset="0" stop-color="#a8e8f0" stop-opacity=".9"/>
      <stop offset="1" stop-color="#a8e8f0" stop-opacity="0"/></radialGradient></defs>
  <rect width="140" height="210" fill="url(#faF)"/>
  <g fill="#fff">${[...Array(30)].map((_,i)=>{const x=(i*53)%140,y=(i*37)%150;
    return `<circle cx="${x}" cy="${y}" r="${.7+(i%3)*.5}" opacity="${.3+(i%4)*.17}"/>`;}).join("")}</g>
  <!-- planète -->
  <circle cx="104" cy="44" r="22" fill="#7a5ab8" opacity=".8"/>
  <ellipse cx="104" cy="44" rx="34" ry="7" fill="none" stroke="#c8a8e8" stroke-width="2.4" opacity=".7"/>
  <!-- portail lumineux -->
  <ellipse cx="60" cy="118" rx="30" ry="42" fill="url(#faL)"/>
  <ellipse cx="60" cy="118" rx="24" ry="36" fill="none" stroke="#d8f4fa" stroke-width="2" opacity=".8"/>
  <!-- silhouette qui entre -->
  <g fill="#0a0618"><circle cx="60" cy="126" r="8"/>
    <path d="M52 134 q8 -4 16 0 l4 34 l-24 0 Z"/>
    <path d="M52 138 l-12 16 l4 4 l12 -14 Z"/><path d="M68 138 l12 16 l-4 4 l-12 -14 Z"/></g>
  <!-- rochers flottants -->
  <g fill="#2a1a4a"><path d="M14 150 l16 -6 l6 8 l-14 8 Z"/>
    <path d="M110 140 l14 -5 l5 7 l-13 6 Z"/></g>
  <path d="M0 178 q30 -14 62 -4 q34 -12 78 4 L140 210 L0 210 Z" fill="#0c0620"/>
</svg>`;

/* ---------- CULTE ---------- */
A["Culte"] = ()=>`<svg viewBox="0 0 140 210" preserveAspectRatio="xMidYMid slice">
  <rect width="140" height="210" fill="#141210"/>
  <!-- amorce de pellicule -->
  <circle cx="70" cy="92" r="56" fill="none" stroke="#8a7c60" stroke-width="1.6" opacity=".5"/>
  <circle cx="70" cy="92" r="38" fill="none" stroke="#8a7c60" stroke-width="1.2" opacity=".4"/>
  <path d="M70 36 L70 148 M14 92 L126 92" stroke="#8a7c60" stroke-width="1.2" opacity=".4"/>
  <path d="M70 92 L70 36 A56 56 0 0 1 126 92 Z" fill="#e8dcc4" opacity=".12"/>
  <text x="70" y="112" text-anchor="middle" font-family="Georgia" font-size="52"
    fill="#e8dcc4" opacity=".8">3</text>
  <!-- perforations latérales -->
  <g fill="#2a2620">${[...Array(9)].map((_,i)=>
    `<rect x="4" y="${8+i*23}" width="9" height="13" rx="2"/>
     <rect x="127" y="${8+i*23}" width="9" height="13" rx="2"/>`).join("")}</g>
  <g fill="#c9982f" opacity=".9">
    <path d="M70 168 l4.4 9 l10 1.4 l-7.2 7 l1.7 9.8 L70 190.4 l-8.9 3.8 l1.7 -9.8 l-7.2 -7 l10 -1.4 Z"/></g>
</svg>`;

function afficheDeGenre(g){ return (A[g] || A["Drame"])(); }
const GENRES_AFFICHES = Object.keys(A);

/* le genre d'un film, avec repli sur le Drame pour un genre inconnu */
function genreConnu(g){ return A[g] ? g : "Drame"; }


/* ============================================================
   UNE AFFICHE PAR FILM

   Il y avait douze affiches pour cinquante-trois films : une par
   genre. Petit Poulpe, Bulles et Monsieur Hibou montraient le même
   dessin — impossible de reconnaître un film à son affiche.

   Chaque film a maintenant SON motif, tiré de son titre, posé sur
   une palette de son genre. Trois palettes par genre, choisie
   d'après l'identifiant : toujours la même pour un film donné.

   afficheDeGenre reste là : elle sert de repli quand on n'a que le
   genre sous la main.
   ============================================================ */

const MOTIF_GENRE = {
  "Drame":"fenetre", "Aventure":"ile", "Animation":"bulles", "Documentaire":"marche",
  "Thriller familial":"escalier", "Comédie":"casserole", "Romance":"lettres",
  "Film noir":"reverbere", "Western":"desert", "Musical":"cabaret",
  "Fantastique":"tour", "Culte":"planete"
};

const MOTIF_FILM = {"film_001": "comete", "film_002": "phare", "film_003": "vague", "film_004": "montgolfiere", "film_005": "poulpe", "film_006": "usineNuages", "film_007": "calanque", "film_008": "marche", "film_009": "escalier", "film_010": "grenier", "film_011": "montagneNeige", "film_012": "balcon", "film_013": "kiosque", "film_014": "reverbere", "film_015": "desert", "film_016": "fanfare", "film_017": "tour", "film_018": "planete", "film_019": "vent", "film_020": "fenetre", "film_021": "porte", "film_022": "table", "film_023": "ile", "film_024": "route", "film_025": "coffre", "film_026": "montagne", "film_027": "renard", "film_028": "bulles", "film_029": "oiseaux", "film_030": "hibou", "film_031": "port", "film_032": "outils", "film_033": "vent", "film_034": "maison", "film_035": "horloge", "film_036": "plancher", "film_037": "bateau", "film_038": "voiture", "film_039": "cartons", "film_040": "casserole", "film_041": "pins", "film_042": "lettres", "film_043": "plage", "film_044": "quai", "film_045": "revolver", "film_046": "canyon", "film_047": "diligence", "film_048": "cabaret", "film_049": "chorale", "film_050": "sousMarin", "film_051": "horlogeArret", "film_052": "moto", "film_053": "tente"};

/* le dessin de chaque motif : %0 le ciel, %1 le sol, %2 l'encre */
const MOTIFS = {"comete": "<circle cx=\"44\" cy=\"50\" r=\"4\" fill=\"%2\" opacity=\".85\"/><path d=\"M44 50 L12 28\" stroke=\"%2\" stroke-width=\"2.6\" stroke-linecap=\"round\" opacity=\".5\"/><circle cx=\"98\" cy=\"32\" r=\"2\" fill=\"%2\" opacity=\".6\"/><circle cx=\"114\" cy=\"64\" r=\"1.6\" fill=\"%2\" opacity=\".5\"/><circle cx=\"30\" cy=\"76\" r=\"1.4\" fill=\"%2\" opacity=\".45\"/><path d=\"M0 152 Q35 130 70 152 Q105 174 140 152 L140 210 L0 210 Z\" fill=\"%1\"/>", "phare": "<path d=\"M0 160 Q35 148 70 160 Q105 172 140 160 L140 210 L0 210 Z\" fill=\"%1\"/><path d=\"M79 60 L140 34 L140 84 Z\" fill=\"%2\" opacity=\".26\"/><path d=\"M61 60 L0 34 L0 84 Z\" fill=\"%2\" opacity=\".16\"/><path d=\"M60 160 L64 64 L76 64 L80 160 Z\" fill=\"%2\" opacity=\".92\"/><rect x=\"60\" y=\"52\" width=\"20\" height=\"13\" rx=\"2.5\" fill=\"%2\"/>", "vague": "<path d=\"M0 98 Q28 76 56 98 Q84 120 112 98 Q126 87 140 94 L140 210 L0 210 Z\" fill=\"%1\" opacity=\".8\"/><path d=\"M0 128 Q30 108 60 128 Q90 148 120 128 Q132 120 140 124 L140 210 L0 210 Z\" fill=\"%1\"/><path d=\"M50 88 L70 62 L90 88 Z\" fill=\"%2\" opacity=\".75\"/><path d=\"M70 62 L70 88\" stroke=\"%1\" stroke-width=\"2\"/>", "montgolfiere": "<circle cx=\"70\" cy=\"72\" r=\"29\" fill=\"%2\" opacity=\".88\"/><path d=\"M43 86 Q70 120 97 86 Z\" fill=\"%2\" opacity=\".5\"/><rect x=\"62\" y=\"114\" width=\"16\" height=\"13\" rx=\"2.5\" fill=\"%1\"/><path d=\"M57 94 L64 114M83 94 L76 114\" stroke=\"%1\" stroke-width=\"1.6\"/><path d=\"M0 170 Q40 158 80 170 Q110 179 140 172 L140 210 L0 210 Z\" fill=\"%1\"/>", "poulpe": "<g stroke=\"%2\" stroke-width=\"7\" stroke-linecap=\"round\" fill=\"none\" opacity=\".9\"><path d=\"M50 102 q-13 20 -5 36\"/><path d=\"M60 106 q-7 24 1 38\"/><path d=\"M80 106 q7 24 -1 38\"/><path d=\"M90 102 q13 20 5 36\"/></g><ellipse cx=\"70\" cy=\"80\" rx=\"27\" ry=\"25\" fill=\"%2\"/><circle cx=\"60\" cy=\"76\" r=\"4\" fill=\"%1\"/><circle cx=\"80\" cy=\"76\" r=\"4\" fill=\"%1\"/><path d=\"M62 90 q8 6 16 0\" stroke=\"%1\" stroke-width=\"2.4\" fill=\"none\" stroke-linecap=\"round\"/>", "usineNuages": "<g fill=\"%2\" opacity=\".9\"><circle cx=\"50\" cy=\"70\" r=\"15\"/><circle cx=\"70\" cy=\"58\" r=\"19\"/><circle cx=\"91\" cy=\"68\" r=\"16\"/><ellipse cx=\"70\" cy=\"78\" rx=\"26\" ry=\"13\"/></g><rect x=\"34\" y=\"122\" width=\"72\" height=\"60\" fill=\"%1\"/><rect x=\"46\" y=\"98\" width=\"12\" height=\"26\" fill=\"%1\"/><rect x=\"82\" y=\"98\" width=\"12\" height=\"26\" fill=\"%1\"/><rect x=\"0\" y=\"182\" width=\"140\" height=\"28\" fill=\"%1\"/>", "calanque": "<circle cx=\"70\" cy=\"50\" r=\"12\" fill=\"%2\" opacity=\".85\"/><path d=\"M0 210 L0 94 Q22 62 44 94 L44 210 Z\" fill=\"%1\"/><path d=\"M140 210 L140 82 Q116 52 92 82 L92 210 Z\" fill=\"%1\"/><path d=\"M44 152 Q70 140 92 152 L92 210 L44 210 Z\" fill=\"%2\" opacity=\".4\"/>", "marche": "<g fill=\"%2\" opacity=\".9\"><path d=\"M12 88 L54 88 L48 102 L18 102 Z\"/><path d=\"M60 88 L102 88 L96 102 L66 102 Z\"/><path d=\"M108 88 L140 88 L136 102 L114 102 Z\"/></g><g stroke=\"%2\" stroke-width=\"2.2\" opacity=\".65\"><path d=\"M22 102 v36M46 102 v36M68 102 v36M94 102 v36M118 102 v36\"/></g><g fill=\"%2\" opacity=\".5\"><circle cx=\"30\" cy=\"126\" r=\"5\"/><circle cx=\"42\" cy=\"129\" r=\"4\"/><circle cx=\"78\" cy=\"126\" r=\"5\"/><circle cx=\"122\" cy=\"128\" r=\"4.4\"/></g><rect x=\"0\" y=\"148\" width=\"140\" height=\"62\" fill=\"%1\"/>", "escalier": "<g fill=\"%1\"><rect x=\"16\" y=\"72\" width=\"21\" height=\"138\"/><rect x=\"37\" y=\"94\" width=\"21\" height=\"116\"/><rect x=\"58\" y=\"116\" width=\"21\" height=\"94\"/><rect x=\"79\" y=\"138\" width=\"21\" height=\"72\"/><rect x=\"100\" y=\"160\" width=\"24\" height=\"50\"/></g><g fill=\"%2\" opacity=\".28\"><rect x=\"16\" y=\"72\" width=\"21\" height=\"5\"/><rect x=\"37\" y=\"94\" width=\"21\" height=\"5\"/><rect x=\"58\" y=\"116\" width=\"21\" height=\"5\"/><rect x=\"79\" y=\"138\" width=\"21\" height=\"5\"/><rect x=\"100\" y=\"160\" width=\"24\" height=\"5\"/></g><circle cx=\"118\" cy=\"46\" r=\"9\" fill=\"%2\" opacity=\".5\"/>", "grenier": "<path d=\"M18 120 L70 62 L122 120 Z\" fill=\"%1\"/><rect x=\"30\" y=\"120\" width=\"80\" height=\"66\" fill=\"%1\"/><rect x=\"58\" y=\"92\" width=\"24\" height=\"24\" rx=\"2\" fill=\"%2\" opacity=\".8\"/><path d=\"M70 92 v24M58 104 h24\" stroke=\"%1\" stroke-width=\"2\"/><rect x=\"0\" y=\"186\" width=\"140\" height=\"24\" fill=\"%1\"/>", "montagneNeige": "<path d=\"M0 210 L44 96 L74 148 L96 112 L140 210 Z\" fill=\"%1\"/><path d=\"M44 96 L58 122 L30 122 Z\" fill=\"%2\" opacity=\".9\"/><path d=\"M96 112 L108 136 L84 136 Z\" fill=\"%2\" opacity=\".75\"/><circle cx=\"112\" cy=\"46\" r=\"10\" fill=\"%2\" opacity=\".7\"/>", "balcon": "<rect x=\"0\" y=\"0\" width=\"140\" height=\"210\" fill=\"%1\" opacity=\".25\"/><rect x=\"26\" y=\"42\" width=\"88\" height=\"96\" rx=\"3\" fill=\"%2\" opacity=\".22\"/><g stroke=\"%2\" stroke-width=\"2.6\" opacity=\".85\"><path d=\"M22 138 h96\"/><path d=\"M22 138 v34M118 138 v34M22 172 h96\"/><path d=\"M40 138 v34M58 138 v34M76 138 v34M100 138 v34\"/></g><circle cx=\"70\" cy=\"86\" r=\"15\" fill=\"%2\" opacity=\".5\"/>", "kiosque": "<path d=\"M28 90 L70 58 L112 90 Z\" fill=\"%2\" opacity=\".9\"/><rect x=\"36\" y=\"90\" width=\"68\" height=\"60\" fill=\"%1\"/><rect x=\"46\" y=\"102\" width=\"48\" height=\"30\" rx=\"2\" fill=\"%2\" opacity=\".55\"/><g stroke=\"%2\" stroke-width=\"1.6\" opacity=\".6\"><path d=\"M46 112 h48M46 122 h36\"/></g><rect x=\"0\" y=\"150\" width=\"140\" height=\"60\" fill=\"%1\"/>", "reverbere": "<rect x=\"0\" y=\"0\" width=\"140\" height=\"210\" fill=\"%1\" opacity=\".2\"/><g stroke=\"%2\" stroke-width=\"1.4\" opacity=\".35\"><path d=\"M20 0 L14 210M50 0 L46 210M92 0 L96 210M122 0 L128 210\"/></g><rect x=\"66\" y=\"70\" width=\"5\" height=\"118\" fill=\"%1\"/><path d=\"M68 70 q0 -14 -16 -14\" stroke=\"%1\" stroke-width=\"4.5\" fill=\"none\"/><path d=\"M44 44 l16 0 l4 14 l-24 0 Z\" fill=\"%1\"/><circle cx=\"52\" cy=\"60\" r=\"26\" fill=\"%2\" opacity=\".22\"/><circle cx=\"52\" cy=\"58\" r=\"4\" fill=\"%2\"/>", "desert": "<circle cx=\"70\" cy=\"62\" r=\"24\" fill=\"%2\" opacity=\".85\"/><path d=\"M0 210 L0 148 Q40 128 78 150 Q110 168 140 152 L140 210 Z\" fill=\"%1\"/><g fill=\"%1\"><rect x=\"24\" y=\"112\" width=\"8\" height=\"42\" rx=\"3\"/><rect x=\"12\" y=\"126\" width=\"8\" height=\"20\" rx=\"3\"/><rect x=\"34\" y=\"122\" width=\"8\" height=\"24\" rx=\"3\"/></g>", "fanfare": "<circle cx=\"70\" cy=\"96\" r=\"34\" fill=\"none\" stroke=\"%2\" stroke-width=\"4\" opacity=\".85\"/><path d=\"M70 96 L70 46 q22 0 22 16\" stroke=\"%2\" stroke-width=\"5\" fill=\"none\" stroke-linecap=\"round\"/><circle cx=\"98\" cy=\"66\" r=\"8\" fill=\"%2\"/><g fill=\"%2\" opacity=\".55\"><circle cx=\"30\" cy=\"52\" r=\"4\"/><circle cx=\"112\" cy=\"120\" r=\"3.4\"/><circle cx=\"24\" cy=\"132\" r=\"3\"/></g><rect x=\"0\" y=\"176\" width=\"140\" height=\"34\" fill=\"%1\"/>", "tour": "<path d=\"M52 210 L58 40 L82 40 L88 210 Z\" fill=\"%1\"/><g fill=\"%2\" opacity=\".55\"><rect x=\"62\" y=\"60\" width=\"7\" height=\"12\"/><rect x=\"72\" y=\"60\" width=\"7\" height=\"12\"/><rect x=\"62\" y=\"90\" width=\"7\" height=\"12\"/><rect x=\"72\" y=\"90\" width=\"7\" height=\"12\"/><rect x=\"63\" y=\"122\" width=\"7\" height=\"12\"/><rect x=\"72\" y=\"122\" width=\"7\" height=\"12\"/></g><path d=\"M56 40 L70 18 L84 40 Z\" fill=\"%2\" opacity=\".85\"/><g fill=\"%2\" opacity=\".3\"><circle cx=\"24\" cy=\"66\" r=\"12\"/><circle cx=\"116\" cy=\"98\" r=\"14\"/></g>", "planete": "<circle cx=\"70\" cy=\"86\" r=\"34\" fill=\"%2\" opacity=\".85\"/><ellipse cx=\"70\" cy=\"86\" rx=\"56\" ry=\"13\" fill=\"none\" stroke=\"%2\" stroke-width=\"4\" opacity=\".6\"/><circle cx=\"58\" cy=\"76\" r=\"7\" fill=\"%1\" opacity=\".4\"/><circle cx=\"84\" cy=\"98\" r=\"5\" fill=\"%1\" opacity=\".35\"/><g fill=\"%2\" opacity=\".55\"><circle cx=\"20\" cy=\"34\" r=\"2\"/><circle cx=\"118\" cy=\"44\" r=\"1.6\"/><circle cx=\"106\" cy=\"160\" r=\"2\"/></g>", "vent": "<g stroke=\"%2\" stroke-width=\"3\" stroke-linecap=\"round\" fill=\"none\" opacity=\".7\"><path d=\"M10 70 h64 q14 0 14 -10 t-14 -10\"/><path d=\"M16 96 h82 q14 0 14 10 t-14 10\"/><path d=\"M22 124 h52 q12 0 12 -9 t-12 -9\"/></g><path d=\"M0 168 Q38 154 76 168 Q108 180 140 168 L140 210 L0 210 Z\" fill=\"%1\"/>", "fenetre": "<rect x=\"34\" y=\"40\" width=\"72\" height=\"106\" rx=\"3\" fill=\"%1\"/><rect x=\"40\" y=\"46\" width=\"60\" height=\"94\" fill=\"%2\" opacity=\".3\"/><path d=\"M70 46 v94M40 93 h60\" stroke=\"%1\" stroke-width=\"4\"/><circle cx=\"86\" cy=\"70\" r=\"9\" fill=\"%2\" opacity=\".6\"/><rect x=\"26\" y=\"146\" width=\"88\" height=\"7\" rx=\"2\" fill=\"%1\"/><rect x=\"0\" y=\"182\" width=\"140\" height=\"28\" fill=\"%1\"/>", "porte": "<rect x=\"44\" y=\"46\" width=\"52\" height=\"140\" rx=\"3\" fill=\"%1\"/><rect x=\"50\" y=\"52\" width=\"40\" height=\"128\" fill=\"%2\" opacity=\".18\"/><circle cx=\"84\" cy=\"120\" r=\"3.6\" fill=\"%2\" opacity=\".8\"/><path d=\"M96 46 L112 46 L112 186 L96 186\" fill=\"%2\" opacity=\".12\"/><rect x=\"0\" y=\"186\" width=\"140\" height=\"24\" fill=\"%1\"/>", "table": "<rect x=\"20\" y=\"118\" width=\"100\" height=\"7\" rx=\"3\" fill=\"%1\"/><g fill=\"%1\"><rect x=\"30\" y=\"125\" width=\"7\" height=\"52\"/><rect x=\"103\" y=\"125\" width=\"7\" height=\"52\"/></g><g fill=\"%2\" opacity=\".7\"><circle cx=\"52\" cy=\"110\" r=\"9\"/><circle cx=\"76\" cy=\"112\" r=\"7\"/><rect x=\"90\" y=\"100\" width=\"6\" height=\"18\" rx=\"2\"/></g><circle cx=\"70\" cy=\"52\" r=\"14\" fill=\"%2\" opacity=\".35\"/>", "ile": "<path d=\"M0 156 Q26 146 52 156 Q78 166 104 156 Q122 149 140 154 L140 210 L0 210 Z\" fill=\"%1\"/><path d=\"M40 156 Q70 122 100 156 Z\" fill=\"%1\"/><g fill=\"%2\" opacity=\".85\"><rect x=\"67\" y=\"112\" width=\"5\" height=\"26\" rx=\"2\"/><path d=\"M69 112 q-16 -5 -20 6 q14 -3 20 3\"/><path d=\"M71 112 q16 -5 20 6 q-14 -3 -20 3\"/></g><circle cx=\"112\" cy=\"52\" r=\"11\" fill=\"%2\" opacity=\".7\"/>", "route": "<path d=\"M56 210 L64 76 L78 76 L92 210 Z\" fill=\"%2\" opacity=\".6\"/><g fill=\"%1\"><path d=\"M66 190 h10 v14 h-10 Z\"/><path d=\"M67 160 h9 v12 h-9 Z\"/><path d=\"M68 134 h8 v10 h-8 Z\"/><path d=\"M69 112 h7 v9 h-7 Z\"/></g><path d=\"M0 210 L0 76 Q34 64 70 76 Q106 88 140 76 L140 210 Z\" fill=\"%1\" opacity=\".35\"/><circle cx=\"106\" cy=\"46\" r=\"13\" fill=\"%2\" opacity=\".7\"/>", "coffre": "<path d=\"M34 104 q36 -26 72 0 L106 116 L34 116 Z\" fill=\"%1\"/><rect x=\"34\" y=\"116\" width=\"72\" height=\"52\" rx=\"3\" fill=\"%1\"/><rect x=\"62\" y=\"108\" width=\"16\" height=\"26\" rx=\"2\" fill=\"%2\" opacity=\".85\"/><circle cx=\"70\" cy=\"132\" r=\"4\" fill=\"%1\"/><g fill=\"%2\" opacity=\".7\"><circle cx=\"46\" cy=\"88\" r=\"3.4\"/><circle cx=\"94\" cy=\"84\" r=\"4\"/><circle cx=\"70\" cy=\"76\" r=\"3\"/></g><rect x=\"0\" y=\"168\" width=\"140\" height=\"42\" fill=\"%1\"/>", "montagne": "<path d=\"M0 210 L38 104 L64 152 L88 116 L140 210 Z\" fill=\"%1\"/><path d=\"M38 104 L50 128 L26 128 Z\" fill=\"%2\" opacity=\".85\"/><g fill=\"%2\" opacity=\".35\"><circle cx=\"106\" cy=\"54\" r=\"10\"/></g>", "renard": "<path d=\"M52 132 q18 -34 36 0 Z\" fill=\"%2\"/><path d=\"M52 132 L44 100 L62 114 Z\" fill=\"%2\"/><path d=\"M88 132 L96 100 L78 114 Z\" fill=\"%2\"/><circle cx=\"62\" cy=\"122\" r=\"3\" fill=\"%1\"/><circle cx=\"78\" cy=\"122\" r=\"3\" fill=\"%1\"/><path d=\"M66 132 q4 4 8 0\" stroke=\"%1\" stroke-width=\"2\" fill=\"none\"/><g fill=\"%2\" opacity=\".7\"><path d=\"M28 50 l3 7 7 1 -5 5 1 7 -6 -3 -6 3 1 -7 -5 -5 7 -1 Z\"/><path d=\"M108 40 l2.4 5.6 5.6 .8 -4 4 1 5.6 -5 -2.4 -5 2.4 1 -5.6 -4 -4 5.6 -.8 Z\"/><circle cx=\"94\" cy=\"72\" r=\"2.4\"/><circle cx=\"40\" cy=\"84\" r=\"2\"/></g>", "bulles": "<g fill=\"none\" stroke=\"%2\" stroke-width=\"2.4\" opacity=\".85\"><circle cx=\"52\" cy=\"88\" r=\"24\"/><circle cx=\"92\" cy=\"62\" r=\"15\"/><circle cx=\"96\" cy=\"112\" r=\"19\"/><circle cx=\"40\" cy=\"140\" r=\"11\"/></g><g fill=\"%2\" opacity=\".28\"><circle cx=\"52\" cy=\"88\" r=\"24\"/><circle cx=\"96\" cy=\"112\" r=\"19\"/></g><circle cx=\"45\" cy=\"80\" r=\"5\" fill=\"%2\" opacity=\".7\"/><rect x=\"0\" y=\"176\" width=\"140\" height=\"34\" fill=\"%1\"/>", "oiseaux": "<g stroke=\"%2\" stroke-width=\"3\" fill=\"none\" stroke-linecap=\"round\" opacity=\".9\"><path d=\"M24 62 q9 -9 18 0 q9 -9 18 0\"/><path d=\"M62 42 q7 -7 14 0 q7 -7 14 0\"/><path d=\"M92 74 q8 -8 16 0 q8 -8 16 0\"/><path d=\"M34 104 q6 -6 12 0 q6 -6 12 0\"/><path d=\"M76 116 q5 -5 10 0 q5 -5 10 0\"/></g><path d=\"M0 164 Q36 150 72 164 Q106 176 140 164 L140 210 L0 210 Z\" fill=\"%1\"/>", "hibou": "<ellipse cx=\"70\" cy=\"104\" rx=\"32\" ry=\"38\" fill=\"%2\"/><path d=\"M44 76 L52 54 L62 74 Z\" fill=\"%2\"/><path d=\"M96 76 L88 54 L78 74 Z\" fill=\"%2\"/><circle cx=\"58\" cy=\"96\" r=\"11\" fill=\"%1\"/><circle cx=\"82\" cy=\"96\" r=\"11\" fill=\"%1\"/><circle cx=\"58\" cy=\"96\" r=\"4.5\" fill=\"%2\"/><circle cx=\"82\" cy=\"96\" r=\"4.5\" fill=\"%2\"/><path d=\"M70 108 l-6 8 h12 Z\" fill=\"%1\"/><rect x=\"52\" y=\"142\" width=\"36\" height=\"6\" rx=\"3\" fill=\"%1\"/>", "port": "<path d=\"M0 150 L140 150 L140 210 L0 210 Z\" fill=\"%1\"/><g fill=\"%2\" opacity=\".85\"><path d=\"M40 150 L48 96 L54 96 L62 150 Z\"/><path d=\"M84 150 L90 108 L96 108 L102 150 Z\"/></g><g stroke=\"%2\" stroke-width=\"1.6\" opacity=\".6\"><path d=\"M51 96 v-32M93 108 v-24\"/></g><path d=\"M24 150 q46 -20 92 0\" stroke=\"%2\" stroke-width=\"2.6\" fill=\"none\" opacity=\".5\"/><circle cx=\"112\" cy=\"52\" r=\"11\" fill=\"%2\" opacity=\".6\"/>", "outils": "<g stroke=\"%2\" stroke-width=\"7\" stroke-linecap=\"round\" opacity=\".9\"><path d=\"M40 148 L86 74\"/><path d=\"M96 148 L64 96\"/></g><circle cx=\"90\" cy=\"66\" r=\"13\" fill=\"none\" stroke=\"%2\" stroke-width=\"7\"/><rect x=\"52\" y=\"84\" width=\"18\" height=\"18\" rx=\"3\" fill=\"%2\" transform=\"rotate(38 61 93)\"/><rect x=\"0\" y=\"164\" width=\"140\" height=\"46\" fill=\"%1\"/>", "maison": "<path d=\"M22 116 L70 66 L118 116 Z\" fill=\"%2\" opacity=\".9\"/><rect x=\"34\" y=\"116\" width=\"72\" height=\"72\" fill=\"%1\"/><rect x=\"60\" y=\"146\" width=\"22\" height=\"42\" rx=\"2\" fill=\"%2\" opacity=\".55\"/><rect x=\"42\" y=\"128\" width=\"14\" height=\"14\" rx=\"2\" fill=\"%2\" opacity=\".45\"/><rect x=\"88\" y=\"128\" width=\"14\" height=\"14\" rx=\"2\" fill=\"%2\" opacity=\".45\"/><rect x=\"0\" y=\"188\" width=\"140\" height=\"22\" fill=\"%1\"/>", "horloge": "<circle cx=\"70\" cy=\"98\" r=\"42\" fill=\"none\" stroke=\"%2\" stroke-width=\"5\"/><circle cx=\"70\" cy=\"98\" r=\"34\" fill=\"%1\" opacity=\".35\"/><g stroke=\"%2\" stroke-width=\"4.5\" stroke-linecap=\"round\"><path d=\"M70 98 L70 72\"/><path d=\"M70 98 L92 108\"/></g><circle cx=\"70\" cy=\"98\" r=\"4\" fill=\"%2\"/><g fill=\"%2\" opacity=\".6\"><rect x=\"68\" y=\"52\" width=\"4\" height=\"7\"/><rect x=\"68\" y=\"137\" width=\"4\" height=\"7\"/></g>", "plancher": "<g stroke=\"%2\" stroke-width=\"2\" opacity=\".45\"><path d=\"M0 96 h140M0 124 h140M0 152 h140M0 180 h140\"/><path d=\"M30 96 v112M74 96 v112M110 96 v112\"/></g><rect x=\"0\" y=\"96\" width=\"140\" height=\"114\" fill=\"%1\" opacity=\".3\"/><circle cx=\"70\" cy=\"52\" r=\"10\" fill=\"%2\" opacity=\".5\"/><path d=\"M56 68 q14 10 28 0\" stroke=\"%2\" stroke-width=\"2\" fill=\"none\" opacity=\".4\"/>", "bateau": "<path d=\"M28 142 L112 142 L98 166 L42 166 Z\" fill=\"%1\"/><path d=\"M68 142 L68 66 L102 112 L68 112\" fill=\"%2\" opacity=\".85\"/><rect x=\"65\" y=\"60\" width=\"5\" height=\"84\" fill=\"%1\"/><path d=\"M0 166 Q34 156 68 166 Q102 176 140 166 L140 210 L0 210 Z\" fill=\"%1\"/><circle cx=\"24\" cy=\"48\" r=\"9\" fill=\"%2\" opacity=\".5\"/>", "voiture": "<path d=\"M26 130 L38 104 L100 104 L114 130 Z\" fill=\"%2\" opacity=\".9\"/><rect x=\"20\" y=\"130\" width=\"100\" height=\"26\" rx=\"7\" fill=\"%1\"/><circle cx=\"44\" cy=\"158\" r=\"12\" fill=\"%1\"/><circle cx=\"44\" cy=\"158\" r=\"5\" fill=\"%2\" opacity=\".6\"/><circle cx=\"98\" cy=\"158\" r=\"12\" fill=\"%1\"/><circle cx=\"98\" cy=\"158\" r=\"5\" fill=\"%2\" opacity=\".6\"/><rect x=\"0\" y=\"172\" width=\"140\" height=\"38\" fill=\"%1\"/>", "cartons": "<g fill=\"%1\"><rect x=\"24\" y=\"118\" width=\"46\" height=\"42\"/><rect x=\"74\" y=\"102\" width=\"42\" height=\"58\"/><rect x=\"46\" y=\"76\" width=\"38\" height=\"42\"/></g><g stroke=\"%2\" stroke-width=\"2.4\" opacity=\".65\"><path d=\"M24 132 h46M74 118 h42M46 90 h38\"/><path d=\"M47 118 v42M95 102 v58M65 76 v42\"/></g><rect x=\"0\" y=\"160\" width=\"140\" height=\"50\" fill=\"%1\"/>", "casserole": "<g fill=\"%2\" opacity=\".55\"><path d=\"M52 76 q-8 -14 4 -24 q-6 16 6 24\"/><path d=\"M70 70 q-9 -16 4 -28 q-7 18 6 28\"/><path d=\"M88 76 q-8 -14 4 -24 q-6 16 6 24\"/></g><path d=\"M38 96 L102 96 L96 142 L44 142 Z\" fill=\"%1\"/><rect x=\"34\" y=\"90\" width=\"72\" height=\"8\" rx=\"4\" fill=\"%1\"/><rect x=\"102\" y=\"92\" width=\"30\" height=\"6\" rx=\"3\" fill=\"%1\"/><rect x=\"0\" y=\"150\" width=\"140\" height=\"60\" fill=\"%1\"/>", "pins": "<g fill=\"%1\"><path d=\"M34 150 L34 120 Q16 118 22 106 Q34 96 46 106 Q52 118 34 120\"/><rect x=\"31\" y=\"140\" width=\"6\" height=\"24\"/><path d=\"M100 158 L100 116 Q76 112 84 96 Q100 82 116 96 Q124 112 100 116\"/><rect x=\"97\" y=\"146\" width=\"7\" height=\"24\"/></g><g fill=\"%2\" opacity=\".75\"><rect x=\"52\" y=\"128\" width=\"34\" height=\"26\" rx=\"3\"/><rect x=\"58\" y=\"118\" width=\"22\" height=\"12\" rx=\"2\"/></g><rect x=\"0\" y=\"164\" width=\"140\" height=\"46\" fill=\"%1\"/>", "lettres": "<g fill=\"%2\" opacity=\".9\"><rect x=\"28\" y=\"86\" width=\"58\" height=\"40\" rx=\"2\" transform=\"rotate(-9 57 106)\"/><rect x=\"54\" y=\"106\" width=\"58\" height=\"40\" rx=\"2\" transform=\"rotate(7 83 126)\"/></g><g stroke=\"%1\" stroke-width=\"2\" fill=\"none\" opacity=\".8\"><path d=\"M28 88 L57 110 L86 88\" transform=\"rotate(-9 57 106)\"/><path d=\"M54 108 L83 130 L112 108\" transform=\"rotate(7 83 126)\"/></g><rect x=\"0\" y=\"164\" width=\"140\" height=\"46\" fill=\"%1\"/>", "plage": "<circle cx=\"102\" cy=\"54\" r=\"20\" fill=\"%2\" opacity=\".8\"/><path d=\"M0 132 Q34 122 68 132 Q102 142 140 132 L140 168 L0 168 Z\" fill=\"%1\" opacity=\".6\"/><path d=\"M0 168 Q34 160 68 168 Q102 176 140 168 L140 210 L0 210 Z\" fill=\"%1\"/><g fill=\"%2\" opacity=\".7\"><rect x=\"34\" y=\"124\" width=\"4\" height=\"34\" rx=\"2\"/><path d=\"M36 124 q-20 -6 -24 6 q16 -4 24 2\"/><path d=\"M36 124 q20 -6 24 6 q-16 -4 -24 2\"/></g>", "quai": "<rect x=\"0\" y=\"0\" width=\"140\" height=\"210\" fill=\"%1\" opacity=\".2\"/><path d=\"M0 146 L140 146 L140 210 L0 210 Z\" fill=\"%1\"/><g fill=\"%2\" opacity=\".5\"><rect x=\"16\" y=\"146\" width=\"7\" height=\"30\"/><rect x=\"52\" y=\"146\" width=\"7\" height=\"30\"/><rect x=\"90\" y=\"146\" width=\"7\" height=\"30\"/></g><rect x=\"106\" y=\"76\" width=\"5\" height=\"70\" fill=\"%1\"/><path d=\"M108 76 q0 -12 -14 -12\" stroke=\"%1\" stroke-width=\"4\" fill=\"none\"/><circle cx=\"94\" cy=\"66\" r=\"20\" fill=\"%2\" opacity=\".2\"/><circle cx=\"94\" cy=\"64\" r=\"3.4\" fill=\"%2\"/><g stroke=\"%2\" stroke-width=\"1.6\" opacity=\".35\"><path d=\"M0 178 h140M0 190 h140\"/></g>", "revolver": "<g fill=\"%2\" opacity=\".9\"><rect x=\"30\" y=\"94\" width=\"70\" height=\"15\" rx=\"3\"/><circle cx=\"70\" cy=\"102\" r=\"15\"/><path d=\"M62 109 L58 142 L74 142 L78 116 Z\"/><rect x=\"94\" y=\"97\" width=\"26\" height=\"8\" rx=\"3\"/></g><circle cx=\"70\" cy=\"102\" r=\"6\" fill=\"%1\"/><g fill=\"%2\" opacity=\".45\"><circle cx=\"26\" cy=\"150\" r=\"4\"/><circle cx=\"40\" cy=\"158\" r=\"3.4\"/><circle cx=\"54\" cy=\"152\" r=\"3\"/></g>", "canyon": "<circle cx=\"70\" cy=\"60\" r=\"18\" fill=\"%2\" opacity=\".8\"/><path d=\"M0 210 L0 84 L30 84 L38 130 L52 106 L52 210 Z\" fill=\"%1\"/><path d=\"M140 210 L140 72 L108 72 L98 122 L86 98 L86 210 Z\" fill=\"%1\"/><path d=\"M52 176 L86 176 L86 210 L52 210 Z\" fill=\"%1\" opacity=\".4\"/>", "diligence": "<rect x=\"34\" y=\"98\" width=\"66\" height=\"42\" rx=\"4\" fill=\"%1\"/><path d=\"M34 98 L46 82 L88 82 L100 98 Z\" fill=\"%2\" opacity=\".85\"/><rect x=\"46\" y=\"108\" width=\"20\" height=\"20\" rx=\"2\" fill=\"%2\" opacity=\".5\"/><circle cx=\"46\" cy=\"150\" r=\"13\" fill=\"none\" stroke=\"%1\" stroke-width=\"5\"/><circle cx=\"96\" cy=\"150\" r=\"17\" fill=\"none\" stroke=\"%1\" stroke-width=\"5\"/><rect x=\"0\" y=\"166\" width=\"140\" height=\"44\" fill=\"%1\"/>", "cabaret": "<path d=\"M0 30 L140 30 L140 46 Q106 66 70 46 Q34 26 0 46 Z\" fill=\"%1\"/><g fill=\"%2\" opacity=\".85\"><circle cx=\"70\" cy=\"98\" r=\"24\"/><path d=\"M52 122 q18 22 36 0 L88 156 L52 156 Z\"/></g><g fill=\"%2\" opacity=\".5\"><circle cx=\"26\" cy=\"76\" r=\"4\"/><circle cx=\"114\" cy=\"88\" r=\"4\"/><circle cx=\"34\" cy=\"130\" r=\"3\"/><circle cx=\"108\" cy=\"140\" r=\"3.4\"/></g><rect x=\"0\" y=\"176\" width=\"140\" height=\"34\" fill=\"%1\"/>", "chorale": "<g fill=\"%2\" opacity=\".9\"><circle cx=\"40\" cy=\"94\" r=\"13\"/><circle cx=\"70\" cy=\"82\" r=\"15\"/><circle cx=\"100\" cy=\"94\" r=\"13\"/><path d=\"M22 152 q18 -34 36 0 Z\"/><path d=\"M48 152 q22 -40 44 0 Z\"/><path d=\"M82 152 q18 -34 36 0 Z\"/></g><g fill=\"%1\"><ellipse cx=\"40\" cy=\"100\" rx=\"5\" ry=\"7\"/><ellipse cx=\"70\" cy=\"90\" rx=\"6\" ry=\"8\"/><ellipse cx=\"100\" cy=\"100\" rx=\"5\" ry=\"7\"/></g><rect x=\"0\" y=\"152\" width=\"140\" height=\"58\" fill=\"%1\"/>", "sousMarin": "<g stroke=\"%2\" stroke-width=\"2\" fill=\"none\" opacity=\".35\"><path d=\"M0 40 q35 -12 70 0 q35 12 70 0\"/><path d=\"M0 64 q35 -12 70 0 q35 12 70 0\"/></g><ellipse cx=\"70\" cy=\"112\" rx=\"44\" ry=\"22\" fill=\"%1\"/><circle cx=\"88\" cy=\"112\" r=\"9\" fill=\"%2\" opacity=\".7\"/><rect x=\"60\" y=\"86\" width=\"9\" height=\"18\" rx=\"3\" fill=\"%1\"/><path d=\"M26 112 L8 96 L8 128 Z\" fill=\"%1\"/><g fill=\"%2\" opacity=\".45\"><circle cx=\"112\" cy=\"72\" r=\"3.4\"/><circle cx=\"122\" cy=\"58\" r=\"2.4\"/><circle cx=\"104\" cy=\"60\" r=\"2\"/></g>", "horlogeArret": "<circle cx=\"70\" cy=\"100\" r=\"44\" fill=\"none\" stroke=\"%2\" stroke-width=\"5\" opacity=\".9\"/><g stroke=\"%2\" stroke-width=\"5\" stroke-linecap=\"round\"><path d=\"M70 100 L70 68\"/><path d=\"M70 100 L70 100\"/></g><circle cx=\"70\" cy=\"100\" r=\"5\" fill=\"%2\"/><g fill=\"%2\" opacity=\".35\"><path d=\"M118 62 l16 -12 l-6 18 Z\"/><path d=\"M22 138 l-16 12 l6 -18 Z\"/></g>", "moto": "<circle cx=\"38\" cy=\"140\" r=\"21\" fill=\"none\" stroke=\"%1\" stroke-width=\"7\"/><circle cx=\"104\" cy=\"140\" r=\"21\" fill=\"none\" stroke=\"%1\" stroke-width=\"7\"/><path d=\"M38 140 L64 116 L92 116 L104 140\" stroke=\"%1\" stroke-width=\"7\" fill=\"none\" stroke-linejoin=\"round\"/><path d=\"M64 116 L56 96 L74 96\" stroke=\"%1\" stroke-width=\"5\" fill=\"none\" stroke-linecap=\"round\"/><circle cx=\"88\" cy=\"72\" r=\"20\" fill=\"%2\" opacity=\".25\"/><path d=\"M0 176 h140\" stroke=\"%1\" stroke-width=\"6\"/>", "tente": "<path d=\"M28 158 L70 82 L112 158 Z\" fill=\"%1\"/><path d=\"M70 82 L70 158\" stroke=\"%2\" stroke-width=\"2.4\" opacity=\".5\"/><path d=\"M62 158 L70 122 L78 158 Z\" fill=\"%2\" opacity=\".4\"/><g fill=\"%2\" opacity=\".7\"><circle cx=\"106\" cy=\"52\" r=\"12\"/></g><g fill=\"%1\" opacity=\".6\"><path d=\"M20 158 q10 -12 18 0 Z\"/><path d=\"M104 158 q10 -12 18 0 Z\"/></g><rect x=\"0\" y=\"158\" width=\"140\" height=\"52\" fill=\"%1\"/>"};

/* Trois palettes par genre : ciel, sol, encre, accent.
   Nommée PALETTES_AFFICHE et non PALETTES : le module de la façade
   exporte déjà une constante de ce nom, et le jour où un fichier
   importerait les deux, l'une écraserait l'autre. */
const PALETTES_AFFICHE = {"Drame": [["#5a6b84", "#212a3c", "#efe4cc", "#c98a5a"], ["#46586e", "#1a2330", "#e6dcc6", "#8fa8b8"], ["#6b6a7e", "#252334", "#eee2d2", "#b98a9a"]], "Aventure": [["#2f7fa6", "#0d2c40", "#f4e8ca", "#e8b04a"], ["#3a8c8a", "#0f3234", "#f2ecd2", "#e0a03a"], ["#26688f", "#0b2438", "#f0e6cc", "#d98a44"]], "Animation": [["#63bcd2", "#256880", "#fff8e0", "#ffb347"], ["#7cc9a8", "#2a6b58", "#fffae6", "#ff9a76"], ["#8fb8e0", "#33547f", "#fff6ea", "#f2c14e"]], "Documentaire": [["#86957a", "#333f2c", "#f2ead2", "#c9a24a"], ["#9aa286", "#3d4433", "#f4ecd6", "#b08050"], ["#74886f", "#2c3a2b", "#eee6cc", "#d0b070"]], "Thriller familial": [["#564c68", "#1d182a", "#e6dcd0", "#c4485a"], ["#4a4a60", "#1a1a28", "#e2d8cc", "#b8506a"], ["#5f5470", "#221c30", "#e8dece", "#a84a52"]], "Comédie": [["#efb04a", "#9a5418", "#3a2410", "#e0503a"], ["#f0c060", "#a06020", "#3d2812", "#3f8fa0"], ["#e8a03a", "#8f4a14", "#38220e", "#7aa84a"]], "Romance": [["#d0869a", "#63273a", "#fff2e8", "#f0c060"], ["#c4788e", "#5a2434", "#fff0e4", "#e8a0a8"], ["#d99a94", "#6b3030", "#fff4ea", "#c9982f"]], "Film noir": [["#474750", "#0e0e14", "#ece8e0", "#c9982f"], ["#3e424c", "#0c0e14", "#e8e4dc", "#a83a2a"], ["#4c4650", "#100e16", "#eae6de", "#8fa8b8"]], "Western": [["#d1934f", "#6f4020", "#fff2d8", "#a83a2a"], ["#c98a56", "#663c1e", "#fdf0d4", "#7a5a2a"], ["#dda05a", "#7a4622", "#fff4dc", "#8f6a3a"]], "Musical": [["#a8447f", "#420f38", "#ffe8f2", "#f0c060"], ["#96407a", "#3a1030", "#ffe4ee", "#e8b04a"], ["#b04a72", "#48122e", "#ffe8ea", "#f2d070"]], "Fantastique": [["#7452ac", "#241452", "#f2e6ff", "#5ad2c0"], ["#5f4ba8", "#1e1450", "#eee2ff", "#f0c060"], ["#8452a0", "#2c1448", "#f4e8ff", "#7fd4a0"]], "Culte": [["#448a66", "#0f2e1c", "#e6ffea", "#e8b04a"], ["#3a7f70", "#0c2a26", "#e2fff0", "#d94a4a"], ["#4f8f58", "#123018", "#eaffe6", "#c9982f"]]};

/* une graine stable : la même affiche à chaque appel */
function graineFilm(id){
  let h = 0;
  for(const c of String(id)) h = (h * 31 + c.charCodeAt(0)) % 9973;
  return h;
}

/* le titre, coupé en lignes qui tiennent dans la largeur */
function lignesTitre(titre){
  const mots = String(titre).toUpperCase().split(" ");
  const out = []; let cur = "";
  for(const m of mots){
    if((cur + " " + m).trim().length > 15){ out.push(cur.trim()); cur = m; }
    else cur = (cur + " " + m).trim();
  }
  if(cur) out.push(cur);
  return out.slice(0, 3);
}

/* f : {id, titre, genre} · avecTitre faux pour les vignettes */
function afficheDuFilm(f, avecTitre){
  if(!f) return afficheDeGenre("Drame");
  const genre = PALETTES_AFFICHE[f.genre] ? f.genre : "Drame";
  const jeu = PALETTES_AFFICHE[genre];
  const p = jeu[graineFilm(f.id || f.titre || genre) % jeu.length];
  const ciel = p[0], sol = p[1], encre = p[2], accent = p[3];

  const cle = MOTIF_FILM[f.id] || MOTIF_GENRE[genre] || "phare";
  const corps = (MOTIFS[cle] || "")
    .split("%0").join(ciel).split("%1").join(sol).split("%2").join(encre);

  const L = lignesTitre(f.titre || "");
  const taille = L.length >= 3 ? 9.5 : L.some(l => l.length > 12) ? 11 : 12.5;
  const inter = taille + 3;
  const base = 210 - 17 - (L.length - 1) * inter;
  const i = "a" + graineFilm(String(f.id || f.titre)) + "x" + (avecTitre === false ? 0 : 1);
  const ech = t => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;");

  return `<svg viewBox="0 0 140 210" preserveAspectRatio="xMidYMid slice">
  <defs>
    <linearGradient id="c${i}" x1=".2" y1="0" x2=".8" y2="1">
      <stop offset="0" stop-color="${ciel}"/>
      <stop offset=".55" stop-color="${ciel}" stop-opacity=".82"/>
      <stop offset="1" stop-color="${sol}"/></linearGradient>
    <radialGradient id="h${i}" cx=".5" cy=".34" r=".62">
      <stop offset="0" stop-color="${accent}" stop-opacity=".3"/>
      <stop offset="1" stop-color="${accent}" stop-opacity="0"/></radialGradient>
    <radialGradient id="v${i}" cx=".5" cy=".5" r=".72">
      <stop offset=".55" stop-color="#000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity=".42"/></radialGradient>
    <linearGradient id="b${i}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${sol}" stop-opacity="0"/>
      <stop offset=".45" stop-color="${sol}" stop-opacity=".8"/>
      <stop offset="1" stop-color="${sol}" stop-opacity=".97"/></linearGradient>
    <linearGradient id="r${i}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${accent}" stop-opacity="0"/>
      <stop offset=".5" stop-color="${accent}"/>
      <stop offset="1" stop-color="${accent}" stop-opacity="0"/></linearGradient>
  </defs>

  <rect width="140" height="210" fill="url(#c${i})"/>
  <ellipse cx="70" cy="72" rx="86" ry="76" fill="url(#h${i})"/>
  <g>${corps}</g>

  <!-- un rai de lumière oblique, comme un reflet sur du papier glacé -->
  <path d="M-30 210 L44 -10 L70 -10 L-4 210 Z" fill="#fff" opacity=".05"/>
  <rect width="140" height="210" fill="url(#v${i})"/>

  ${avecTitre === false ? "" : `
  <rect x="0" y="${base - taille - 30}" width="140" height="${210 - base + taille + 30}"
    fill="url(#b${i})"/>
  <rect x="40" y="${base - taille - 11}" width="60" height="1.2" fill="url(#r${i})"/>
  <g font-family="Marcellus, Georgia, serif" text-anchor="middle">
    ${L.map((l, k) => `<text x="70" y="${base + k * inter}" font-size="${taille}"
      letter-spacing="1.2" fill="${encre}" style="paint-order:stroke"
      stroke="${sol}" stroke-width=".7" stroke-opacity=".55">${ech(l)}</text>`).join("")}
  </g>
  <text x="70" y="204" font-family="Outfit, sans-serif" font-size="4.6" letter-spacing="1.8"
    text-anchor="middle" fill="${accent}" opacity=".85">${ech(genre.toUpperCase())}</text>`}

  <rect x=".7" y=".7" width="138.6" height="208.6" rx="2" fill="none"
    stroke="${accent}" stroke-opacity=".45" stroke-width="1.4"/>
</svg>`;
}

/* ---- exports ---- */
export {
  A,
  GENRES_AFFICHES,
  MOTIFS,
  MOTIF_FILM,
  MOTIF_GENRE,
  PALETTES_AFFICHE,
  afficheDeGenre,
  afficheDuFilm,
  genreConnu,
  graineFilm,
  lignesTitre
};
