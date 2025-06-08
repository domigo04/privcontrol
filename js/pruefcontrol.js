// pruefcontrol.js (Main)
// Diese Datei vereint die Initialisierung aller Module

function initPruefControl() {
  console.log("initPruefControl wurde ausgeführt");

  // Buttons holen
  const berechnenBtn = document.getElementById("berechnenBtn");
  const modalElement = document.getElementById("offerteModal");

  if (berechnenBtn && modalElement) {
    berechnenBtn.addEventListener("click", () => {
      console.log("Berechnen Button geklickt – Modal wird geöffnet");
      try {
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
      } catch (e) {
        console.error("Fehler beim Anzeigen des Modals:", e);
      }
    });
  } else {
    console.warn("berechnenBtn oder modalElement fehlt!");
  }

  // Weitere Initialisierungen der Module (falls vorhanden)
  if (typeof initFormularanzeige === "function") initFormularanzeige();
  if (typeof initFilterSuche === "function") initFilterSuche();
  if (typeof initPDF === "function") initPDF();
  if (typeof initMail === "function") initMail();
  if (typeof initPreisberechnung === "function") initPreisberechnung();
}  
