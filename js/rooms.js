/* Les salles : vue en coupe et améliorations. */

import { accomplitMission, bulleXP, chargeProgression, infoNiveau, majBarreXPHeader, montreMonteeNiveau, synchroniseDeblocages } from "./progression.js?v=2ab9afab";
import { activeConfiserieSiBesoin, inaugurationConfiserie } from "./data/concessions.js?v=2ab9afab";
import { chargeCinema } from "./game-state.js?v=2ab9afab";
import { majHeaderArgent } from "./navigation.js?v=2ab9afab";
import { messageErreur } from "./supabase-client.js?v=2ab9afab";
import {
  AMELIORATIONS,
  COUT_NETTOYAGE,
  TYPES_SALLES,
  apercuSalle,
  coutReparation,
  libelleRisque,
  niveauEquipement,
  obtenirBonusSalle,
  prochaineAmelioration,
  prochaineExtension
} from "./data/upgrades.js?v=2ab9afab";
import { Etat, fmtArgent, rafraichirEtat } from "./game-state.js?v=2ab9afab";
import { bobCompact } from "./navigation.js?v=2ab9afab";
import { niveauActuel, sonNiveau } from "./progression.js?v=2ab9afab";
import { appelSecurise, idOperation, rpc, sbFetch } from "./supabase-client.js?v=2ab9afab";
import { echappe } from "./ui/emblems.js?v=2ab9afab";
import { icone } from "./ui/icons.js?v=2ab9afab";
import { apercuEquipement, brancheZonesSalle, salleEnCoupe } from "./ui/room-view.js?v=2ab9afab";

/* ============================================================
   SALLES — consultation, gestion, achats
   Toute la configuration vit dans ameliorations.js
   ============================================================ */
let salles = [];
let salleOuverte = null;
let salleCourante = null;
/* salleCourante porte l'identifiant de l'onglet ouvert ; laSalle() rend l'objet */
function laSalle(){
  const l = Etat.salles || salles || [];
  return l.find(s => String(s.id) === String(salleCourante)) || l[0] || null;
}
let achatEnCours = false;

async function initSalles(){
  await chargeSalles();
  if(salles.length === 0) await creePremiereSalle();
  Etat.salles = salles;
  if(!salleCourante && salles.length) salleCourante = salles[0].id;
  salleOuverte = laSalle();

  rendOngletsSalles();
  rendVueSalle();
  rendEtatSalle(laSalle());
  rendConstruction();
}



async function chargeSalles(){
  const d = await sbFetch(`salles?cinema_id=eq.${Etat.cinema.id}&select=*&order=cree_le`);
  salles = Array.isArray(d) ? d : [];
  Etat.salles = salles;
}

/* la salle 1 est créée par le serveur (fonction reparer_partie) */
async function creePremiereSalle(){
  try{ await rpc("reparer_partie", {p_cinema_id: Etat.cinema.id}); }catch(e){}
  await chargeSalles();
}

function bulleSalles(t){
  const z = document.getElementById("zoneBob");
  z.innerHTML = ""; z.appendChild(bobCompact(t));
}
function conseilSalles(){
  const sale = salles.find(s=>Number(s.proprete ?? 100) < 60);
  if(sale) return "Entre les rangs 3 et 4. Toujours. Je ne veux même plus savoir pourquoi.";
  const abime = salles.find(s=>Number(s.etat ?? 100) < 60);
  if(abime) return `${abime.nom} fatigue. Une réparation avant que quelque chose lâche en pleine séance ?`;
  const s = salles[0];
  if(s && niveauEquipement(s,"sieges") === 0) return "Les fauteuils datent de l'ouverture. Le 12 grince, les autres réfléchissent à le faire.";
  return "Belle salle. Presque trop belle pour le quartier. Presque.";
}

/* ============================================================
   LISTE DES SALLES
   ============================================================ */
/* On ne liste plus les salles : on en visite une, en coupe.
   Les onglets servent à passer de l'une à l'autre. */


function rendListeSalles(){
  if(!salles.length){ rendConstruction(); return; }
  if(!salleCourante || !salles.some(s=>String(s.id) === String(salleCourante)))
    salleCourante = salles[0].id;
  rendOngletsSalles();
  rendVueSalle();
  rendConstruction();
}

function rendOngletsSalles(){
  const el = document.getElementById("ongletsSalles");
  if(!el) return;
  const salles = Etat.salles || [];
  el.innerHTML = salles.map(s=>`
    <button class="${s.id === salleCourante ? "on" : ""}" onclick="changeSalle('${s.id}')">
      ${icone(s.type === "4dx" ? "etoile" : "fauteuil")}${echappe(s.nom)}
      <small>${s.capacite} pl.</small></button>`).join("")
    + (salles.length < 5
       ? `<button class="plus" onclick="vaConstruire()">+ Construire</button>` : "");
}

function vaConstruire(){
  const z = document.getElementById("zoneConstruction");
  if(z) z.scrollIntoView({behavior:"smooth", block:"center"});
}
function changeSalle(id){
  salleCourante = id;
  salleOuverte = laSalle();
  rendOngletsSalles();
  rendVueSalle();
  rendEtatSalle(laSalle());
  if(typeof douxDebut === "function") douxDebut(document.getElementById("carteSalle"));
}

