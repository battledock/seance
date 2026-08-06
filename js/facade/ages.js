/* ============================================================
   LES DIX ÂGES DU CINÉMA
   Au niveau 1 le cinéma tourne déjà : modeste, fatigué, mais
   ouvert. Ensuite il se restaure, puis il devient un palace.
   ============================================================ */

const AGES = [
  {
    seuil:1, cle:"quartier", nom:"Le cinéma de quartier",
    recit:"Une salle, un projecteur, une enseigne qui grésille un peu. Ça suffit pour ouvrir."
  },
  {
    seuil:5, cle:"remis", nom:"Remis à neuf",
    recit:"Peinture fraîche, vitres nettoyées. L'enseigne ne grésille plus."
  },
  {
    seuil:10, cle:"auvent", nom:"Le vrai auvent",
    recit:"L'auvent de tôle laisse place à un marquee en volume. On annonce les séances de loin."
  },
  {
    seuil:15, cle:"lumieres", nom:"Les lumières",
    recit:"Ampoules sous l'auvent, appliques à l'entrée, laiton poli. Le soir, on nous voit."
  },
  {
    seuil:20, cle:"style", nom:"Le style revient",
    recit:"Pilastres cannelés, filets dorés, corniche à gradins. Le bâtiment retrouve sa ligne."
  },
  {
    seuil:25, cle:"palace", nom:"Le palace",
    recit:"Couronnement art déco, éventail doré, tapis rouge et cordons. Le cinéma d'origine est revenu."
  },
  {
    seuil:30, cle:"blade", nom:"L'enseigne verticale",
    recit:"Une lame de néon monte le long de la façade. On la voit du bout de la rue."
  },
  {
    seuil:35, cle:"guichet", nom:"Le guichet",
    recit:"Une cabine de billetterie en saillie, une horloge au fronton. On fait la queue dehors."
  },
  {
    seuil:40, cle:"etoiles", nom:"Les étoiles au sol",
    recit:"Des dalles étoilées sur le trottoir, des portes dorées, une verrière au-dessus de l'entrée."
  },
  {
    seuil:50, cle:"premiere", nom:"Le soir de première",
    recit:"Deux projecteurs balaient le ciel, l'auvent défile en chenillard. C'est un événement."
  }
];

function ageDuCinema(niveau){
  const n = Math.max(1, Number(niveau) || 1);
  let age = AGES[0];
  for(const a of AGES){ if(n >= a.seuil) age = a; }
  return age;
}

function etatBatiment(niveau){
  const n = Math.max(1, Number(niveau) || 1);
  const age = ageDuCinema(niveau);
  const i = AGES.indexOf(age);
  const suivant = AGES[i+1];
  const dedans = suivant ? (n - age.seuil) / (suivant.seuil - age.seuil) : 1;

  return {
    age, index:i, dedans, niveau:n,

    /* fatigue du bâtiment : jamais une ruine, juste un lieu qui a vécu */
    usure: [.55, .34, .22, .14, .07, 0, 0, 0, 0, 0][i],

    /* ---- ce qui existe dès le premier jour ---- */
    enseigneComplete: true,
    enseigneAllumee:  true,
    vitrines:         true,
    affiches:         true,
    portes:           true,
    marquee:          true,
    lampadaires:      2,

    /* ---- les marques du temps, qui disparaissent ---- */
    enseigneGresille: i === 0,
    peintureEcaillee: i <= 1,
    rouille:          i <= 1,
    herbes:           i === 0,
    trottoirFissure:  i <= 1,
    ampouleMorte:     i <= 1,
    pigeons:          i <= 1,
    echafaudage:      i === 1,

    /* ---- ce qui s'ajoute avec les niveaux ---- */
    marqueeVolume:    i >= 2,
    texteMarquee:     i >= 2,
    ampoulesMarquee:  i >= 3,
    ampoulesEnseigne: i >= 3,
    vitrinesLaiton:   i >= 3,
    appliques:        i >= 3,
    imposte:          i >= 3,
    plaque:           i >= 2,
    banc:             i >= 1,
    jardiniere:       i >= 2,
    corbeille:        i >= 1,
    pilastres:        i >= 4,
    filetsDores:      i >= 4,
    couronnement:     Math.min(5, Math.max(1, i - 1)),
    basReliefs:       i >= 5,
    eventail:         i >= 5,
    tapis:            i >= 5,
    potelets:         i >= 5,

    /* ---- au-delà du palace ---- */
    enseigneVerticale: i >= 6,
    fenetresEtage:     i >= 6,
    guichet:           i >= 7,
    horloge:           i >= 7,
    fileDehors:        i >= 7,
    etoilesSol:        i >= 8,
    portesDorees:      i >= 8,
    verriere:          i >= 8,
    projecteursCiel:   i >= 9,
    chenillard:        i >= 9,
    tapisLong:         i >= 9
  };
}

function murSelonEtat(P, E){
  const melange = (a, b, t) => {
    const h = c => [1,3,5].map(i=>parseInt(c.substr(i,2),16));
    const [r1,g1,b1] = h(a), [r2,g2,b2] = h(b);
    const m = (x,y)=>Math.round(x + (y-x)*t).toString(16).padStart(2,"0");
    return "#" + m(r1,r2) + m(g1,g2) + m(b1,b2);
  };
  return {
    clair: melange(P.mur[0], "#8a8272", E.usure * .8),
    fonce: melange(P.mur[1], "#665e52", E.usure * .8),
    pierre: melange(P.pierre, "#a09884", E.usure * .7)
  };
}

/* ---- exports ---- */
export {
  AGES,
  ageDuCinema,
  etatBatiment,
  murSelonEtat
};
