/* Réglages du jeu. Un seul endroit à toucher pour changer d'environnement. */

export const SUPABASE = {
  url: "https://zpfkekiavlfphialvphi.supabase.co",
  cle: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpwZmtla2lhdmxmcGhpYWx2cGhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU3Mjc4MzIsImV4cCI6MjEwMTMwMzgzMn0.ORa4y_AMjuWbxboKm3o6Jn7ryYjkOm4mSgLa2Schv98"
};

/* clés de stockage local */
export const STOCKAGE = {
  session: "rex_session",
  cache: "rex_cache",
  cinema: "rex_cinema",
  tropheesVus: "rex_trophees_vus",
  vueClassement: "rex_classement",
  sectionCommunaute: "rex_section_communaute"
};

/* horaires d'ouverture du cinéma, heure du téléphone */
export const HORAIRES = { ouverture: {h:13, m:0}, fermeture: {h:23, m:30} };

/* réseau */
export const RESEAU = { delaiMs: 12000, resyncMs: 20000 };

/* seuils de progression */
export const SEUILS = { studio: 20, niveauMax: 50 };