function rendVueSalle(){
  const s = laSalle();
  const el = document.getElementById("vueSalle");
  if(!el || !s) return;

  /* la salle est montrée telle qu'elle sera ce soir : remplissage prévu */
  const prevue = (Etat.seancesJour || []).find(x => x.salle_id === s.id);
  el.innerHTML = salleEnCoupe(s, {
    lumiere: (Etat.journee && Etat.journee.statut === "running") ? "projection" : "tamise",
    public: prevue && s.capacite
      ? Math.round((Number(prevue.spectateurs) || 0) / s.capacite * 100) : 0
  });
  brancheZonesSalle(el, s);

  const b = document.getElementById("badgeSalle");
  if(b){
    const sale = Number(s.proprete) < 45, use = Number(s.etat) < 50;
    b.className = "badgeSalle";
    b.innerHTML = `<i style="background:${sale || use ? "#b5762c" : "#3f9e5c"}"></i>` +
      (sale ? "Salle à nettoyer" : use ? "Salle fatiguée"
       : s.type === "4dx" ? "Salle 4DX" : "Salle en état");
  }
}

/* sous la salle : propreté, état, entretien — en langage clair */
function anneauSalle(pct, couleur){
  const c = Math.max(0, Math.min(100, pct));
  return `<svg viewBox="0 0 40 40" aria-hidden="true">
    <circle cx="20" cy="20" r="17" fill="none" stroke="rgba(36,26,18,.1)" stroke-width="3.4"/>
    <circle cx="20" cy="20" r="17" fill="none" stroke="${couleur}" stroke-width="3.4"
      stroke-dasharray="${(c*1.068).toFixed(0)} 107" stroke-linecap="round"
      transform="rotate(-90 20 20)"/></svg>`;
}

function rendEtatSalle(s){
  if(!s) return;
  const prop = Number(s.proprete) || 0, etat = Number(s.etat) || 0;
  const motProp = prop >= 85 ? "Impeccable" : prop >= 70 ? "Correcte"
                : prop >= 45 ? "Ça se voit" : "À nettoyer";
  const motEtat = etat >= 85 ? "Comme neuve" : etat >= 70 ? "Bon état"
                : etat >= 50 ? "Grincements" : "À réparer";
  const coul = v => v < 45 ? "#a83a2a" : v < 70 ? "#b5762c" : "#2f7d4a";

  document.getElementById("chiffresSalle").innerHTML = `
    <div class="chiffre">${anneauSalle(prop, coul(prop))}
      <b>${prop} %</b><span>${motProp}</span></div>
    <div class="chiffre">${anneauSalle(etat, coul(etat))}
      <b>${etat} %</b><span>${motEtat}</span></div>
    <div class="chiffre">${anneauSalle(Math.min(100, s.capacite / 1.25), "#8c2331")}
      <b>${s.capacite}</b><span>Places</span></div>`;

  /* les équipements */
  const cles = Object.keys(AMELIORATIONS);
  const auMax = cles.filter(c => niveauEquipement(s, c) >= 3).length;
  document.getElementById("compteEquip").textContent =
    auMax > 0 ? auMax + " au maximum" : cles.length + " à faire évoluer";

  document.getElementById("equipements").innerHTML = cles.map(cle=>{
    const a = AMELIORATIONS[cle];
    const n = niveauEquipement(s, cle), suiv = n + 1;
    const max = suiv >= a.niveaux.length;
    const p = max ? null : a.niveaux[suiv];
    const requis = p && p.niveauJoueurRequis ? p.niveauJoueurRequis : 0;
    const bloque = !max && niveauActuel() < requis;
    return `<button class="equip ${max?"max":""} ${bloque?"bloque":""}"
      onclick="ouvrePanneauEquipement('${cle}')">
      <span class="prix">${max ? "Au max" : bloque ? "Niv " + requis : fmtArgent(p.cout)}</span>
      ${icone(a.icone)}
      <b>${echappe(a.nom)}</b><small>${echappe(a.niveaux[n].nom)}</small>
      <span class="points">${[1,2,3].map(k=>
        `<i class="${k<=n?"plein":""}"></i>`).join("")}</span>
    </button>`;}).join("");

  /* l'entretien, au tarif de cette salle */
  const nettoyage = s.type === "4dx" ? 60 : 25;
  const reparation = Math.ceil((100 - etat) * 5 * (s.type === "4dx" ? 2 : 1));
  const ext = Number(s.extensions) || 0;
  const placesExt = [10, 15, 20][ext];

  document.getElementById("entretien").innerHTML = `
    <button class="btnEntretien" ${prop >= 100 ? "disabled" : ""}
      onclick="entretien('nettoyage')">${icone("outil")}
      <span><b>Nettoyer</b><small>${prop >= 100 ? "déjà propre"
        : fmtArgent(nettoyage) + " · remet à 100 %"}</small></span></button>

    <button class="btnEntretien" ${etat >= 100 ? "disabled" : ""}
      onclick="entretien('reparation')">${icone("batiment")}
      <span><b>Réparer</b><small>${etat >= 100 ? "en bon état"
        : fmtArgent(reparation) + " · remet à neuf"}</small></span></button>

    <button class="btnEntretien large" ${ext >= 3 ? "disabled" : ""}
      onclick="acheteExtension()">${icone("spectateurs")}
      <span><b>Agrandir la salle</b><small>${ext >= 3
        ? "trois extensions faites, c'est le maximum"
        : "+" + placesExt + " places · extension " + (ext+1) + " sur 3"}</small></span></button>`;
}


