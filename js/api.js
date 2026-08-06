/* Façade d'accès aux données : tout ce qui parle au serveur passe par ici.
   Les pages n'appellent jamais sbFetch ou rpc directement. */

import { sbFetch, rpc, appelSecurise, idOperation } from "./supabase-client.js?v=2ab9afab";

/* ---------- lectures ---------- */
export const lireCinema      = id => sbFetch(`cinemas?id=eq.${id}&select=*`);
export const lireSalles      = id => sbFetch(`salles?cinema_id=eq.${id}&select=*&order=cree_le`);
export const lireSeances     = (id, jour) =>
  sbFetch(`seances?cinema_id=eq.${id}&jour=eq.${jour}&select=*&order=heure`);
export const lireJournee     = (id, jour) =>
  sbFetch(`journees?cinema_id=eq.${id}&jour=eq.${jour}&select=*`);
export const lireProgression = id => sbFetch(`progression?cinema_id=eq.${id}&select=*`);
export const lireProfil      = id => sbFetch(`profils_publics?cinema_id=eq.${id}&select=*`);
export const lireTrophees    = id => sbFetch(`trophees?cinema_id=eq.${id}&select=*`);
export const lireCatalogueTrophees = () => sbFetch("trophees_catalogue?select=*");

/* ---------- actions officielles ---------- */
export const jouerJournee     = id => rpc("simuler_journee", {p_cinema_id:id, p_operation_id:idOperation()});
export const cloturerJournee  = id => rpc("terminer_journee", {p_cinema_id:id, p_operation_id:idOperation()});
export const acheterAmelioration = (salle, equipement) =>
  rpc("acheter_amelioration", {p_salle_id:salle, p_equipement:equipement, p_operation_id:idOperation()});
export const construireSalle  = id => rpc("construire_salle", {p_cinema_id:id, p_operation_id:idOperation()});
export const rafraichirScores = id => rpc("refresh_all_leaderboard_scores", {p_cinema_id:id});

/* ---------- social ---------- */
export const relationSociale  = pid => rpc("get_social_relationship", {p_public_id:pid});
export const envoyerReaction  = (pid, cle) => rpc("envoyer_reaction", {p_public_id:pid, p_cle:cle});
export const suivreCinema     = pid => rpc("suivre_cinema", {p_public_id:pid});
export const nePlusSuivre     = pid => rpc("ne_plus_suivre", {p_public_id:pid});

/* ---------- studio ---------- */
export const mesProductions   = id => rpc("get_my_productions", {p_cinema_id:id});
export const filmsDisponibles = id => rpc("get_my_available_productions", {p_cinema_id:id});

export { sbFetch, rpc, appelSecurise, idOperation };
