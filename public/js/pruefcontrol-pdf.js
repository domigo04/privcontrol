function initPDF() {
  const berechnenBtn = document.getElementById("berechnenBtn");
  if (berechnenBtn) {
    berechnenBtn.addEventListener("click", () => {
      // PDF generieren & Modal anzeigen
    });
  }

  const downloadBtn = document.getElementById("downloadPDF");
  if (downloadBtn) {
    downloadBtn.addEventListener("click", () => {
      // PDF wirklich herunterladen
    });
  }
}


// 📁 pruefcontrol-pdf.js

function createPdf(state) {
  const datum = new Date().toLocaleDateString("de-CH");
  const ausgewaehlt = [...state.ausgewaehlt].map(g => `• ${g}`).join("\n");
  const preis = `CHF ${state.gesamtpreis.toFixed(2)}`;

  const docDefinition = {
    content: [
      { text: "Offerte – PrüfControl", style: "header" },
      { text: `Datum: ${datum}`, margin: [0, 10] },
      { text: `Projekt: ${state.projektname}` },
      { text: `Wunschtermin: ${state.wunschtermin}`, margin: [0, 0, 0, 10] },
      { text: `Gewählte Nachweise:\n${ausgewaehlt}`, margin: [0, 10] },
      { text: `Gesamtpreis: ${preis}`, bold: true, fontSize: 14, margin: [0, 10] },
      { text: "Bitte senden Sie die Offerte im Anhang mit den benötigten Pflichtunterlagen zurück.", italics: true }
    ],
    styles: {
      header: { fontSize: 18, bold: true }
    }
  };

  pdfMake.createPdf(docDefinition).download(`Offerte_${state.projektname}.pdf`);
}