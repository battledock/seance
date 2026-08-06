import { obtenirNiveauVisuelCinema } from "./upgrades.js?v=2ab9afab";
import { Etat, depense } from "../game-state.js?v=2ab9afab";
import { majHeaderArgent } from "../navigation.js?v=2ab9afab";
import { niveauActuel } from "../progression.js?v=2ab9afab";
import { salles } from "../rooms.js?v=2ab9afab";
import { sbFetch } from "../supabase-client.js?v=2ab9afab";

/* ============================================================
   PERSONNALISATION — catalogue, possession, sélection
   Cosmétique uniquement : aucun bonus de gameplay ici.
   ============================================================ */
/* ------------------------------------------------------------
   Le catalogue s'est réduit à ce qui se voit réellement.

   Quatre catégories en ont été retirées — enseigne, façade, hall,
   extérieur : trente options, jusqu'à 700 €, dont AUCUNE n'était
   lue par un dessin. Le joueur payait pour un changement qui ne
   se produisait nulle part.

   Elles reviendront quand elles seront branchées, pas avant.
   Les choix déjà faits restent en base : rien n'est perdu.
   ------------------------------------------------------------ */
const CATALOGUE_PERSO = {
  sieges: {
    nom:"Fauteuils", ic:"fauteuil", cleDeblocage:"couleurs_sieges", champ:"couleur_sieges",
    items:[
      {id:"rouge",    nom:"Velours rouge",  desc:"Le classique absolu.",     niveauRequis:4, cout:0, couleur:"#a82b3d"},
      {id:"bordeaux", nom:"Bordeaux",       desc:"Plus sombre, plus feutré.",niveauRequis:4, cout:0, couleur:"#6e1424"},
      {id:"bleu",     nom:"Bleu nuit",      desc:"Inattendu et chic.",       niveauRequis:4, cout:0, couleur:"#2a3a6b"},
      {id:"vert",     nom:"Vert bouteille", desc:"Comme un vieux fumoir.",   niveauRequis:4, cout:0, couleur:"#2a5a42"}
    ]
  }
};


/* ---------- état ---------- */
const PERSO_DEFAUT = {style_enseigne:"classic", style_facade:"bordeaux", couleur_sieges:"rouge",
  plaque:"aucune", hall:{}, exterieur:[]};

async function chargePersonnalisation(){
  try{
    const d = await sbFetch(`personnalisation?cinema_id=eq.${Etat.cinema.id}&select=*`);
    if(Array.isArray(d) && d.length) Etat.perso = normalisePerso(d[0]);
    else{
      const res = await sbFetch("personnalisation", {method:"POST",
        body:{cinema_id:Etat.cinema.id, user_id:Etat.session?.user_id, ...PERSO_DEFAUT}});
      Etat.perso = normalisePerso((Array.isArray(res)&&res[0]) || PERSO_DEFAUT);
    }
  }catch(e){ Etat.perso = normalisePerso(Etat.perso || PERSO_DEFAUT); }
  try{
    const p = await sbFetch(`possessions?cinema_id=eq.${Etat.cinema.id}&select=cle`);
    Etat.possessions = (Array.isArray(p)?p:[]).map(x=>x.cle);
  }catch(e){ Etat.possessions = Etat.possessions || []; }
  return Etat.perso;
}
/* tolère les anciennes parties sans état de personnalisation */
function normalisePerso(o){
  const r = {...PERSO_DEFAUT, ...(o||{})};
  if(typeof r.hall === "string"){ try{ r.hall = JSON.parse(r.hall); }catch(e){ r.hall = {}; } }
  if(typeof r.exterieur === "string"){ try{ r.exterieur = JSON.parse(r.exterieur); }catch(e){ r.exterieur = []; } }
  if(!r.hall || typeof r.hall !== "object") r.hall = {};
  if(!Array.isArray(r.exterieur)) r.exterieur = [];
  return r;
}

/* ---------- possession ---------- */
function possede(cat, id){
  const cle = cat + ":" + id;
  const item = itemPerso(cat, id);
  if(!item) return false;
  if(item.reclamee) return (Etat.possessions||[]).includes(cle);
  if((item.cout||0) === 0 && niveauActuel() >= item.niveauRequis) return true;   /* offert au déblocage */
  return (Etat.possessions||[]).includes(cle);
}
function itemPerso(cat, id){
  const c = CATALOGUE_PERSO[cat];
  if(!c) return null;
  if(c.emplacements) return c.zones.flatMap(z=>z.objets).find(o=>o.id===id) || null;
  return c.items.find(i=>i.id===id) || null;
}
function accessible(cat, id){
  const item = itemPerso(cat, id);
  if(!item) return {ok:false, raison:"inconnu"};
  if(niveauActuel() < item.niveauRequis) return {ok:false, raison:"niveau", niveau:item.niveauRequis};
  if(!possede(cat, id)) return {ok:false, raison:"achat", cout:item.cout};
  return {ok:true};
}

