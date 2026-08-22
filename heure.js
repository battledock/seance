/* ============================================================
   L'HEURE
   La lumière suit l'heure qu'il est chez le joueur. Sept moments
   dans la journée, et on glisse de l'un à l'autre sans à-coup.
   Une seule table, partagée par toutes les pages à terre.
   ============================================================ */
const HEURE = (() => {

  function hx(c){
    return [parseInt(c.slice(1,3),16), parseInt(c.slice(3,5),16), parseInt(c.slice(5,7),16)];
  }
  function ch(a){
    return '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v)))
      .toString(16).padStart(2,'0')).join('');
  }
  function mel(a, b, k){
    const A = hx(a), B = hx(b);
    return ch([0,1,2].map(i => A[i] + (B[i]-A[i]) * k));
  }

  /* ---------- les sept moments ----------
     ciel  : le fond du ciel
     eau   : la mer, dans le port
     mur   : les façades qui prennent la lumière
     ombre : celles qui ne l'ont pas
     sol   : le pavé, le quai
     disque: le soleil ou la lune
     lampe : à quel point les lanternes brûlent (0 → 1)
     nuit  : les étoiles, et le voile bleu par-dessus tout */
  const MOMENTS = [
    { h:0,    nom:'Au cœur de la nuit',
      ciel:'#101c33', eau:'#0d2233', mur:'#33445c', ombre:'#1b2739', sol:'#242f42',
      disque:'#e8eef8', lampe:1,  nuit:1,
      teinte:'#16264a', force:.62, clarte:.54, couleur:.62 },
    { h:5.4,  nom:"L'aube",
      ciel:'#7b6a90', eau:'#2e4a62', mur:'#6e6278', ombre:'#3f3b54', sol:'#4b4759',
      disque:'#ffd9c0', lampe:.72, nuit:.4,
      teinte:'#6a5a8c', force:.34, clarte:.8,  couleur:.78 },
    { h:7,    nom:'Le petit matin',
      ciel:'#f2a898', eau:'#3f7f92', mur:'#eac2aa', ombre:'#8c7282', sol:'#8e8492',
      disque:'#fff0dc', lampe:.22, nuit:.08,
      teinte:'#ffc0a8', force:.2,  clarte:.95, couleur:1.02 },
    { h:9.5,  nom:'La matinée',
      ciel:'#8fc8e0', eau:'#2d7ba8', mur:'#f6e4c4', ombre:'#a28e7a', sol:'#b2aa96',
      disque:'#fff8e0', lampe:0,   nuit:0,
      teinte:'#ffffff', force:0,   clarte:1,   couleur:1 },
    { h:13,   nom:'Le plein midi',
      ciel:'#7cc4e8', eau:'#1f8fb0', mur:'#fdf2d8', ombre:'#b29e86', sol:'#c6bdaa',
      disque:'#ffffff', lampe:0,   nuit:0,
      teinte:'#ffffff', force:0,   clarte:1.06,couleur:1.06 },
    { h:17,   nom:"L'après-midi",
      ciel:'#f2c266', eau:'#2f88a0', mur:'#f8dbaa', ombre:'#aa856c', sol:'#bfa98c',
      disque:'#fff0c4', lampe:0,   nuit:0,
      teinte:'#ffd08a', force:.24, clarte:1.02,couleur:1.12 },
    { h:19.6, nom:'Le couchant',
      ciel:'#e8763c', eau:'#a8544c', mur:'#eaa276', ombre:'#7c4c58', sol:'#8e6262',
      disque:'#ffb060', lampe:.5,  nuit:.12,
      teinte:'#ff8a4a', force:.38, clarte:.94, couleur:1.2 },
    { h:21.4, nom:'Le crépuscule',
      ciel:'#5a4a72', eau:'#2e3f5e', mur:'#7c6c82', ombre:'#403752', sol:'#504a62',
      disque:'#ffd0a0', lampe:.9,  nuit:.5,
      teinte:'#4e4478', force:.5,  clarte:.7,  couleur:.84 },
    { h:23,   nom:'La nuit',
      ciel:'#16223c', eau:'#10263a', mur:'#3a4a62', ombre:'#1f2b3e', sol:'#28334a',
      disque:'#e8eef8', lampe:1,   nuit:.94,
      teinte:'#1a2846', force:.6,  clarte:.56, couleur:.64 },
    { h:24,   nom:'Au cœur de la nuit',
      ciel:'#101c33', eau:'#0d2233', mur:'#33445c', ombre:'#1b2739', sol:'#242f42',
      disque:'#e8eef8', lampe:1,   nuit:1,
      teinte:'#16264a', force:.62, clarte:.54, couleur:.62 }
  ];

  const TONS = ['ciel','eau','mur','ombre','sol','disque','teinte'];
  const NOMBRES = ['lampe','nuit','force','clarte','couleur'];

  /* l'heure décimale, chez le joueur */
  function maintenant(){
    const d = new Date();
    return d.getHours() + d.getMinutes() / 60;
  }

  /* la lumière à une heure donnée */
  function a(h){
    if (h === undefined) h = maintenant();
    h = ((h % 24) + 24) % 24;
    let i = 0;
    while (i < MOMENTS.length - 2 && MOMENTS[i + 1].h <= h) i++;
    const A = MOMENTS[i], B = MOMENTS[i + 1];
    const k = (h - A.h) / (B.h - A.h);

    const L = { h:h, nom:(k < .5 ? A.nom : B.nom) };
    TONS.forEach(t => L[t] = mel(A[t], B[t], k));
    NOMBRES.forEach(n => L[n] = A[n] + (B[n] - A[n]) * k);

    /* où en est le soleil dans sa course : 0 au lever, 1 au coucher.
       En dehors, il est sous l'horizon et c'est la lune qui passe. */
    const LEVER = 6.4, COUCHER = 20.4;
    L.jour = h > LEVER && h < COUCHER;
    L.course = L.jour
      ? (h - LEVER) / (COUCHER - LEVER)
      : ((h < LEVER ? h + 24 : h) - COUCHER) / (LEVER + 24 - COUCHER);
    return L;
  }

  /* poser la lumière sur la page : une variable CSS par ton */
  function poser(L, el){
    const R = (el || document.documentElement).style;
    TONS.forEach(t => R.setProperty('--' + t, L[t]));
    R.setProperty('--lampe', L.lampe.toFixed(3));
    R.setProperty('--nuit', L.nuit.toFixed(3));
    /* de quoi teinter une scène déjà dessinée, sans y toucher */
    R.setProperty('--force', L.force.toFixed(3));
    R.setProperty('--filtre',
      'brightness(' + L.clarte.toFixed(3) + ') saturate(' + L.couleur.toFixed(3) + ')');
    const m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute('content', L.ciel);
    return L;
  }

  /* l'heure telle qu'on l'écrit dans le jeu */
  function texte(L){
    const h = Math.floor(L.h);
    return h + ' h' + (L.h % 1 >= .5 ? ' 30' : '');
  }

  return { a, poser, maintenant, texte, mel, MOMENTS };
})();
