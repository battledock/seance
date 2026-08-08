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

function rendGrille(cible, etat, prevision, surCase){
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

  let html = `<div></div>` +
    CRENEAUX.map(c => `<div class="gHead">${c.replace("h00","h")}</div>`).join("");

  for(const s of salles){
    const enTravaux = s.en_travaux;
    html += `<div class="gSalle"><b>${echappe(s.nom)}</b>
      <span>${s.places} places</span>
      ${s.type && s.type !== "standard"
        ? `<em>${s.type.toUpperCase()}</em>` : ""}</div>`;

    for(const h of CRENEAUX){
      if(!s.ouverte && s.ouverte !== undefined){
        html += `<div class="cell ferme"><span>fermée</span></div>`; continue;
      }
      if(enTravaux){
        html += `<div class="cell ferme"><span>travaux</span></div>`; continue;
      }
      const p = prev.get(s.id + "|" + h);
      if(!p){
        html += `<button class="cell" data-salle="${s.id}" data-heure="${h}">
          <span class="plus">+</span></button>`;
        continue;
      }
      const taux = p.taux_remplissage || 0;
      const col = couleurTaux(taux);
      html += `<button class="cell plein" data-salle="${s.id}" data-heure="${h}"
          data-seance="${p.seance_id}"
          style="background:linear-gradient(160deg,${eclaircit(col)},${col})">
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
      seanceId: b.dataset.seance || null
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

export { rendGrille, rendResume, rendPiedGrille, CRENEAUX, couleurTaux, echappe };