async function donnePersonnalisation(cle, origine){
  const c = "plaque:" + cle;
  if((Etat.possessions||[]).includes(c)) return;
  try{
    await sbFetch("possessions", {method:"POST", prefer:"return=minimal", body:{
      cinema_id:Etat.cinema.id, user_id:Etat.session?.user_id, cle:c,
      categorie:"plaque", origine:origine||"niveau"}});
    Etat.possessions = [...(Etat.possessions||[]), c];
  }catch(e){}
}

/* achat d'un élément payant — enregistré comme transaction */
async function achetePersonnalisation(cat, id){
  const item = itemPerso(cat, id);
  if(!item || possede(cat, id)) return false;
  if(niveauActuel() < item.niveauRequis) return false;
  try{
    await depense({montant:item.cout, categorie:"personnalisation", details:{categorie:cat, item:id}});
  }catch(e){ return {erreur:"argent"}; }
  try{
    await sbFetch("possessions", {method:"POST", prefer:"return=minimal", body:{
      cinema_id:Etat.cinema.id, user_id:Etat.session?.user_id,
      cle:cat+":"+id, categorie:cat, origine:"achat"}});
  }catch(e){}
  Etat.possessions = [...(Etat.possessions||[]), cat+":"+id];
  majHeaderArgent();
  return true;
}

/* application d'un élément possédé — gratuite */
async function appliquePersonnalisation(cat, id, zone){
  const conf = CATALOGUE_PERSO[cat];
  if(!conf) return false;
  const a = accessible(cat, id);
  if(!a.ok) return a;

  let corps;
  if(conf.emplacements){
    Etat.perso.hall = {...Etat.perso.hall, [zone]: id};
    corps = {hall: Etat.perso.hall};
  }else if(conf.multiple){
    const liste = Etat.perso.exterieur.includes(id)
      ? Etat.perso.exterieur.filter(x=>x!==id)
      : [...Etat.perso.exterieur, id];
    Etat.perso.exterieur = liste;
    corps = {exterieur: liste};
  }else{
    Etat.perso[conf.champ] = id;
    corps = {[conf.champ]: id};
  }
  try{
    await sbFetch(`personnalisation?cinema_id=eq.${Etat.cinema.id}`, {method:"PATCH",
      prefer:"return=minimal", body:corps});
  }catch(e){ return {erreur:"reseau"}; }
  return {ok:true};
}

/* ============================================================
   APPARENCE DE LA FAÇADE — une seule fonction, lue par jeu.html
   ============================================================ */
function construireApparenceFacade(cinema, perso, salles){
  const p = normalisePerso(perso);
  const styleF = CATALOGUE_PERSO.facade.items.find(x=>x.id===p.style_facade) || CATALOGUE_PERSO.facade.items[0];
  const styleE = CATALOGUE_PERSO.enseigne.items.find(x=>x.id===p.style_enseigne) || CATALOGUE_PERSO.enseigne.items[0];
  const visuel = obtenirNiveauVisuelCinema(cinema, salles || []);
  return {
    mur: styleF.mur, murNuit: styleF.murNuit, filetsOr: !!styleF.filetsOr,
    enseigneCouleur: styleE.couleur, enseigneHalo: styleE.halo,
    exterieur: p.exterieur || [],
    plaque: p.plaque && p.plaque !== "aucune" ? p.plaque : null,
    aile: visuel.aile, affiches: visuel.affiches,
    eclairage: visuel.eclairage, entretien: visuel.entretien
  };
}
function couleurSieges(){
  const it = CATALOGUE_PERSO.sieges.items.find(x=>x.id===(Etat.perso?.couleur_sieges||"rouge"));
  return it ? it.couleur : "#a82b3d";
}

/* clé de couleur des fauteuils, pour les rendus qui ont besoin du nom */
function couleurSiegesCle(){
  return (Etat.perso && Etat.perso.couleur_sieges) || "rouge";
}

/* ---- exports ---- */
export {
  CATALOGUE_PERSO,
  PERSO_DEFAUT,
  accessible,
  achetePersonnalisation,
  appliquePersonnalisation,
  chargePersonnalisation,
  construireApparenceFacade,
  couleurSieges,
  couleurSiegesCle,
  donnePersonnalisation,
  itemPerso,
  normalisePerso,
  possede
};
