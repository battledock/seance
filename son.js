/* ============================================================
   Battle Dock — LE SON
   Tout est fabriqué par le navigateur : aucun fichier, aucun
   téléchargement, aucune latence. Le réglage « son » le coupe
   entièrement, et rien ne démarre avant le premier geste du
   joueur — les navigateurs l'exigent, et c'est bien ainsi.
   ============================================================ */
const SON = (() => {
let A = null, SORTIE = null, ECHO = null, vivants = [];

function ctx(){
  if (!A){
    A = new (window.AudioContext || window.webkitAudioContext)();

    /* l'adoucisseur : il empêche les crêtes de piquer */
    const comp = A.createDynamicsCompressor();
    /* un seuil bas et un genou large : la compression travaille tout
       le temps un peu, au lieu d'écraser brutalement les crêtes */
    comp.threshold.value = -16;
    comp.knee.value = 34;
    comp.ratio.value = 2.6;
    comp.attack.value = 0.012;
    comp.release.value = 0.3;

    /* on rabote au-dessus de 5 kHz : c'est là que ça agresse */
    const doux = A.createBiquadFilter();
    doux.type = 'lowpass';
    doux.frequency.value = 5200;
    doux.Q.value = 0.6;

    /* et on enlève les graves inutiles, qui saturent les petits
       haut-parleurs de téléphone */
    const propre = A.createBiquadFilter();
    propre.type = 'highpass';
    propre.frequency.value = 42;

    const volume = A.createGain();
    volume.gain.value = 0.62;
    VOL = volume;

    doux.connect(propre); propre.connect(comp);
    comp.connect(volume); volume.connect(A.destination);
    SORTIE = doux;

    /* ---------- la réverbération ----------
       C'est elle qui crépitait. Deux raisons, et deux corrections :

       1. La queue était du bruit blanc pur. Un convolueur multiplie
          le son par cette queue : chaque grain aigu du bruit devient
          un grésil audible. On la lisse donc, comme une vraie salle
          qui absorbe les aigus en s'éteignant.
       2. Elle ne descendait jamais tout à fait à zéro, et le buffer
          s'arrêtait net. On force les dernières millisecondes à
          s'éteindre pour de bon. */
    const rev = A.createConvolver();
    const n = Math.floor(A.sampleRate * 1.1);
    const b = A.createBuffer(2, n, A.sampleRate);
    for (let c = 0; c < 2; c++){
      const d = b.getChannelData(c);
      let p = 0;
      for (let i = 0; i < n; i++){
        const t = i / n;
        /* du bruit lissé : les aigus s'en vont plus vite que les graves */
        p = p * 0.55 + (Math.random() * 2 - 1) * 0.45;
        let v = p * Math.pow(1 - t, 3.2) * 0.42;
        /* et la toute fin s'éteint franchement */
        if (t > 0.88) v *= (1 - t) / 0.12;
        d[i] = v;
      }
    }
    rev.buffer = b;

    /* on n'envoie à la salle que le corps du son, pas les aigus :
       une réverbération brillante siffle sur un téléphone */
    const versEcho = A.createBiquadFilter();
    versEcho.type = 'lowpass';
    versEcho.frequency.value = 2600;
    versEcho.Q.value = 0.5;
    const env = A.createGain();
    env.gain.value = 0.18;
    env.connect(versEcho); versEcho.connect(rev); rev.connect(SORTIE);
    ECHO = env;
  }
  if (A.state === 'suspended') A.resume();
  return A;
}
function suivre(n){ vivants.push(n); }
function tuer(){
  /* on baisse le volume général en 60 ms, puis on coupe : arrêter
     net des dizaines de cordes en vibration fait un craquement */
  if (A && VOL){
    const v = VOL.gain.value;
    VOL.gain.cancelScheduledValues(A.currentTime);
    VOL.gain.setValueAtTime(v, A.currentTime);
    VOL.gain.linearRampToValueAtTime(0.0001, A.currentTime + 0.06);
    const morts = vivants.slice();
    vivants = [];
    setTimeout(() => {
      morts.forEach(n => { try { n.stop(); } catch(e){} });
      if (VOL) VOL.gain.setValueAtTime(v, A.currentTime);
    }, 80);
    return;
  }
  vivants.forEach(n => { try { n.stop(); } catch(e){} });
  vivants = [];
}


/* ---------- briques ---------- */
/* Une note. L'attaque n'est jamais instantanée — c'est ce qui
   rendait le premier jet sec et piquant. Chaque note a aussi son
   propre filtre, pour que les harmoniques dures ne passent pas. */
function ton(f, t0, duree, vol, forme, echo){
  const c = ctx(), o = c.createOscillator(), g = c.createGain();
  o.type = forme || 'sine';
  o.frequency.setValueAtTime(f, t0);

  /* on adoucit les formes dures : un carré nu est une lame */
  const cl = c.createBiquadFilter();
  cl.type = 'lowpass';
  cl.frequency.setValueAtTime(
    (forme === 'square' || forme === 'sawtooth') ? Math.max(900, f * 3.2) : 9000, t0);
  cl.Q.value = 0.5;

  /* attaque de 25 ms, chute douce, extinction complète */
  const mont = Math.min(0.045, duree * 0.3);
  const fin = t0 + duree + 0.35;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(vol, t0 + mont);
  g.gain.setTargetAtTime(0.0001, t0 + mont, duree * 0.32);
  /* on éteint pour de bon avant de couper : sinon, un clic */
  if (g.gain.cancelAndHoldAtTime) g.gain.cancelAndHoldAtTime(fin - 0.06);
  g.gain.linearRampToValueAtTime(0, fin - 0.01);

  o.connect(cl); cl.connect(g); g.connect(SORTIE);
  if (echo !== 0) g.connect(ECHO);
  o.start(t0); o.stop(fin);
  suivre(o);
  return o;
}

function bruit(t0, duree, vol, coupe, type, echo){
  const c = ctx();
  const n = c.createBufferSource();
  const b = c.createBuffer(1, Math.max(1, Math.floor(c.sampleRate * duree)),
    c.sampleRate);
  const d = b.getChannelData(0);
  /* du bruit lissé plutôt que du grésil : deux fois moins agressif */
  let p = 0;
  for (let i = 0; i < d.length; i++){
    p = p * 0.72 + (Math.random() * 2 - 1) * 0.28;
    d[i] = p;
  }
  n.buffer = b;
  const f = c.createBiquadFilter();
  f.type = type || 'lowpass';
  f.frequency.setValueAtTime(coupe, t0);
  f.Q.value = 0.7;
  const g = c.createGain();
  const mont2 = Math.min(0.03, duree * 0.25);
  const finb = t0 + duree + 0.3;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(vol, t0 + mont2);
  g.gain.setTargetAtTime(0.0001, t0 + mont2, duree * 0.3);
  if (g.gain.cancelAndHoldAtTime) g.gain.cancelAndHoldAtTime(finb - 0.06);
  g.gain.linearRampToValueAtTime(0, finb - 0.01);
  n.connect(f); f.connect(g); g.connect(SORTIE);
  if (echo !== 0) g.connect(ECHO);
  n.start(t0); n.stop(finb);
  suivre(n);
  return { n, f, g };
}

/* ============================================================
   LE PIANO
   Une corde frappée, ce n'est pas une note : c'est une fondamentale
   et ses harmoniques, qui s'éteignent d'autant plus vite qu'elles
   sont hautes. On ajoute le bruit du marteau, et une très légère
   fausseté — un piano parfaitement juste sonne électronique.
   ============================================================ */
let MARTEAU = null;
function marteau(){
  if (MARTEAU) return MARTEAU;
  const c = ctx();
  MARTEAU = c.createBuffer(1, Math.floor(c.sampleRate * 0.03), c.sampleRate);
  const d = MARTEAU.getChannelData(0);
  let p = 0;
  for (let i = 0; i < d.length; i++){
    p = p * 0.6 + (Math.random() * 2 - 1) * 0.4;
    d[i] = p * (1 - i / d.length);
  }
  return MARTEAU;
}

function piano(f, t0, duree, vol, echo){
  const c = ctx();
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(vol, t0 + 0.006);
  g.gain.setTargetAtTime(0.0001, t0 + 0.006, duree * 0.34);
  if (g.gain.cancelAndHoldAtTime) g.gain.cancelAndHoldAtTime(t0 + duree + 0.38);
  g.gain.linearRampToValueAtTime(0, t0 + duree + 0.44);

  const doux = c.createBiquadFilter();
  doux.type = 'lowpass';
  doux.frequency.setValueAtTime(Math.min(6000, f * 9), t0);
  doux.frequency.setTargetAtTime(Math.max(700, f * 3), t0, duree * 0.4);
  doux.Q.value = 0.4;

  /* les harmoniques : plus elles montent, plus elles s'éteignent vite */
  /* Moins d'harmoniques dans l'aigu : au-dessus de 400 Hz, les
     partiels hauts sortent de toute façon par le filtre général,
     et chaque oscillateur en moins soulage le téléphone. C'est la
     surcharge qui fait décrocher le son. */
  const toutes = [
    { n: 1,    v: 1.00, d: 1.00 },
    { n: 2,    v: 0.42, d: 0.72 },
    { n: 3,    v: 0.22, d: 0.52 },
    { n: 4.01, v: 0.13, d: 0.38 },
    { n: 5.02, v: 0.07, d: 0.28 },
    { n: 6.04, v: 0.04, d: 0.20 }
  ];
  const parts = toutes.slice(0, f > 700 ? 3 : f > 350 ? 4 : 6);
  /* six harmoniques additionnées font presque le double du volume
     demandé : sans cette division, ça saturait en accord */
  const somme = parts.reduce((a, p) => a + p.v, 0);
  const fin = t0 + duree + 0.45;

  parts.forEach(p => {
    const o = c.createOscillator(), h = c.createGain();
    o.type = 'sine';
    /* la fausseté des cordes hautes : c'est elle qui fait le bois */
    o.frequency.setValueAtTime(f * p.n * (1 + (p.n - 1) * 0.0009), t0);
    h.gain.setValueAtTime(0.0001, t0);
    h.gain.linearRampToValueAtTime(p.v / somme, t0 + 0.006);
    h.gain.setTargetAtTime(0.0001, t0 + 0.006, duree * 0.34 * p.d);
    /* On descend à zéro avant de couper. Attention : lire h.gain.value
       ici donne le volume de MAINTENANT, pas celui qu'aura la corde
       dans deux secondes — le programmer créait un saut, donc un clic.
       cancelAndHoldAtTime fige la courbe là où elle en sera vraiment. */
    if (h.gain.cancelAndHoldAtTime) h.gain.cancelAndHoldAtTime(fin - 0.09);
    h.gain.linearRampToValueAtTime(0, fin - 0.005);
    o.connect(h); h.connect(doux);
    o.start(t0); o.stop(fin);
    suivre(o);
  });

  /* le marteau : un choc mat, très court. L'échantillon est fabriqué
     une seule fois et réutilisé — le refaire à chaque note coûtait
     plus cher que de le jouer. */
  const m = c.createBufferSource();
  m.buffer = marteau();
  const mf = c.createBiquadFilter();
  mf.type = 'bandpass';
  mf.frequency.setValueAtTime(Math.min(3000, f * 4), t0);
  const mg = c.createGain();
  mg.gain.setValueAtTime(vol * 0.2, t0);
  mg.gain.linearRampToValueAtTime(0, t0 + 0.03);
  m.connect(mf); mf.connect(mg); mg.connect(doux);
  m.start(t0); m.stop(t0 + 0.045);
  suivre(m);

  doux.connect(g); g.connect(SORTIE);
  if (echo !== 0) g.connect(ECHO);
  return g;
}

/* ---------- les sons ---------- */
const SONS = {
  /* une pièce qui tombe : deux notes qui s'accordent, pas trois
     qui montent en flèche */
  piece(t){
    ton(784, t, .5, .11, 'sine');
    ton(1046, t + .07, .7, .07, 'sine');
    ton(523, t + .02, .8, .05, 'triangle');
  },

  /* le geste : très court, très doux, presque un souffle */
  clic(t){
    ton(660, t, .09, .045, 'sine', 0);
    bruit(t, .03, .022, 1400, 'lowpass', 0);
  },

  /* le refus : deux notes qui descendent, sans grincer */
  refus(t){
    ton(392, t, .22, .08, 'triangle');
    ton(311, t + .12, .38, .08, 'triangle');
  },

  /* une caisse qu'on pose : du bois, du poids, rien de métallique */
  charge(t){
    bruit(t, .13, .13, 420);
    ton(98, t, .26, .12, 'sine');
    ton(147, t + .01, .18, .05, 'triangle');
  },

  /* larguer les amarres : la corde, puis un accord qui s'ouvre */
  depart(t){
    bruit(t, .42, .07, 520, 'bandpass');
    ton(196, t, .9, .075, 'triangle');
    ton(294, t + .2, .95, .06, 'triangle');
    ton(392, t + .4, 1.1, .05, 'sine');
  },

  /* la houle : des vagues lentes, jamais deux pareilles */
  houle(t){
    for (let i = 0; i < 5; i++){
      const d = t + i * 1.55;
      const b = bruit(d, 1.5, .085, 420, 'lowpass');
      b.f.frequency.setValueAtTime(240, d);
      b.f.frequency.linearRampToValueAtTime(680 + Math.random() * 180, d + .55);
      b.f.frequency.linearRampToValueAtTime(240, d + 1.4);
      b.g.gain.cancelScheduledValues(d);
      b.g.gain.setValueAtTime(0.0001, d);
      b.g.gain.linearRampToValueAtTime(.085, d + .5);
      b.g.gain.linearRampToValueAtTime(0.0001, d + 1.45);
    }
  },

  /* la cloche du quai : une seule note, et ses harmoniques justes */
  arrivee(t){
    ton(523, t, 2.4, .085, 'sine');
    ton(1046, t, 1.6, .035, 'sine');
    ton(1568, t, .9, .016, 'sine');
    ton(392, t + .35, 2.2, .05, 'sine');
  },

  /* la massue attrapée : sec mais rond, comme du bois dans la paume */
  massue(t){
    ton(880, t, .11, .07, 'sine', 0);
    bruit(t, .04, .05, 1600, 'lowpass', 0);
  },

  /* le départ des crabes : trois coups, puis la note du départ */
  crabe(t){
    for (let i = 0; i < 3; i++) ton(523, t + i * .3, .18, .07, 'triangle');
    ton(784, t + .9, .6, .1, 'triangle');
    ton(1046, t + .92, .5, .045, 'sine');
  },

  /* le coup porté : du grave, du corps, aucun sifflement */
  coup(t){
    bruit(t, .1, .16, 260);
    ton(82, t, .22, .18, 'sine');
    ton(123, t + .015, .12, .06, 'triangle');
  },

  /* un étage plus bas : le sol qui s'éloigne */
  torche(t){
    ton(65, t, 1.6, .13, 'sine');
    ton(98, t + .25, 1.4, .06, 'sine');
    bruit(t + .1, .7, .05, 300);
  },

  /* ---------- les musiques ---------- */

  /* le port : la mer, une basse lente, une guitare qui égrène */
  m_port(t){
    SONS.houle(t);
    const basse = [110, 110, 98, 87];
    const air = [329, 392, 440, 392, 329, 294, 262, 294];
    for (let m = 0; m < 4; m++){
      const d = t + m * 4;
      ton(basse[m % 4], d, 3.4, .07, 'sine');
      ton(basse[m % 4] * 1.5, d + .1, 3, .03, 'sine');
      for (let i = 0; i < 8; i++)
        ton(air[i], d + i * .5, .62, .038, 'triangle');
    }
  },

  /* la taverne : trois temps, mineur, la basse traîne */
  m_taverne(t){
    const accords = [[220,262,330],[196,247,294],[175,220,262],[196,247,294]];
    for (let m = 0; m < 5; m++){
      const d = t + m * 3.2;
      const a = accords[m % 4];
      ton(a[0] / 2, d, 1.6, .075, 'sine');
      a.forEach((f, i) => ton(f, d + .06 + i * .02, 1.5, .034, 'triangle'));
      ton(a[1], d + 1.2, 1.1, .03, 'triangle');
      ton(a[2], d + 2.15, 1.1, .026, 'triangle');
    }
  },

  /* le chapiteau : une fanfare qui trébuche, mais qui ne crie pas */
  m_cirque(t){
    const air = [523,659,784,659,523,587,523,0,392,523,659,523,440,392,0,0];
    for (let m = 0; m < 2; m++){
      const d = t + m * 7;
      for (let i = 0; i < 16; i++){
        if (!air[i]) continue;
        const boite = (i % 8 === 3) ? .03 : 0;
        ton(air[i], d + i * .42 + boite, .46, .05, 'triangle');
        ton(air[i] / 2, d + i * .42 + boite, .4, .028, 'sine');
      }
      for (let i = 0; i < 14; i++){
        if (i % 2 === 0) bruit(d + i * .42, .09, .07, 220);
        else bruit(d + i * .42, .05, .028, 900, 'bandpass');
      }
    }
  },

  /* ---------- au piano ---------- */

  /* la même récompense, en cordes frappées */
  p_piece(t){
    piano(523, t, 1.4, .13);
    piano(784, t + .09, 1.6, .1);
    piano(1046, t + .17, 1.8, .06);
  },


  /* une gamme, pour entendre l'instrument seul */
  p_gamme(t){
    [262, 294, 330, 349, 392, 440, 494, 523].forEach((f, i) =>
      piano(f, t + i * .34, 1.6, .16));
  },

  /* le port au piano : la même mélodie que la version guitare,
     mais posée, avec la mer derrière */
  p_port(t){
    SONS.houle(t);
    const basse = [110, 110, 98, 87];
    const air = [329, 392, 440, 392, 329, 294, 262, 294];
    for (let m = 0; m < 4; m++){
      const d = t + m * 4;
      piano(basse[m % 4] / 2, d, 3.6, .13);
      piano(basse[m % 4], d + .02, 3.2, .09);
      for (let i = 0; i < 8; i++)
        piano(air[i], d + i * .5, 1.5, .1 - (i % 3) * .012);
    }
  },

  /* la taverne au piano : trois temps, la main gauche traîne */
  p_taverne(t){
    const accords = [[220,262,330],[196,247,294],[175,220,262],[196,247,294]];
    for (let m = 0; m < 5; m++){
      const d = t + m * 3.2;
      const a = accords[m % 4];
      piano(a[0] / 2, d, 2.4, .15);
      a.forEach((f, i) => piano(f, d + .07 + i * .03, 2.2, .06));
      piano(a[1] * 2, d + 1.25, 1.5, .06);
      piano(a[2] * 2, d + 2.2, 1.5, .05);
    }
  },

  /* les souterrains au piano : une main gauche seule, très bas,
     et deux notes hautes qui répondent de loin */
  p_donjon(t){
    for (let i = 0; i < 8; i++){
      const d = t + i * 2;
      piano(65.4, d, 3.2, .16);
      if (i % 2 === 1) piano(98, d + .95, 2.4, .085);
      const g = bruit(d + .4 + Math.random(), .06, .04, 1400, 'bandpass');
      g.f.frequency.setValueAtTime(900 + Math.random() * 500, d);
    }
    [392, 466, 392].forEach((f, i) => piano(f, t + 3.5 + i * 4.5, 3, .05));
  },

  /* la nuit sur le quai : trois accords, très espacés, rien d'autre */
  p_nuit(t){
    const suite = [[147,220,262,330],[131,196,262,311],[110,175,262,330],
                   [131,196,247,294]];
    suite.forEach((a, m) => {
      const d = t + m * 4.2;
      a.forEach((f, i) => piano(f, d + i * .045, 4, .085 - i * .009));
      piano(a[3] * 2, d + 2.2, 2.4, .045);
    });
  },

  /* les souterrains : une note qui revient, et de l'eau */
  m_donjon(t){
    for (let i = 0; i < 8; i++){
      const d = t + i * 2;
      ton(65.4, d, 2.2, .085, 'sine');
      if (i % 2 === 1) ton(98, d + .9, 1.6, .04, 'sine');
      const g = bruit(d + .4 + Math.random(), .06, .05, 1400, 'bandpass');
      g.f.frequency.setValueAtTime(900 + Math.random() * 500, d);
    }
    for (let i = 0; i < 3; i++)
      ton(196, t + 3 + i * 5, 3, .022, 'triangle');
  }
};


  /* ---------- ce que les pages appellent ---------- */
  let PRET = false;

  /* le navigateur n'autorise le son qu'après un geste : on attend
     le premier, et on ne dérange plus ensuite */
  function eveiller(){
    if (PRET) return;
    PRET = true;
    try { ctx(); } catch(e){}
  }
  ['pointerdown','keydown','touchstart'].forEach(e =>
    addEventListener(e, eveiller, { once:true, passive:true }));

  function autorise(){
    try {
      const r = (window.BD && BD.reglages) ? BD.reglages() : null;
      return !r || r.son !== false;
    } catch(e){ return true; }
  }

  function jouer(nom, quand){
    if (!PRET || !autorise() || !SONS[nom]) return;
    try { SONS[nom](ctx().currentTime + (quand || 0.015)); } catch(e){}
  }

  return { jouer, tuer, eveiller,
           get pret(){ return PRET; },
           volume(v){ ctx(); if (VOL) VOL.gain.value = v; } };
})();
