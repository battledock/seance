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

  return { client, utilisateur, charger, enregistrer, poser, lire,
           avancer, garder, deconnexion, avatarDe, ETAPES, PAGES,
           get docker(){ return docker; } };
})();
