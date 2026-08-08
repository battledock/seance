/* ============================================================
   LA GRILLE

   Salles en lignes, créneaux en colonnes. C'est la vue où l'on
   décide vraiment : chaque case remplie montre son remplissage,
   chaque case vide invite à programmer.

   Les créneaux ne sont pas figés — un cinéma qui ouvre à 11h
   n'a pas les mêmes que celui qui ferme à minuit. On les déduit
   de ce qui est déjà posé, plus les heures usuelles.
   ============================================================ */

const CRENEAUX = ["11h00", "14h00", "16h30", "19h00", "21h30"];

function couleurTaux(t){
  if(t >= 90) return "#2a8a4a";
  if(t >= 65) return "#5a9a5a";
  if(t >= 40) return "#c9a24a";
  return "#c05a3a";
}

/* Une prévision arrive séance par séance ; la grille a besoin
   d'un accès direct par salle et par heure. */
function indexePrevisions(prevision){
  const m = new Map();
  for(const s of (prevision?.seances || [])) m.set(s.salle_id + "|" + s.heure, s);
  return m;
}

function minutes(h){
  return (parseInt(h, 10) || 0) * 60 + (parseInt(String(h).split("h")[1], 10) || 0);
}

/* Un film long déborde sur le créneau suivant : une séance de
   2h32 posée à 11h occupe la salle jusqu'à 13h52 et rend le
   créneau de 14h inutilisable.

   Sans cette lecture, le joueur tape sur une case libre en
   apparence, se fait refuser, et ne comprend pas pourquoi. */
function occupations(prevision, salleId){
  return (prevision?.seances || [])
    .filter(s => s.salle_id === salleId)
    .map(s => ({
      debut: minutes(s.heure),
      fin: s.fin_minutes ?? (minutes(s.heure) + (s.duree || 100) + 20),
      titre: s.titre, heure: s.heure
    }));
}

/* la place disponible à partir d'un créneau : jusqu'à la
   prochaine séance, ou jusqu'à la fin de la journée */
function fenetreLibre(occ, debut){
  let fin = 24 * 60 + 60;
  for(const o of occ) if(o.debut >= debut && o.debut < fin) fin = o.debut;
  return fin - debut;
}

