import { rendreFacadePublique } from "../../cinema.js?v=2ab9afab";
import { chargeRelation, conteneurSocialActuel, rendActionsSociales } from "../../social.js?v=2ab9afab";
import { rpc, sbFetch } from "../../supabase-client.js?v=2ab9afab";
import { echappe, embleme, texteSur } from "../../ui/emblems.js?v=2ab9afab";
import { icone } from "../../ui/icons.js?v=2ab9afab";

/* ============================================================
   VITRINE PUBLIQUE — lecture seule, données filtrées par le serveur
   ============================================================ */
async function initCinemaPublic(){
  const params = new URLSearchParams(location.search);
  const id = params.get("id");
  const el = document.getElementById("contenuPublic");

  if(!id){ rendMessagePublic("Aucun cinéma demandé.",
    "Reviens à la communauté pour en chercher un."); return; }

  let r;
  try{ r = await rpc("get_public_cinema_profile", {p_public_id: id}); }
  catch(e){ rendMessagePublic("Le réseau a mangé la bobine.", "Réessaie dans un instant."); return; }

  if(!r?.success){
    const M = {
      PROFILE_PRIVATE:["Portes fermées",
        "Les portes de ce cinéma sont fermées aux visiteurs. Même moi, je n'ai pas la clé."],
      PROFILE_NOT_FOUND:["Adresse inconnue",
        "Il n'y a aucun cinéma à cette adresse. Un panneau, un lampadaire, rien de plus."]
    };
    const [t, m] = M[r?.code] || ["Visite impossible", "Reviens plus tard."];
    rendMessagePublic(t, m);
    return;
  }
  rendProfilPublic(r);
}

function rendMessagePublic(titre, message){
  document.getElementById("contenuPublic").innerHTML = `
    <section class="carteEcran vitrineFermee">
      <div class="vfIco">${icone("porte","icoVerrou")}</div>
      <h2 style="justify-content:center;border:none" id="vfTitre"></h2>
      <div class="blocBob bilanBob">
        <div class="bobMiniTete grand"><svg viewBox="30 40 60 60">
          <circle cx="60" cy="70" r="26" fill="#f0c9a0"/>
          <path d="M40 78 Q50 86 60 79 Q70 86 80 78 Q72 92 60 84 Q48 92 40 78" fill="#4a3527"/>
          <path d="M44 60 Q51 55 57 59 M63 59 Q69 55 76 60" stroke="#4a3527" stroke-width="4" fill="none" stroke-linecap="round"/>
          <circle cx="51" cy="66" r="2.6" fill="#1c1210"/><circle cx="69" cy="66" r="2.6" fill="#1c1210"/>
          <path d="M34 56 Q60 34 86 56 L86 50 Q60 28 34 50 Z" fill="#571520"/>
          <rect x="52" y="44" width="16" height="7" rx="2" fill="#e8b84b"/>
        </svg></div>
        <div class="bulle"><b>Bob</b><span id="vfMsg"></span></div>
      </div>
      <a class="btnOr btnRetourJeu" href="communaute.html">Retour à la communauté</a>
    </section>`;
  texteSur(document.getElementById("vfTitre"), titre);
  texteSur(document.getElementById("vfMsg"), message);
}

