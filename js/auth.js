/* Session, garde de page, déconnexion. */

import { Etat, chargeCinema } from "./game-state.js?v=2ab9afab";
import { SB_KEY, SB_URL, renouvelleSession, sessionLocale } from "./supabase-client.js?v=2ab9afab";

/* ============================================================
   AUTHENTIFICATION — session, protection des pages, déconnexion
   ============================================================ */
function session(){ return sessionLocale(); }

/* la session est-elle utilisable (présente et non expirée) ? */
function sessionValide(){
  const s = sessionLocale();
  if(!s?.access_token) return false;
  if(s.expire_le && Date.now() > s.expire_le) return false;
  return true;
}

/* garde d'entrée : appelée par toutes les pages privées */
async function protegerPage({cinemaRequis = true, sansCinema = "inscription.html"} = {}){
  const s = sessionLocale();
  if(!s?.access_token){ location.replace("index.html"); return null; }
  /* jeton périmé : on tente de le renouveler avant d'aller plus loin */
  if(s.expire_le && Date.now() > s.expire_le - 60000){
    const neuve = await renouvelleSession();
    if(!neuve){ deconnexion(); return null; }
  }
  Etat.session = sessionLocale();

  const cinema = await chargeCinema(true);
  if(cinemaRequis && !cinema){ location.replace(sansCinema); return null; }
  return {session: Etat.session, cinema};
}

/* ---------- déconnexion propre ---------- */
async function deconnexion(){
  const s = sessionLocale();
  try{
    if(s?.access_token){
      await fetch(SB_URL + "/auth/v1/logout", {
        method:"POST",
        headers:{"apikey":SB_KEY, "Authorization":"Bearer " + s.access_token}
      });
    }
  }catch(e){}
  /* données de session et caches privés effacés ; préférences conservées */
  ["rex_session","rex_cinema","rex_cache","rex_dest","rex_reputation"].forEach(k=>localStorage.removeItem(k));
  location.replace("index.html");
}

/* ---- exports ---- */
export {
  deconnexion,
  protegerPage,
  session,
  sessionValide
};
