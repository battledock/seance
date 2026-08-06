import { Etat } from "../game-state.js?v=2ab9afab";
import { accomplitMission, estDebloque, sonNiveau } from "../progression.js?v=2ab9afab";
import { rpc, sbFetch } from "../supabase-client.js?v=2ab9afab";
import { icone } from "../ui/icons.js?v=2ab9afab";

/* ============================================================
   CONFISERIE — débloquée au niveau 5
   Structure prête pour produits, stocks, employés et améliorations.
   ============================================================ */
const PRODUITS_CONFISERIE = [
  {id:"popcorn", nom:"Petit popcorn", prix:3, cout:0.8, ic:"billet", part:0.6,
   desc:"Beurre, sel, et le bruit du tracteur de Bob."},
  {id:"boisson", nom:"Boisson",       prix:2, cout:0.5, ic:"piece",  part:0.4,
   desc:"Fraîche. Enfin, tiède quand la ventilation lâche."}
];
const TAUX_ACHAT_BASE = 0.25;
const STYLES_COMPTOIR = {
  bois:   {nom:"Comptoir en bois", couleur:"#6b4a2a"},
  laiton: {nom:"Comptoir laiton",  couleur:"#caa24a"},
  marbre: {nom:"Comptoir marbre",  couleur:"#d8d2c4"}
};

function confiserieActive(){
  return estDebloque("confiserie") && !!(Etat.confiserie?.active);
}
function tauxAchat(){
  const c = Etat.confiserie || {};
  return Math.min(0.6, Number(c.taux_achat ?? TAUX_ACHAT_BASE)
    + (Number(c.niveau_popcorn||1) - 1) * 0.03
    + (Number(c.niveau_boissons||1) - 1) * 0.02);
}

async function chargeConfiserie(){
  try{
    const d = await sbFetch(`confiserie?cinema_id=eq.${Etat.cinema.id}&select=*`);
    if(Array.isArray(d) && d.length){ Etat.confiserie = d[0]; return d[0]; }
  }catch(e){}
  Etat.confiserie = Etat.confiserie || {active:false, taux_achat:TAUX_ACHAT_BASE,
    niveau_popcorn:1, niveau_boissons:1, style_comptoir:"bois", total_popcorn:0};
  return Etat.confiserie;
}

/* activée automatiquement au niveau 5, une seule fois */
async function activeConfiserieSiBesoin(){
  if(!estDebloque("confiserie")) return false;
  await chargeConfiserie();
  if(Etat.confiserie?.active) return false;
  try{
    /* la ligne est créée par le serveur ; on n'active que le comptoir */
    if(!Etat.confiserie?.cinema_id) await rpc("reparer_partie", {p_cinema_id: Etat.cinema.id});
    await sbFetch(`confiserie?cinema_id=eq.${Etat.cinema.id}`, {method:"PATCH",
      prefer:"return=minimal", body:{active:true}});
    await chargeConfiserie();
    return !!Etat.confiserie?.active;
  }catch(e){ return false; }
}

/* ---------- calcul des ventes d'une séance (appelé par la simulation) ---------- */
function ventesConfiserie(spectateurs, satisfaction, rng){
  if(!confiserieActive() || spectateurs <= 0) return {articles:0, recettes:0, marge:0, detail:{}};
  /* une salle contente consomme davantage */
  const modif = 0.8 + (satisfaction/100) * 0.45;
  const acheteurs = Math.round(spectateurs * tauxAchat() * modif * (rng ? (0.9 + rng()*0.2) : 1));
  let articles = 0, recettes = 0, marge = 0;
  const detail = {};
  PRODUITS_CONFISERIE.forEach(p=>{
    const n = Math.round(acheteurs * p.part);
    detail[p.id] = n;
    articles += n;
    recettes += n * p.prix;
    marge    += n * (p.prix - p.cout);
  });
  return {articles, recettes:Math.round(recettes), marge:Math.round(marge), detail};
}

/* cumul du popcorn vendu — sert à la mission « vendre 20 popcorns » */
async function cumuleVentes(bilan){
  /* le total est incrémenté par le serveur ; on ne vérifie que la mission */
  if(!confiserieActive()) return;
  if(Number(Etat.confiserie?.total_popcorn||0) >= 20 && typeof accomplitMission === "function")
    await accomplitMission("m_popcorn");
  return;
}

/* ---------- cinématique d'inauguration ---------- */
function inaugurationConfiserie(){
  const o = document.createElement("div");
  o.className = "voileNiveau";
  o.innerHTML = `
    <div class="carteNiveau palier">
      <div class="rayons"></div>
      <div class="niveauChiffre"><span>Niveau 5</span><b>${icone("billet","icoGrandEcran")}</b></div>
      <div class="niveauTitre">La confiserie ouvre</div>
      <div class="niveauCeremonie">Inauguration du comptoir</div>
      <div class="niveauBob">
        <span class="bobRond"><svg viewBox="30 40 60 60">
          <circle cx="60" cy="70" r="26" fill="#f0c9a0"/>
          <path d="M40 78 Q50 86 60 79 Q70 86 80 78 Q72 92 60 84 Q48 92 40 78" fill="#4a3527"/>
          <path d="M44 60 Q51 55 57 59 M63 59 Q69 55 76 60" stroke="#4a3527" stroke-width="4" fill="none" stroke-linecap="round"/>
          <circle cx="51" cy="66" r="2.6" fill="#1c1210"/><circle cx="69" cy="66" r="2.6" fill="#1c1210"/>
          <path d="M34 56 Q60 34 86 56 L86 50 Q60 28 34 50 Z" fill="#571520"/>
          <rect x="52" y="44" width="16" height="7" rx="2" fill="#e8b84b"/>
        </svg></span>
        <span class="bobDit">J'ai retrouvé la machine à popcorn. Elle fait un bruit de tracteur, mais elle fait du popcorn.</span>
      </div>
      <div class="titreRecompenses">Au comptoir</div>
      <div class="listeRecompenses">
        ${PRODUITS_CONFISERIE.map((p,i)=>`<div class="recompense" style="animation-delay:${.35+i*.18}s">
          ${icone(p.ic)}<span><b>${p.nom} — ${p.prix} €</b><small>${p.desc}</small></span></div>`).join("")}
      </div>
      <button class="btnOr btnNiveau" onclick="this.closest('.voileNiveau').remove()">Découvrir</button>
    </div>`;
  document.body.appendChild(o);
  if(typeof sonNiveau === "function") sonNiveau();
}

/* ---- exports ---- */
export {
  PRODUITS_CONFISERIE,
  STYLES_COMPTOIR,
  TAUX_ACHAT_BASE,
  activeConfiserieSiBesoin,
  chargeConfiserie,
  confiserieActive,
  cumuleVentes,
  inaugurationConfiserie,
  tauxAchat,
  ventesConfiserie
};