function rendGrille(cible, etat, prevision, surCase, creneaux){
  if(!cible || !etat) return;
  const salles = etat.salles || [];
  const prev = indexePrevisions(prevision);

  if(salles.length === 0){
    cible.innerHTML = `<div class="vidGrille">Aucune salle ouverte.</div>`;
    return;
  }

  const g = document.createElement("div");
  g.className = "grille";
  g.style.gridTemplateColumns = `66px repeat(${CRENEAUX.length}, 1fr)`;

  /* Sous chaque heure, une barre qui dit ce que le créneau vaut.
     Sans elle, le joueur subissait un facteur de trois sans le
     voir : une animation à 21h30 perd les deux tiers de son
     public parce que les enfants dorment. */
  const qual = new Map();
  for(const c of (creneaux?.creneaux || [])) qual.set(c.heure, c);

  let html = `<div></div>` + CRENEAUX.map(c => {
    const q = qual.get(c);
    return `<div class="gHead"><span class="h">${c.replace("h00","h")}</span>
      <span class="q ${q ? "n" + q.niveau : ""}"></span></div>`;
  }).join("");

  for(const s of salles){
    const enTravaux = s.en_travaux;
    const occ = occupations(prevision, s.id);
    html += `<div class="gSalle"><b>${echappe(s.nom)}</b>
      <span>${s.places} places</span>
      ${s.type && s.type !== "standard"
        ? `<em>${s.type.toUpperCase()}</em>` : ""}</div>`;

    for(const h of CRENEAUX){
      if(!s.ouverte && s.ouverte !== undefined){
        html += `<div class="cell ferme"><span>fermée</span></div>`; continue;
      }
      if(enTravaux){
        html += `<div class="cell ferme"><span>travaux</span>${
          s.rouvre_au_jour ? `<span class="sousF">jour ${s.rouvre_au_jour}</span>` : ""}</div>`;
        continue;
      }
      const p = prev.get(s.id + "|" + h);
      if(!p){
        /* la case est-elle recouverte par une séance qui déborde ? */
        const m = minutes(h);
        const couvre = occ.find(o => m > o.debut && m < o.fin);
        if(couvre){
          html += `<div class="cell couverte" title="${echappe(couvre.titre)}">
            <span class="occ">occupé</span>
            <span class="occT">${echappe(couvre.heure.replace("h00","h"))}</span></div>`;
          continue;
        }
        /* combien de temps reste-t-il avant la séance suivante ? */
        const place = fenetreLibre(occ, m);
        const q = qual.get(h);
        const faible = q && (q.niveau === "faible" || q.niveau === "tres_faible");
        html += `<button class="cell ${faible ? "creneauFaible" : ""}"
            data-salle="${s.id}" data-heure="${h}" data-place="${place}">
          <span class="plus">+</span>
          ${place < 400 ? `<span class="dispo">${Math.floor(place/60)}h${
            String(place%60).padStart(2,"0")}</span>`
            : faible ? `<span class="dispo">${
              q.niveau === "tres_faible" ? "très faible" : "faible"}</span>` : ""}</button>`;
        continue;
      }
      const taux = p.taux_remplissage || 0;
      const col = couleurTaux(taux);
      html += `<button class="cell plein" data-salle="${s.id}" data-heure="${h}"
          data-seance="${p.seance_id}"
          style="background:linear-gradient(160deg,${eclaircit(col)},${col})">
        ${p.taux_location ? `<span class="cr">${
          Math.round(p.taux_location * 100)}%</span>` : ""}
        <b>${echappe(p.titre)}</b>
        <span class="bas"><span class="taux">${taux}%</span>
          <span class="sur">${p.entrent}/${p.places}</span></span>
        <span class="jauge"><i style="width:${Math.min(100, taux)}%"></i></span>
      </button>`;
    }
  }

  g.innerHTML = html;
  cible.innerHTML = "";
  cible.appendChild(g);

  g.querySelectorAll(".cell[data-salle]").forEach(b =>
    b.addEventListener("click", () => surCase({
      salleId: b.dataset.salle,
      heure: b.dataset.heure,
      seanceId: b.dataset.seance || null,
      place: b.dataset.place ? Number(b.dataset.place) : null
    })));
}

/* un dégradé lisible : la même teinte, un ton au-dessus */
function eclaircit(hex){
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, (n >> 16) + 42);
  const v = Math.min(255, ((n >> 8) & 255) + 38);
  const b = Math.min(255, (n & 255) + 34);
  return "#" + ((r << 16) | (v << 8) | b).toString(16).padStart(6, "0");
}

function echappe(t){
  return String(t == null ? "" : t)
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;").replace(/'/g,"&#39;");
}

/* ---------- le partage du bassin ----------
   Les séances se répartissent les mêmes habitants : programmer
   quatre fois le même film ne quadruple pas le public, il le
   divise. C'est la deuxième moitié des surprises. */