function ligneEquip(salle, cle){
  const n = niveauEquipement(salle, cle);
  const a = AMELIORATIONS[cle];
  return `<div class="eqLigne">
    ${icone(a.icone)}
    <span class="eqNom">${a.nom}</span>
    <span class="eqJauge">${[0,1,2,3].slice(1).map(i=>`<i class="${i<=n?'plein':''}"></i>`).join("")}</span>
    <span class="eqNiv">${n===0?"—":"niv "+n}</span>
  </div>`;
}

function carteSalle(s){
  const bonus = obtenirBonusSalle(s);
  const travaux = s.travaux_fin && new Date(s.travaux_fin).getTime() > Date.now();
  const type = TYPES_SALLES[s.type || "standard"];
  return `<section class="carteEcran carteSalle">
    <h2>${s.nom}<span class="capBadge">${icone("fauteuil")} ${s.capacite} places</span></h2>
    <div class="salleType">${type.nom}</div>
    ${travaux ? `<div class="bandeauTravaux">${icone("outil")} Travaux en cours — disponible au jour suivant</div>` : ""}
    <div class="apercuBoite">${apercuSalle(s)}</div>
    <div class="grilleEquip">
      ${Object.keys(AMELIORATIONS).map(cle=>ligneEquip(s, cle)).join("")}
    </div>
    <div class="etatSalle">
      <div class="etLigne"><span>Propreté</span>
        <span class="etPiste"><i class="${classeEtat(s.proprete)}" style="width:${Number(s.proprete ?? 100)}%"></i></span>
        <b>${Math.round(Number(s.proprete ?? 100))} %</b></div>
      <div class="etLigne"><span>État général</span>
        <span class="etPiste"><i class="${classeEtat(s.etat)}" style="width:${Number(s.etat ?? 100)}%"></i></span>
        <b>${Math.round(Number(s.etat ?? 100))} %</b></div>
    </div>
    <div class="resumeBonus">
      <span>${icone("etoile")} satisfaction <b>+${bonus.satisfaction}</b></span>
      <span>${icone("cloche")} incident <b>${libelleRisque(bonus.risqueIncident)}</b></span>
    </div>
    <button class="btnOr btnGerer" onclick="ouvreSalle('${s.id}')">Gérer la salle</button>
  </section>`;
}
function classeEtat(v){
  const n = Number(v ?? 100);
  return n >= 70 ? "bon" : n >= 40 ? "moyen" : "mauvais";
}

/* ============================================================
   CONSTRUCTION D'UNE NOUVELLE SALLE
   ============================================================ */