function rendProfilPublic(r){
  const p = r.profile, st = r.stats;
  const films = r.currentMovies || [];
  const troph = r.achievements || [];

  document.getElementById("contenuPublic").innerHTML = `
    <div class="facadePublique" id="facadePublique"></div>

    <section class="carteEcran carteVitrine">
      <div class="apercuProfil">
        <div class="apEmbleme">${embleme(p.embleme, 58)}</div>
        <div class="apTexte">
          <div class="apCine"><span class="apLogo"></span><b id="pubNom"></b></div>
          <div class="apPar">Géré par <b id="pubPseudo"></b></div>
          <div class="apNiveau">Niveau ${Number(p.niveau)||1} · <i id="pubTitre"></i></div>
        </div>
      </div>
      <div class="jaugeReput">
        <span>${icone("etoile")} Réputation</span>
        <span class="etPiste"><i class="bon" style="width:${Math.max(0,Math.min(100,Number(p.reputation)||0))}%"></i></span>
        <b>${Number(p.reputation)||0} / 100</b>
      </div>
      <div class="apDevise" id="pubDevise"></div>
      <div class="metaVitrine">
        <span>${icone("fauteuil")} ${Number(p.nbSalles)||1} salle${(Number(p.nbSalles)||1)>1?"s":""}</span>
        <span>${icone("maison")} <i id="pubQuartier"></i></span>
        ${p.activite ? `<span>${icone("horloge")} Actif ${echappe(p.activite)}</span>` : ""}
      </div>
    </section>

    <section class="carteEcran">
      <h2>Le cinéma en chiffres</h2>
      <div class="grilleStats">
        <div><b>${Number(st.journeesTerminees)||0}</b><span>Journées terminées</span></div>
        <div><b>${(Number(st.totalSpectateurs)||0).toLocaleString("fr-FR")}</b><span>Spectateurs accueillis</span></div>
        <div><b>${Number(st.meilleureJournee)||0}</b><span>Record sur une journée</span></div>
        <div><b>${Number(st.totalSeances)||0}</b><span>Séances projetées</span></div>
      </div>
    </section>

    <section class="carteEcran">
      <h2>À l'affiche</h2>
      <div id="filmsPublics"></div>
    </section>

    ${troph.length ? `<section class="carteEcran">
      <h2>Trophées</h2>
      ${troph.map(t=>`<div class="ligneRecit">${icone(t.icone||"etoile")}
        <span><b>${echappe(t.nom)}</b><br><small>${echappe(t.description)}</small></span></div>`).join("")}
    </section>` : ""}

    <a class="btnOr btnVisiter" href="visite.html?cinema=${encodeURIComponent(p.publicId)}">
      ${icone("porte")} Visiter le cinéma</a>

    <section class="carteEcran">
      <h2>Interactions</h2>
      <div id="zoneSociale"></div>
    </section>

    <div class="piedVitrine">Cinéma ouvert depuis le ${echappe(p.arriveLe || "—")}</div>`;

  texteSur(document.getElementById("pubNom"), p.nomCinema);
  texteSur(document.getElementById("pubPseudo"), p.pseudo || "—");
  texteSur(document.getElementById("pubTitre"), p.titreChoisi ? "" : (p.titreNiveau || ""));
  texteSur(document.getElementById("pubQuartier"), nomQuartierPublic(p.quartier));
  texteSur(document.getElementById("pubDevise"), p.devise ? "« " + p.devise + " »" : "");
  document.querySelector(".apLogo").textContent = p.logo || "";
  if(p.titreChoisi) chargeTitreChoisi(p);

  rendFilmsPublics(films);
  rendreFacadePublique("facadePublique", {...p, films});
  conteneurSocialActuel = "zoneSociale";
  chargeRelation(p.publicId).then(()=>rendActionsSociales("zoneSociale", p.publicId));
}

async function chargeTitreChoisi(p){
  try{
    const d = await sbFetch(`titres_catalogue?cle=eq.${encodeURIComponent(p.titreChoisi)}&select=nom`);
    if(Array.isArray(d) && d[0]) texteSur(document.getElementById("pubTitre"), d[0].nom);
    else texteSur(document.getElementById("pubTitre"), p.titreNiveau || "");
  }catch(e){ texteSur(document.getElementById("pubTitre"), p.titreNiveau || ""); }
}

const QUARTIERS_PUBLICS = {centre:"Centre-ville", residentiel:"Quartier résidentiel",
  etudiant:"Quartier étudiant", populaire:"Quartier populaire", artistique:"Quartier artistique"};
function nomQuartierPublic(q){ return QUARTIERS_PUBLICS[q] || "Quartier"; }

function rendFilmsPublics(films){
  const el = document.getElementById("filmsPublics");
  if(!films.length){
    el.innerHTML = `<div class="vide">Aucune séance annoncée pour le moment.</div>`;
    return;
  }
  el.innerHTML = films.map(f=>`
    <div class="ficheFilm">
      <div class="ffAffiche" style="background:${couleurGenre(f.genre)}">
        <span class="ffAffTitre">${echappe(f.titre)}</span>
        <span class="ffAffGenre">${echappe(f.genre)}</span>
      </div>
      <div class="ffCorps">
        <div class="ffTitre">${echappe(f.titre)}</div>
        <div class="ffMeta"><span>${icone("pellicule")} ${echappe(f.genre)}</span></div>
        <div class="ffMeta"><span>${icone("horloge")} Prochaine séance : ${echappe(f.heure)}</span></div>
        <div class="ffMeta"><span>${icone("fauteuil")} ${echappe(f.salle || "Salle 1")}</span></div>
      </div>
    </div>`).join("");
}
function couleurGenre(g){
  const C = {"Drame":"#1f3a5c","Aventure":"#1d5c52","Animation":"#4a3f8c","Documentaire":"#2a6b6b",
    "Thriller familial":"#3a2a52","Comédie":"#c07a1f","Romance":"#a83a5c","Film noir":"#22262e",
    "Western":"#8c5a2a","Musical":"#b53a4a","Fantastique":"#3a2a6b","Culte":"#1f5c3a"};
  return C[g] || "#7c1c2e";
}

/* ---- exports ---- */
export {
  QUARTIERS_PUBLICS,
  chargeTitreChoisi,
  couleurGenre,
  initCinemaPublic,
  nomQuartierPublic,
  rendFilmsPublics,
  rendMessagePublic,
  rendProfilPublic
};