function rendPartage(cible, p){
  if(!cible) return;
  if(!p || !(p.films || []).length){ cible.innerHTML = ""; return; }

  const COUL = ["#8a1c2c","#caa24a","#4a7a6a","#c07a4a","#6a5aa0"];
  const parts = p.films.map((f, i) => ({...f, coul: COUL[i % COUL.length]}));
  const reste = Math.max(0, 100 - parts.reduce((t, f) => t + f.part, 0));

  cible.innerHTML = `
    <div class="basT"><span class="lb">Le quartier peut envoyer</span>
      <b>${p.bassin} personnes</b></div>
    <div class="basB">
      ${parts.map(f => `<i style="background:${f.coul};width:${f.part}%"
        ><span>${f.part >= 9 ? echappe(f.titre.split(" ")[0].slice(0, 7)) : ""}</span></i>`).join("")}
      ${reste > 2 ? `<i class="reste" style="width:${reste}%"><span>${
        reste >= 22 ? p.restants + " encore disponibles" : ""}</span></i>` : ""}
    </div>
    <div class="basLeg">
      ${parts.map(f => `<span><i style="background:${f.coul}"></i>${
        echappe(f.titre)} · ${f.spectateurs}${
        f.seances > 1 ? ` sur ${f.seances} séances` : ""}</span>`).join("")}
      ${reste > 2 ? `<span><i style="background:#eee8de"></i>reste ${p.restants}</span>` : ""}
    </div>
    ${p.note ? `<div class="basNote ${p.sature ? "alerte" : ""}">${echappe(p.note)}</div>` : ""}`;
}

/* ---------- le bandeau de chiffres ---------- */
function rendResume(cible, prevision, peutOuvrir){
  if(!cible) return;
  if(!prevision || !(prevision.seances || []).length){
    cible.innerHTML = `
      <div class="gKpi"><b>—</b><span>attendus</span></div>
      <div class="gKpi"><b>—</b><span>refusés</span></div>
      <div class="gKpi"><b>—</b><span>marge</span></div>`;
    return;
  }
  const marge = (prevision.part_exploitant || 0)
              + (prevision.confiserie || 0) - (prevision.charges || 0);
  cible.innerHTML = `
    <div class="gKpi"><b>${prevision.spectateurs}</b><span>attendus</span></div>
    <div class="gKpi"><b class="${prevision.refuses > 0 ? "r" : ""}">${prevision.refuses}</b>
      <span>refusés</span></div>
    <div class="gKpi"><b class="${marge >= 0 ? "v" : "r"}">${marge >= 0 ? "+" : "−"}${
      Math.abs(Math.round(marge)).toLocaleString("fr")} €</b><span>marge</span></div>`;
}

/* ---------- le pied de grille ---------- */
function rendPiedGrille(cible, prevision, peut, surOuvrir){
  if(!cible) return;
  if(!prevision || !(prevision.seances || []).length){
    cible.innerHTML = "";
    return;
  }
  const lignes = [
    ["Recette guichet", prevision.recette_guichet, ""],
    ["Taxes et distributeur",
      -(Math.round(prevision.taxes || 0) + Math.round(prevision.location || 0)), "r"],
    ["Confiserie", prevision.confiserie, "v"],
    ["Charges et salaires", -(prevision.charges || 0), "r"]
  ];
  cible.innerHTML = lignes.map(([n, v, c]) =>
    `<div class="gLg"><span>${n}</span><b class="${c}">${
      v < 0 ? "− " : ""}${Math.abs(Math.round(v)).toLocaleString("fr")} €</b></div>`).join("")
    + `<button class="gOuvrir" ${peut?.ouvrable ? "" : "disabled"}>${
        peut?.ouvrable ? "Ouvrir les portes" : messageBlocage(peut)}</button>`;

  const b = cible.querySelector(".gOuvrir");
  if(b && peut?.ouvrable) b.addEventListener("click", surOuvrir);
}

function messageBlocage(peut){
  if(!peut) return "Impossible d'ouvrir";
  if(peut.raison === "AUCUNE_SEANCE") return "Programmez une séance";
  if(peut.raison === "ENGAGEMENT_NON_TENU"){
    const m = (peut.manques || [])[0];
    return m ? `${m.titre} · ${m.posees}/${m.exigees} séances` : "Engagement non tenu";
  }
  return "Impossible d'ouvrir";
}

export { rendGrille, rendResume, rendPiedGrille, rendPartage, CRENEAUX,
         couleurTaux, echappe, minutes, occupations, fenetreLibre };