function rendConstruction(){
  const z = document.getElementById("zoneConstruction");
  if(!z) return;
  const n = (Etat.salles || []).length;
  if(n >= 5){
    z.innerHTML = `<div class="batimentPlein">Le bâtiment est plein.
      Cinq salles, c'est tout ce que le bâtiment peut contenir.</div>`;
    return;
  }

  const niveau = niveauActuel();
  const suite = tarifSalle(n + 1);
  const dejaDx = (Etat.salles || []).some(s => s.type === "4dx");
  const dx = dejaDx ? null : tarif4dx();

  z.innerHTML = `
    <div class="titreSection"><h2>Construire</h2><span>${5 - n} emplacement(s)</span></div>

    <button class="construire" ${niveau < suite.niveau ? "disabled" : ""}
      onclick="confirmeConstruction('standard')">
      <span class="agIco">${icone("batiment")}</span>
      <span><b>Salle ${n + 1}</b><small>${suite.capacite} places · ${fmtArgent(suite.cout)}${
        niveau < suite.niveau ? " · niveau " + suite.niveau + " requis" : ""}</small></span>
      <span class="agFleche">›</span></button>

    ${dx ? `<button class="construire quatred" ${niveau < dx.niveau ? "disabled" : ""}
      onclick="confirmeConstruction('4dx')">
      <span class="agIco">${icone("etoile")}</span>
      <span><b>Salle 4DX</b><small>${dx.capacite} places · ${fmtArgent(dx.cout)}${
        niveau < dx.niveau ? " · niveau " + dx.niveau + " requis" : ""}</small></span>
      <span class="agFleche">›</span></button>
      <p class="noteDx">Fauteuils sur vérins, effets d'eau et de vent. Peu de places,
        mais le public y accepte un tarif bien plus élevé — et elle s'use deux fois plus vite.</p>`
    : dejaDx ? `<p class="noteDx">Tu as déjà ta salle 4DX. Une suffit.</p>` : ""}`;
}

/* les tarifs officiels, lus sur le serveur et mis en cache */
function tarifSalle(index){
  const t = (Etat.tarifs || {});
  return {
    cout: Number(t["salle_" + index + "_cout"] ?? [0,0,3500,9000,18000,32000][index] ?? 0),
    capacite: Number(t["salle_" + index + "_capacite"] ?? [0,0,40,50,60,70][index] ?? 0),
    niveau: Number(t["salle_" + index + "_niveau"] ?? [0,0,10,20,30,40][index] ?? 1)
  };
}
function tarif4dx(){
  const t = (Etat.tarifs || {});
  return {
    cout: Number(t["salle_4dx_cout"] ?? 4500),
    capacite: Number(t["salle_4dx_capacite"] ?? 55),
    niveau: Number(t["salle_4dx_niveau"] ?? 15)
  };
}

function confirmeConstruction(type){
  const n = (Etat.salles || []).length;
  const cfg = type === "4dx" ? tarif4dx() : tarifSalle(n + 1);
  if(Number(Etat.cinema.argent) < cfg.cout){
    bulleSalles("Il manque " + fmtArgent(cfg.cout - Number(Etat.cinema.argent))
                + " pour ce chantier.");
    return;
  }
  construitSalle({...cfg, type});
}

async function construitSalle(cfg){
  const appel = await appelSecurise(
    () => rpc("construire_salle", {
      p_cinema_id: Etat.cinema.id,
      p_operation_id: idOperation(),
      p_type: cfg.type || "standard"
    }), {rechargeApresErreur: false});

  if(!appel.ok){ bulleSalles(appel.message); return; }
  const r = appel.data;
  if(!r || r.success !== true){
    bulleSalles(r && r.message ? r.message : "Le chantier n'a pas pu démarrer.");
    return;
  }
  await rafraichirEtat();
  await chargeSalles();
  salleCourante = r.data && r.data.salle_id ? r.data.salle_id : salleCourante;
  cinematiqueNouvelleSalle(r.data ? r.data.index : (Etat.salles || []).length,
                           r.data && r.data.type === "4dx");
  rendOngletsSalles(); rendVueSalle(); rendEtatSalle(laSalle()); rendConstruction();
}

function cinematiqueNouvelleSalle(index){
  const o = document.createElement("div");
  o.className = "voileNiveau";
  o.innerHTML = `
    <div class="carteNiveau palier">
      <div class="rayons"></div>
      <div class="niveauChiffre"><span>Salle ${index}</span><b>${icone("pellicule","icoGrandEcran")}</b></div>
      <div class="niveauTitre">Un nouvel écran s'allume</div>
      <div class="niveauCeremonie">Votre cinéma accueille une salle de plus</div>
      <div class="niveauBob">
        <span class="bobRond"><svg viewBox="30 40 60 60">
          <circle cx="60" cy="70" r="26" fill="#f0c9a0"/>
          <path d="M40 78 Q50 86 60 79 Q70 86 80 78 Q72 92 60 84 Q48 92 40 78" fill="#4a3527"/>
          <path d="M44 60 Q51 55 57 59 M63 59 Q69 55 76 60" stroke="#4a3527" stroke-width="4" fill="none" stroke-linecap="round"/>
          <circle cx="51" cy="66" r="2.6" fill="#1c1210"/><circle cx="69" cy="66" r="2.6" fill="#1c1210"/>
          <path d="M34 56 Q60 34 86 56 L86 50 Q60 28 34 50 Z" fill="#571520"/>
          <rect x="52" y="44" width="16" height="7" rx="2" fill="#e8b84b"/>
        </svg></span>
        <span class="bobDit">Deux projecteurs, deux salles et toujours un seul Bob. Il va falloir négocier. Ou trouver un stagiaire. Surtout un stagiaire.</span>
      </div>
      <button class="btnOr btnNiveau" onclick="this.closest('.voileNiveau').remove()">Continuer</button>
    </div>`;
  document.body.appendChild(o);
  if(typeof sonNiveau === "function") sonNiveau();
}

/* ============================================================
   PANNEAU DE GESTION D'UNE SALLE
   ============================================================ */
function ouvreSalle(id){
  salleOuverte = salles.find(s=>String(s.id)===String(id));
  if(!salleOuverte) return;
  afficheGestion();
}
function fermeGestion(){
  const o = document.getElementById("voileGestion");
  if(o){ o.classList.add("sortie"); setTimeout(()=>o.remove(), 260); }
  salleOuverte = null;
}

function afficheGestion(){
  const s = salleOuverte;
  const anciens = document.getElementById("voileGestion");
  if(anciens) anciens.remove();
  const bonus = obtenirBonusSalle(s);
  const type = TYPES_SALLES[s.type || "standard"];

  const o = document.createElement("div");
  o.className = "voilePanneau"; o.id = "voileGestion";
  o.innerHTML = `
    <div class="panneauSeance panneauSalle">
      <div class="pnEnteteSalle">
        <span class="pnTitre">${s.nom}</span>
        <span class="pnSous">${type.nom} · ${s.capacite} places</span>
        <button class="pnFermer" onclick="fermeGestion()" aria-label="Fermer">✕</button>
      </div>
      <div class="pnCorps">
        <div class="apercuBoite grand">${apercuSalle(s)}</div>

        <div class="valeurActuelle">
          <div><span>Capacité</span><b>${s.capacite}</b></div>
          <div><span>Satisfaction</span><b>+${bonus.satisfaction}</b></div>
          <div><span>Risque d'incident</span><b>${libelleRisque(bonus.risqueIncident)}</b></div>
        </div>

        <label class="lblProg">Entretien</label>
        <div class="entretienBloc">
          <div class="etLigne"><span>Propreté</span>
            <span class="etPiste"><i class="${classeEtat(s.proprete)}" style="width:${Number(s.proprete ?? 100)}%"></i></span>
            <b>${Math.round(Number(s.proprete ?? 100))} %</b></div>
          <button class="btnEntretien" ${Number(s.proprete??100)>=100?"disabled":""} onclick="confirmeNettoyage()">
            Nettoyer — ${fmtArgent(COUT_NETTOYAGE)}</button>
          <div class="etLigne"><span>État général</span>
            <span class="etPiste"><i class="${classeEtat(s.etat)}" style="width:${Number(s.etat ?? 100)}%"></i></span>
            <b>${Math.round(Number(s.etat ?? 100))} %</b></div>
          <button class="btnEntretien" ${Number(s.etat??100)>=100?"disabled":""} onclick="confirmeReparation()">
            Réparer — ${fmtArgent(coutReparation(s))}</button>
        </div>

        <label class="lblProg">Équipements</label>
        <div id="listeEquipements">${Object.keys(AMELIORATIONS).map(cle=>blocEquipement(s, cle)).join("")}</div>

        <label class="lblProg">Capacité</label>
        <div id="blocCapacite">${blocExtension(s)}</div>
      </div>
    </div>`;
  document.body.appendChild(o);
}

function blocEquipement(s, cle){
  const a = AMELIORATIONS[cle];
  const p = prochaineAmelioration(s, cle);
  const actuel = a.niveaux[p.actuel];

  let bas;
  if(p.raison === "max"){
    bas = `<div class="eqMax">${icone("etoile")} Niveau maximal atteint</div>`;
  }else if(p.raison === "niveau"){
    bas = `<div class="eqVerrou">
      <b>${p.prochain.nom}</b>
      <span>Verrouillé — disponible au niveau ${p.niveauRequis}</span>
    </div>`;
  }else{
    bas = `<div class="eqSuivant">
        <div class="eqSuivTitre">${p.prochain.nom}</div>
        <div class="eqSuivDesc">${p.prochain.desc}</div>
        <div class="eqCompare">
          <span>Avant : +${actuel.satisfaction} satisfaction</span>
          <span class="fleche">→</span>
          <span class="apres">Après : +${p.prochain.satisfaction} satisfaction</span>
        </div>
        ${p.prochain.prixAcceptable ? `<div class="eqPlus">Prix acceptable +${p.prochain.prixAcceptable} €</div>`:""}
        ${p.prochain.reputation ? `<div class="eqPlus">Réputation quotidienne +${p.prochain.reputation} possible</div>`:""}
        <button class="btnOr btnAmeliorer" onclick="confirmeAmelioration('${cle}')">
          Améliorer — ${fmtArgent(p.prochain.cout)}</button>
      </div>`;
  }

  return `<div class="blocEquip">
    <div class="beEntete">${icone(a.icone)}<span class="beNom">${a.nom}</span>
      <span class="beNiv">Niveau ${p.actuel}</span></div>
    <div class="beActuel">${actuel.nom} — <i>${actuel.desc}</i></div>
    ${bas}
  </div>`;
}

function blocExtension(s){
  const e = prochaineExtension(s);
  if(e.raison === "max") return `<div class="eqMax">${icone("etoile")} Toutes les extensions sont faites</div>`;
  if(e.raison === "capacite_max") return `<div class="eqVerrou"><b>Capacité maximale</b><span>Ce type de salle ne peut pas dépasser ${TYPES_SALLES[s.type||"standard"].capaciteMax} places.</span></div>`;
  if(e.raison === "niveau") return `<div class="eqVerrou"><b>Extension +${e.ext.places} places</b><span>Verrouillé — disponible au niveau ${e.niveauRequis}</span></div>`;
  return `<div class="eqSuivant">
    <div class="eqSuivTitre">Extension : +${e.ext.places} places</div>
    <div class="eqCompare"><span>Avant : ${s.capacite} places</span><span class="fleche">→</span>
      <span class="apres">Après : ${Number(s.capacite)+e.ext.places} places</span></div>
    <button class="btnOr btnAmeliorer" onclick="confirmeExtension()">Agrandir — ${fmtArgent(e.ext.cout)}</button>
  </div>`;
}

/* ============================================================
   CONFIRMATIONS ET ACHATS
   ============================================================ */
function ouvreConfirmation({titre, ico, texte, cout, effets, valider, action}){
  const solde = Number(Etat.cinema.argent);
  const apres = solde - cout;
  const assez = apres >= 0;
  const o = document.createElement("div");
  o.className = "voileConfirm";
  o.innerHTML = `
    <div class="carteConfirm">
      <div class="ccIco">${icone(ico || "piece","icoConfirm")}</div>
      <div class="ccTitre">${titre}</div>
      ${texte ? `<div class="ccTexte">${texte}</div>` : ""}
      ${effets ? `<div class="ccEffets">${effets}</div>` : ""}
      <div class="ccResume">
        <span>Coût : <b>${fmtArgent(cout)}</b></span>
        <span>Votre caisse après achat : <b class="${assez?'':'negatif'}">${fmtArgent(Math.max(0,apres))}</b></span>
      </div>
      ${assez ? "" : `<div class="ccAlerte">Les fauteuils sont d'accord pour être remplacés. La caisse, beaucoup moins.</div>`}
      <div class="ccBoutons">
        <button class="btnAnnuler" id="cAnnuler">Annuler</button>
        <button class="btnOr btnOuvrir" id="cValider" ${assez?"":"disabled"}>${valider}</button>
      </div>
    </div>`;
  document.body.appendChild(o);
  o.querySelector("#cAnnuler").onclick = ()=>{ o.classList.add("sortie"); setTimeout(()=>o.remove(),240); };
  o.querySelector("#cValider").onclick = async ()=>{
    const b = o.querySelector("#cValider");
    if(b.disabled) return;
    b.disabled = true; b.textContent = "Bob s'en occupe…";
    o.remove();
    await action();
  };
}

function confirmeAmelioration(cle){
  const s = salleOuverte;
  const p = prochaineAmelioration(s, cle);
  if(!p.possible) return;
  ouvreConfirmation({
    titre:p.prochain.nom, ico:AMELIORATIONS[cle].icone,
    texte:p.prochain.desc,
    effets:`+${p.prochain.satisfaction} satisfaction<br>Nouvelle apparence de la salle`,
    cout:p.prochain.cout, valider:"Commencer les travaux",
    action:()=>acheteAmelioration(cle)
  });
}

/* Achat officiel : le serveur lit le tarif, vérifie le niveau, débite,
   applique l'amélioration et attribue l'XP dans une seule transaction. */
async function acheteAmelioration(cle){
  if(achatEnCours) return;
  achatEnCours = true;
  const op = idOperation();
  try{
    const r = await rpc("acheter_amelioration", {
      p_salle_id: salleOuverte.id, p_equipement: cle, p_operation_id: op});
    if(!r?.success){
      const M = {
        INSUFFICIENT_FUNDS:"Les fauteuils sont d'accord pour être remplacés. La caisse, beaucoup moins.",
        LEVEL_TOO_LOW:"Il faut le niveau " + (r?.data?.requis || "?") + " pour cette amélioration.",
        MAX_LEVEL:"Déjà au maximum. On ne peut pas faire mieux."
      };
      bulleSalles(M[r?.code] || "La machine a toussé. Réessaie.");
      return;
    }
    await rafraichirApresAchat();
    if(r.data?.xp > 0) await afficheXpServeur(r.data.xp, AMELIORATIONS[cle].nom);
    bulleSalles(phraseAchat(cle));
    if(cle === "sieges" && r.data?.niveau === 1) await accomplitMission("m_sieges");
    if(cle === "ecran"  && r.data?.niveau === 1) await accomplitMission("m_ecran");
  }catch(e){
    await rafraichirApresAchat();
    bulleSalles(messageErreur(e));
  }finally{ achatEnCours = false; }
}

/* recharge l'état officiel puis redessine */
async function rafraichirApresAchat(){
  await chargeCinema(true);
  await chargeProgression(true);
  await chargeSalles();
  const s = salles.find(x=>String(x.id)===String(salleOuverte?.id));
  if(s) salleOuverte = s;
  majHeaderArgent(); majBarreXPHeader();
  /* la page a changé de forme : on redessine les blocs qui existent */
  if(document.getElementById("ongletsSalles")){
    rendOngletsSalles(); rendVueSalle(); rendEtatSalle(laSalle()); rendConstruction();
  }
  if(document.getElementById("voileGestion") && salleOuverte) afficheGestion();
}

/* la montée de niveau est décidée par le serveur : on l'affiche a posteriori */
async function afficheXpServeur(montant, raison){
  const avant = niveauActuel();
  bulleXP(montant, raison);
  await chargeProgression(true);
  majBarreXPHeader();
  const apres = niveauActuel();
  for(let n = avant + 1; n <= apres; n++){
    await montreMonteeNiveau(infoNiveau(n));
    await synchroniseDeblocages().catch(()=>null);
    if(infoNiveau(n).recompenses.some(r=>r.cle === "confiserie")){
      const ouvert = await activeConfiserieSiBesoin();
      if(ouvert) inaugurationConfiserie();
    }
  }
}

const PHRASES_ACHAT = {
  sieges:"Regarde-moi ça ! On pourrait presque s'asseoir sans entendre un ressort supplier.",
  ecran:"L'image est tellement nette que j'ai enfin vu la poussière sur l'objectif.",
  son:"Le son ! Les voisins vont se plaindre. Signe de qualité.",
  climatisation:"On respire. Littéralement. J'avais oublié l'effet que ça faisait.",
  decoration:"Superbe. On dirait presque un cinéma de la capitale. Presque."
};
function phraseAchat(cle){ return PHRASES_ACHAT[cle] || "Travaux terminés, patron."; }

function confirmeExtension(){
  const e = prochaineExtension(salleOuverte);
  if(!e.possible) return;
  ouvreConfirmation({
    titre:`Extension : +${e.ext.places} places`, ico:"batiment",
    texte:"On pousse le mur du fond. Enfin, des ouvriers le poussent.",
    effets:`Capacité ${salleOuverte.capacite} → ${Number(salleOuverte.capacite)+e.ext.places} places`,
    cout:e.ext.cout, valider:"Lancer les travaux",
    action:acheteExtension
  });
}
async function acheteExtension(){
  if(achatEnCours) return;
  achatEnCours = true;
  const op = idOperation();
  try{
    const r = await rpc("acheter_extension", {p_salle_id: salleOuverte.id, p_operation_id: op});
    if(!r?.success){
      const M = {INSUFFICIENT_FUNDS:"Pas assez en caisse pour pousser les murs.",
                 LEVEL_TOO_LOW:"Extension disponible au niveau " + (r?.data?.requis || "?") + ".",
                 MAX_LEVEL:"Toutes les extensions sont faites."};
      bulleSalles(M[r?.code] || "La machine a toussé."); return;
    }
    await rafraichirApresAchat();
    if(r.data?.xp > 0) await afficheXpServeur(r.data.xp, "Première extension");
    bulleSalles("+" + r.data.places + " places. J'ai supervisé. De loin, mais j'ai supervisé.");
  }catch(e){
    await rafraichirApresAchat(); bulleSalles(messageErreur(e));
  }finally{ achatEnCours = false; }
}

/* ---------- entretien ---------- */
function confirmeNettoyage(){
  ouvreConfirmation({
    titre:"Nettoyer la salle", ico:"outil",
    texte:"Bob sort le grand balai. Et la serpillière du rang 3.",
    effets:"Propreté restaurée à 100 %",
    cout:COUT_NETTOYAGE, valider:"Nettoyer",
    action:()=>entretien("proprete", COUT_NETTOYAGE, "nettoyage_salle", "Impeccable. Enfin, sauf entre les rangs 3 et 4.")
  });
}
function confirmeReparation(){
  const c = coutReparation(salleOuverte);
  if(c <= 0) return;
  ouvreConfirmation({
    titre:"Réparer la salle", ico:"outil",
    texte:"Sièges, moquette, ampoules, tout ce qui pendouille.",
    effets:"État général restauré à 100 %",
    cout:c, valider:"Réparer",
    action:()=>entretien("etat", c, "reparation_salle", "Tout retient à nouveau. Ça se sentira dès la prochaine séance.")
  });
}
async function entretien(champ, cout, categorie, phrase){
  if(achatEnCours) return;
  achatEnCours = true;
  /* la page appelle entretien("nettoyage") ou entretien("reparation") ;
     l'ancienne signature reste acceptée pour ne rien casser ailleurs */
  const type = (champ === "reparation" || categorie === "reparation_salle")
    ? "reparation" : "nettoyage";
  phrase = phrase || (type === "reparation"
    ? "C'est réparé. Ça ne grince plus."
    : "La salle est nette. On peut ouvrir.");
  salleOuverte = salleOuverte || laSalle();
  const op = idOperation();
  try{
    const r = await rpc("entretenir_salle", {
      p_salle_id: salleOuverte.id, p_type: type, p_operation_id: op});
    if(!r?.success){
      const M = {INSUFFICIENT_FUNDS:"Même le balai coûte de l'argent, patron.",
                 ALREADY_CLEAN:"La salle est déjà impeccable.",
                 ALREADY_REPAIRED:"Rien à réparer pour l'instant."};
      bulleSalles(M[r?.code] || "La machine a toussé."); return;
    }
    await rafraichirApresAchat();
    await chargeSalles();
    salleOuverte = laSalle();
    rendVueSalle(); rendEtatSalle(laSalle()); rendOngletsSalles();
    if(r.data?.xp > 0) await afficheXpServeur(r.data.xp, "Première réparation");
    bulleSalles(phrase);
  }catch(e){
    await rafraichirApresAchat(); bulleSalles(messageErreur(e));
  }finally{ achatEnCours = false; }
}

/* ------------------------------------------------------------
   LE PANNEAU DE TRAVAUX
   Une feuille qui monte du bas : le mot de Bob, l'avant/après,
   les effets en clair, et un bouton qui dit ce qui manque.
   ------------------------------------------------------------ */
function ouvrePanneauEquipement(cle, salle){
  const s = salle || laSalle();
  const a = AMELIORATIONS[cle];
  if(!s || !a) return;

  const n = niveauEquipement(s, cle);
  const suiv = n + 1;
  const max = suiv >= a.niveaux.length;
  const p = max ? null : a.niveaux[suiv];
  const requis = p && p.niveauJoueurRequis ? p.niveauJoueurRequis : 0;
  const bloque = !max && niveauActuel() < requis;
  const argent = Number(Etat.cinema.argent) || 0;
  const payable = !max && !bloque && argent >= p.cout;

  const v = document.createElement("div");
  v.className = "voileEquip";
  v.id = "voileEquip";
  v.innerHTML = `<div class="feuilleEquip">
    <div class="poigneeEquip"></div>
    <h3>${echappe(a.nom)}</h3>
    <div class="sousEquip">Niveau ${n} sur ${a.niveaux.length - 1}</div>

    <div class="motBobEquip">
      <span class="teteBobEquip">${teteBobSalles()}</span>
      <span>${echappe(a.niveaux[n].desc || "")}</span></div>

    ${max
      ? `<div class="avantApres" style="justify-content:center">
          <div class="aaVolet apres" style="max-width:190px">
            <span class="aaEtiq">Au maximum</span>
            ${apercuEquipement(cle, a.niveaux.length - 1)}
            <span class="aaNom">${echappe(a.niveaux[a.niveaux.length - 1].nom)}</span></div></div>`
      : `<div class="avantApres">
          <div class="aaVolet"><span class="aaEtiq">Aujourd'hui</span>
            ${apercuEquipement(cle, n)}
            <span class="aaNom">${echappe(a.niveaux[n].nom)}</span></div>
          <span class="aaFleche">→</span>
          <div class="aaVolet apres"><span class="aaEtiq">Après travaux</span>
            ${apercuEquipement(cle, suiv)}
            <span class="aaNom">${echappe(p.nom)}</span></div>
        </div>
        <div class="effetsEquip">
          ${p.satisfaction ? `<div class="effetEquip">${icone("etoile")}
            <span>+${p.satisfaction} de satisfaction à chaque séance</span></div>` : ""}
          ${p.prixAcceptable ? `<div class="effetEquip">${icone("piece")}
            <span>Le public accepte ${p.prixAcceptable} € de plus</span></div>` : ""}
          <div class="effetEquip">${icone("outil")}
            <span>${echappe(p.desc || "")}</span></div>
        </div>
        <button class="btnTravaux" ${payable ? "" : "disabled"}
          onclick="lanceTravaux('${cle}')">
          ${bloque ? "Niveau " + requis + " requis"
            : !payable ? "Il manque " + fmtArgent(p.cout - argent)
            : "Lancer les travaux · " + fmtArgent(p.cout)}</button>
        <div class="caisseEquip">En caisse : ${fmtArgent(argent)}</div>`}

    <button class="fermerEquip" onclick="fermePanneauEquipement()">Fermer</button>
  </div>`;

  document.body.appendChild(v);
  v.addEventListener("click", e=>{ if(e.target === v) fermePanneauEquipement(); });
}

function fermePanneauEquipement(){
  const v = document.getElementById("voileEquip");
  if(v) v.remove();
}

async function lanceTravaux(cle){
  const s = laSalle();
  if(!s) return;
  const btn = document.querySelector("#voileEquip .btnTravaux");
  if(btn){ btn.disabled = true; btn.textContent = "Travaux en cours…"; }

  const appel = await appelSecurise(
    () => rpc("acheter_amelioration", {
      p_salle_id: s.id, p_equipement: cle, p_operation_id: idOperation()
    }), {rechargeApresErreur: false});

  if(!appel.ok){ bulleSalles(appel.message); fermePanneauEquipement(); return; }
  const r = appel.data;
  if(!r || r.success !== true){
    bulleSalles(r && r.message ? r.message : "Les travaux n'ont pas pu commencer.");
    fermePanneauEquipement();
    return;
  }
  fermePanneauEquipement();
  await rafraichirApresAchat();
  if(r.data && r.data.xp > 0) await afficheXpServeur(r.data.xp, "Travaux terminés");
  bulleSalles("C'est installé. Va voir la différence.");
}

function teteBobSalles(){
  return `<svg viewBox="30 40 60 60" aria-hidden="true">
    <circle cx="60" cy="70" r="26" fill="#f0c9a0"/>
    <path d="M40 78 Q50 86 60 79 Q70 86 80 78 Q72 92 60 84 Q48 92 40 78" fill="#4a3527"/>
    <path d="M44 60 Q51 55 57 59 M63 59 Q69 55 76 60" stroke="#4a3527" stroke-width="4"
      fill="none" stroke-linecap="round"/>
    <circle cx="51" cy="66" r="2.6" fill="#1c1210"/><circle cx="69" cy="66" r="2.6" fill="#1c1210"/>
    <path d="M34 56 Q60 34 86 56 L86 50 Q60 28 34 50 Z" fill="#571520"/>
    <rect x="52" y="44" width="16" height="7" rx="2" fill="#e8b84b"/></svg>`;
}

/* ---- exports ---- */
export {
  PHRASES_ACHAT,
  achatEnCours,
  acheteAmelioration,
  acheteExtension,
  afficheGestion,
  afficheXpServeur,
  anneauSalle,
  blocEquipement,
  blocExtension,
  bulleSalles,
  carteSalle,
  changeSalle,
  chargeSalles,
  cinematiqueNouvelleSalle,
  classeEtat,
  confirmeAmelioration,
  confirmeConstruction,
  confirmeExtension,
  confirmeNettoyage,
  confirmeReparation,
  conseilSalles,
  construitSalle,
  creePremiereSalle,
  entretien,
  fermeGestion,
  fermePanneauEquipement,
  initSalles,
  laSalle,
  lanceTravaux,
  ligneEquip,
  ouvreConfirmation,
  ouvrePanneauEquipement,
  ouvreSalle,
  phraseAchat,
  rafraichirApresAchat,
  rendConstruction,
  rendEtatSalle,
  rendListeSalles,
  rendOngletsSalles,
  rendVueSalle,
  salleCourante,
  salleOuverte,
  salles,
  tarif4dx,
  tarifSalle,
  teteBobSalles,
  vaConstruire
};

/* ---- gestionnaires en attribut ---- */
/* Ces fonctions sont appelées depuis des attributs onclick écrits
   dans le HTML généré. Un module ES n'expose rien globalement :
   on les rend accessibles explicitement. */
Object.assign(window, {
  acheteExtension,
  changeSalle,
  confirmeAmelioration,
  confirmeConstruction,
  confirmeExtension,
  confirmeNettoyage,
  confirmeReparation,
  entretien,
  fermeGestion,
  fermePanneauEquipement,
  lanceTravaux,
  ouvrePanneauEquipement,
  ouvreSalle,
  vaConstruire
});
