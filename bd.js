/* ============================================================
   Battle Dock — module commun
   Session Supabase, progression, sauvegarde.
   ============================================================ */
const BD = (() => {
  const URL = 'https://zpfkekiavlfphialvphi.supabase.co';
  const KEY = 'sb_publishable__dfR2lEOwKjhhtavvJEvGw_KVACZnHP';

  const ETAPES = ['personnage', 'visite', 'dotation', 'boutique', 'competences', 'trajet', 'jeu'];
  const PAGES = {
    personnage: 'personnage.html',
    visite: 'visite.html',
    dotation: 'dotation.html',
    boutique: 'boutique.html',
    competences: 'competences.html',
    trajet: 'trajet.html',
    jeu: 'jeu.html'
  };

  let sb = null, session = null, docker = null;

  async function client(){
    if (sb) return sb;
    if (!window.supabase){
      await new Promise((ok, ko) => {
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js';
        s.onload = ok; s.onerror = ko;
        document.head.appendChild(s);
      });
    }
    sb = window.supabase.createClient(URL, KEY);
    return sb;
  }

  /* ---------- session ---------- */
  async function utilisateur(){
    const c = await client();
    const { data } = await c.auth.getSession();
    session = data.session;
    return session ? session.user : null;
  }

  /* ---------- fiche du docker ---------- */
  async function charger(){
    const c = await client();
    const u = await utilisateur();
    if (!u) return null;
    let { data } = await c.from('dockers').select('*').eq('id', u.id).maybeSingle();
    if (!data){
      const { data: neuf } = await c.from('dockers')
        .insert({ id: u.id, etape: 'personnage' }).select().single();
      data = neuf;
    }
    /* on demande au serveur de recalculer l'énergie : elle monte
       d'un point par minute, même quand le jeu est fermé */
    try {
      const { data: fraiche } = await c.rpc('ma_fiche');
      if (fraiche) data = fraiche;
    } catch(e){}
    docker = data;
    return docker;
  }

  async function enregistrer(champs){
    const c = await client();
    const u = await utilisateur();
    if (!u) return null;
    const { data } = await c.from('dockers').update(champs).eq('id', u.id).select().single();
    if (data) docker = data;
    return data;
  }

  async function poser(table, champs){
    const c = await client();
    const u = await utilisateur();
    if (!u) return null;
    const { data } = await c.from(table)
      .upsert({ docker_id: u.id, ...champs }, { onConflict: 'docker_id' }).select().single();
    return data;
  }

  async function lire(table){
    const c = await client();
    const u = await utilisateur();
    if (!u) return null;
    const { data } = await c.from(table).select('*').eq('docker_id', u.id).maybeSingle();
    return data;
  }

  /* ---------- progression ---------- */
  function suivante(etape){
    const i = ETAPES.indexOf(etape);
    return i < 0 || i + 1 >= ETAPES.length ? 'jeu' : ETAPES[i + 1];
  }

  async function avancer(depuis){
    const cible = suivante(depuis);
    const rang = ETAPES.indexOf(docker && docker.etape ? docker.etape : 'personnage');
    if (ETAPES.indexOf(cible) > rang) await enregistrer({ etape: cible });
    location.href = PAGES[cible];
  }

  /* ---------- garde-fou d'une page ---------- */
  async function garder(etape){
    const u = await utilisateur();
    if (!u){ location.replace('index.html'); return null; }
    const d = await charger();
    if (!d){ location.replace('index.html'); return null; }
    const atteint = ETAPES.indexOf(d.etape || 'personnage');
    const ici = ETAPES.indexOf(etape);
    if (ici > atteint){ location.replace(PAGES[d.etape] || 'personnage.html'); return null; }
    return d;
  }

  async function deconnexion(){
    const c = await client();
    await c.auth.signOut();
    location.href = 'index.html';
  }

  /* ---------- avatar ---------- */
  const AVATAR_DEFAUT = { peau:2, cheveux:1, coiffure:1, barbe:2, tete:1, veste:0,
                          yeux:0, bouche:0, lunettes:0, boucle:0, motif:0, foulard:0 };

  function avatarDe(d, equip){
    const a = Object.assign({}, AVATAR_DEFAUT, (d && d.avatar) || {});
    if (equip){
      if (equip.casque_trop_grand) a.tete = 5;
      a.tshirt = !!equip.tshirt_troue;
    }
    return a;
  }


  /* ---------- le dessin de l'avatar ---------- */
  /* La même grille que dans personnage.html : 16 x 18 pixels.
     On la garde ici pour que toutes les pages dessinent pareil. */
  const GW = 16, GH = 18;
  const PEAUX = [
    { id:'p1', c:'#f2d3b6', o:'#d9ab86' },
    { id:'p2', c:'#e5bc96', o:'#c4936b' },
    { id:'p3', c:'#cf9b6f', o:'#a97449' },
    { id:'p4', c:'#a97048', o:'#83502e' },
    { id:'p5', c:'#7d4c2c', o:'#5c341a' },
    { id:'p6', c:'#4f2f1c', o:'#39200f' }
  ];
  const CHEVEUX = [
    { id:'c1', c:'#171310', o:'#000000' },
    { id:'c2', c:'#3d2b1e', o:'#241a12' },
    { id:'c3', c:'#6b4526', o:'#472c16' },
    { id:'c4', c:'#a8763c', o:'#7c5426' },
    { id:'c5', c:'#c9a86a', o:'#9c8049' },
    { id:'c6', c:'#8f2f1e', o:'#661d10' },
    { id:'c7', c:'#9aa3a8', o:'#727b80' }
  ];
  const VESTES = [
    { id:'v1', c:'#c8641f', o:'#8f4310', n:'Orange' },
    { id:'v2', c:'#1f5f8f', o:'#123f61', n:'Bleu' },
    { id:'v3', c:'#3d6b4a', o:'#264730', n:'Vert' },
    { id:'v4', c:'#8f2f2a', o:'#5f1c19', n:'Rouge' },
    { id:'v5', c:'#4a4f57', o:'#2f333a', n:'Gris' },
    { id:'v6', c:'#c9b47a', o:'#9a8654', n:'Sable' }
  ];
  const COIFFURES = ['Rasé','Court','Ondulé','Épais','Queue','Dégarni'];
  const BARBES    = ['Glabre','Bouc','Courte','Pleine','Moustache','Rouflaquettes'];
  const TETES     = ['Rien','Bonnet','Casquette','Casque','Bandana'];
  const YEUX = [
    { id:'y1', c:'#3b2415', n:'Marron' }, { id:'y2', c:'#6b4a1e', n:'Noisette' },
    { id:'y3', c:'#3f6b45', n:'Vert' },   { id:'y4', c:'#2f6b8f', n:'Bleu' },
    { id:'y5', c:'#6b7378', n:'Gris' },   { id:'y6', c:'#1a1208', n:'Noir' }
  ];
  const FOULARDS = [
    null,
    { id:'f1', c:'#b5342b', o:'#7d2119' }, { id:'f2', c:'#2f6b8f', o:'#1d4460' },
    { id:'f3', c:'#d8b24a', o:'#a2842e' }, { id:'f4', c:'#e8e2d4', o:'#b2ab9c' }
  ];
  const OR = '#e0b23a', ARGENT = '#c3cad0';
  const BOUCHES  = ['Neutre','Sourire','Serrée','Dents','Dent en or'];
  const LUNETTES = ['Sans','De vue','Soleil','Sécurité','Bandeau'];
  const BOUCLES  = ['Sans','Une','Deux or','Deux argent'];
  const MOTIFS   = ['Uni','Marinière','Gilet fluo','Bretelles'];
  const NOMS_FOULARD = ['Sans','Rouge','Bleu','Jaune','Blanc'];

  /* ---------- ÉTAT ---------- */


  /* ---------- PORTRAIT PIXEL ---------- */

  const BLANC = '#f6f1e6', NOIR = '#1a1208', BOUCHE = '#7a3a2e', COL = '#161d24';
  const CASQUE = '#e8a51e', CASQUE_O = '#b8790c';

  function zone(g, x0, y0, x1, y1, c){
    for (let y = Math.max(0, y0); y <= Math.min(GH - 1, y1); y++)
      for (let x = Math.max(0, x0); x <= Math.min(GW - 1, x1); x++) g[y][x] = c;
  }
  function pt(g, cases, c){
    for (const [x, y] of cases) if (x >= 0 && x < GW && y >= 0 && y < GH) g[y][x] = c;
  }

  function grilleAvatar(etat){
    const P = PEAUX[etat.peau], C = CHEVEUX[etat.cheveux], V = VESTES[etat.veste];
    const co = etat.coiffure, ba = etat.barbe, te = etat.tete;
    const chauve = co === 0, casque = te === 3, poil = !chauve && !casque;
    const bc = chauve ? '#3d2b1e' : C.c;
    const bo = chauve ? '#241a12' : C.o;
    const g = Array.from({ length: GH }, () => new Array(GW).fill(null));

    zone(g, 1, 14, 14, 17, V.c);
    zone(g, 2, 13, 13, 13, V.c);
    zone(g, 1, 14, 3, 17, V.o);
    zone(g, 12, 14, 14, 17, V.o);
    zone(g, 2, 13, 3, 13, V.o);
    zone(g, 12, 13, 13, 13, V.o);

    const mo = etat.motif;
    if (mo === 1){
      zone(g, 1, 15, 14, 15, '#e8e2d4'); zone(g, 1, 17, 14, 17, '#e8e2d4');
      zone(g, 1, 15, 3, 15, '#b2ab9c'); zone(g, 12, 15, 14, 15, '#b2ab9c');
      zone(g, 1, 17, 3, 17, '#b2ab9c'); zone(g, 12, 17, 14, 17, '#b2ab9c');
    }
    if (mo === 2){
      zone(g, 1, 14, 14, 14, '#d7e84a'); zone(g, 1, 16, 14, 16, '#d7e84a');
      zone(g, 1, 14, 3, 14, '#a8b82e'); zone(g, 12, 14, 14, 14, '#a8b82e');
      zone(g, 1, 16, 3, 16, '#a8b82e'); zone(g, 12, 16, 14, 16, '#a8b82e');
    }
    if (mo === 3){
      zone(g, 4, 14, 4, 17, '#3a2c1d'); zone(g, 11, 14, 11, 17, '#3a2c1d');
      pt(g, [[4,15],[11,15]], OR);
    }

    zone(g, 6, 11, 9, 12, P.c);
    zone(g, 6, 11, 9, 11, P.o);
    zone(g, 9, 11, 9, 12, P.o);

    pt(g, [[6,13],[9,13],[7,14],[8,14]], COL);
    pt(g, [[5,13],[10,13],[6,14],[9,14]], V.o);

    const F = FOULARDS[etat.foulard];
    if (F){
      zone(g, 5, 12, 10, 13, F.c);
      zone(g, 4, 13, 11, 13, F.c);
      pt(g, [[9,12],[10,12],[10,13],[11,13]], F.o);
      pt(g, [[7,13],[8,14]], F.o);
    }

    pt(g, [[3,6],[3,7],[12,6],[12,7]], P.c);
    pt(g, [[3,7],[12,7]], P.o);

    zone(g, 4, 3, 11, 9, P.c);
    zone(g, 5, 10, 10, 10, P.c);
    zone(g, 11, 3, 11, 9, P.o);
    pt(g, [[10,10]], P.o);

    if (ba === 1){ zone(g, 6, 9, 9, 10, bc); pt(g, [[9,9],[9,10]], bo); }
    if (ba === 2){
      zone(g, 4, 8, 11, 9, bc); zone(g, 5, 10, 10, 10, bc);
      pt(g, [[4,7],[11,7],[11,8],[11,9],[10,10]], bo);
    }
    if (ba === 3){
      zone(g, 4, 7, 11, 10, bc); zone(g, 5, 11, 10, 11, bc);
      pt(g, [[4,6],[11,6]], bc);
      pt(g, [[11,6],[11,7],[11,8],[11,9],[11,10],[10,11]], bo);
    }
    if (ba === 5){
      zone(g, 4, 5, 4, 8, bc); zone(g, 11, 5, 11, 8, bc);
      pt(g, [[11,5],[11,6],[11,7],[11,8]], bo);
    }

    const oeil = YEUX[etat.yeux].c;
    pt(g, [[5,5],[6,5],[9,5],[10,5]], BLANC);
    pt(g, [[6,5],[9,5]], oeil);
    pt(g, [[7,7],[8,7]], P.o);

    const bo2 = etat.bouche;
    if (bo2 === 0){ zone(g, 6, 9, 9, 9, BOUCHE); pt(g, [[6,9],[9,9]], P.o); }
    if (bo2 === 1){ zone(g, 6, 9, 9, 9, BOUCHE); pt(g, [[5,8],[10,8]], P.o); }
    if (bo2 === 2){ zone(g, 6, 9, 9, 9, P.o); }
    if (bo2 === 3){ zone(g, 6, 9, 9, 9, BOUCHE); pt(g, [[7,9],[8,9]], BLANC); }
    if (bo2 === 4){ zone(g, 6, 9, 9, 9, BOUCHE); pt(g, [[7,9]], BLANC); pt(g, [[8,9]], OR); }

    if (ba === 1 || ba === 3 || ba === 4){ zone(g, 6, 8, 9, 8, bc); pt(g, [[9,8]], bo); }
    if (ba === 4) zone(g, 6, 9, 9, 9, BOUCHE);

    pt(g, [[5,4],[6,4],[9,4],[10,4]], poil ? bc : P.o);
    if (poil) pt(g, [[10,4]], bo);

    if (poil){
      if (co === 1){
        zone(g, 4, 2, 11, 2, C.c);
        pt(g, [[3,3],[3,4],[12,3],[12,4]], C.c);
        pt(g, [[11,2],[12,3],[12,4]], C.o);
      }
      if (co === 2){
        zone(g, 5, 1, 10, 1, C.c); zone(g, 4, 2, 11, 2, C.c);
        pt(g, [[3,3],[3,4],[12,3],[12,4]], C.c);
        pt(g, [[5,2],[7,2],[9,2],[6,1],[9,1]], C.o);
        pt(g, [[11,2],[12,3],[12,4]], C.o);
      }
      if (co === 3){
        zone(g, 4, 1, 11, 2, C.c); zone(g, 3, 2, 3, 5, C.c); zone(g, 12, 2, 12, 5, C.c);
        pt(g, [[5,0],[6,0],[7,0],[8,0],[9,0],[10,0]], C.c);
        pt(g, [[10,0],[11,1],[11,2],[12,2],[12,3],[12,4],[12,5]], C.o);
      }
      if (co === 4){
        zone(g, 4, 2, 11, 2, C.c);
        pt(g, [[3,3],[12,3]], C.c);
        pt(g, [[12,4],[13,4],[13,5],[13,6],[12,6]], C.c);
        pt(g, [[11,2],[13,5],[13,6]], C.o);
      }
      if (co === 5){
        zone(g, 6, 2, 9, 2, C.c);
        pt(g, [[4,3],[3,3],[3,4],[11,3],[12,3],[12,4]], C.c);
        pt(g, [[9,2],[11,3],[12,3],[12,4]], C.o);
      }
    }

    const lu = etat.lunettes;
    if (lu === 1){
      pt(g, [[4,5],[7,5],[8,5],[11,5]], '#2b2119');
      pt(g, [[5,5],[10,5]], BLANC);
      pt(g, [[6,5],[9,5]], oeil);
      pt(g, [[3,5],[12,5]], '#2b2119');
    }
    if (lu === 2){
      zone(g, 4, 5, 11, 5, '#1e1a16');
      pt(g, [[5,5],[9,5]], '#4a4038');
      pt(g, [[3,5],[12,5],[7,5],[8,5]], '#2b2119');
    }
    if (lu === 3){
      zone(g, 4, 5, 11, 5, '#cfe0a8');
      pt(g, [[6,5],[9,5]], oeil);
      pt(g, [[7,5],[8,5]], '#8fa36a');
      pt(g, [[3,5],[12,5]], '#8fa36a');
    }
    if (lu === 4){
      pt(g, [[9,5],[10,5],[11,5],[12,5]], '#1e1a16');
      pt(g, [[11,4],[12,4],[8,4]], '#1e1a16');
    }

    if (etat.boucle === 1) pt(g, [[12,8]], OR);
    if (etat.boucle === 2) pt(g, [[12,8],[3,8]], OR);
    if (etat.boucle === 3) pt(g, [[12,8],[3,8]], ARGENT);

    if (te === 1){
      pt(g, [[7,0],[8,0]], V.c);
      zone(g, 4, 1, 11, 1, V.o);
      zone(g, 3, 2, 12, 3, V.c);
      pt(g, [[11,1],[12,2],[12,3]], V.o);
      zone(g, 3, 3, 12, 3, V.o);
    }
    if (te === 2){
      zone(g, 4, 0, 11, 1, V.c);
      zone(g, 3, 2, 12, 2, V.o);
      zone(g, 2, 3, 13, 3, V.o);
      pt(g, [[11,0],[11,1],[12,2],[13,3]], V.o);
      pt(g, [[4,0],[5,0]], V.c);
    }
    if (te === 3){
      zone(g, 4, 0, 11, 1, CASQUE);
      zone(g, 3, 2, 12, 2, CASQUE);
      zone(g, 2, 3, 13, 3, CASQUE_O);
      pt(g, [[7,0],[8,0],[7,1],[8,1]], CASQUE_O);
      pt(g, [[11,0],[11,1],[12,2]], CASQUE_O);
    }
    if (te === 4){
      zone(g, 4, 1, 11, 2, V.c);
      pt(g, [[3,2],[12,2],[3,3],[12,3]], V.c);
      pt(g, [[5,1],[8,1],[10,2]], V.o);
      pt(g, [[13,3],[13,4],[12,4]], V.c);
      pt(g, [[11,1],[11,2],[12,2],[13,4]], V.o);
    }
    return g;
  }



  /* rend l'avatar d'un docker en SVG, à la taille voulue */
  function avatarSVG(d, equip){
    const etat = avatarDe(d, equip);
    const g = grilleAvatar(etat);
    let s = '<svg viewBox="0 0 ' + GW + ' ' + GH + '" xmlns="http://www.w3.org/2000/svg" '
      + 'shape-rendering="crispEdges">';
    /* le fond, comme dans le créateur */
    s += '<rect width="' + GW + '" height="' + GH + '" fill="#dfe8ee"/>';
    s += '<rect y="' + (GH - 6) + '" width="' + GW + '" height="6" fill="#cfdce4"/>';
    for (let y = 0; y < GH; y++)
      for (let x = 0; x < GW; x++)
        if (g[y][x])
          s += '<rect x="' + x + '" y="' + y + '" width="1" height="1" fill="' + g[y][x] + '"/>';
    return s + '</svg>';
  }

  /* ---------- les actions du jeu ----------
     Le client ne modifie plus rien lui-même : il demande au serveur,
     qui vérifie les règles et décide. */
  async function agir(nom, args){
    const c = await client();
    const { data, error } = await c.rpc(nom, args || {});
    if (error) return { ok:false, pourquoi:'erreur', message:error.message };
    return data || { ok:false, pourquoi:'vide' };
  }

  return { client, utilisateur, charger, enregistrer, poser, lire, agir,
           avancer, garder, deconnexion, avatarDe, avatarSVG, ETAPES, PAGES,
           get docker(){ return docker; } };
})();
