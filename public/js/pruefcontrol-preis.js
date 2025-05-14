// pruefcontrol-preis.js

function initPreisberechnung() {
  console.log("initPreisberechnung wurde ausgeführt");

  const GRUNDBETRAG = 1000;
  const PREIS_PK = 200;
  const PREIS_AK = 250;

  const wunschterminInput = document.getElementById("wunschtermin");

  function berechnePreis() {
    let pkCount = document.querySelectorAll(".mini-btn[data-label='PK']").length;
    let akCount = document.querySelectorAll(".mini-btn[data-label='AK']").length;

    let preis = GRUNDBETRAG + (pkCount * PREIS_PK) + (akCount * PREIS_AK);

    // Check ob Wunschtermin innerhalb von 48 Stunden liegt
    const heute = new Date();
    const wunschtermin = new Date(wunschterminInput.value);

    const differenzStunden = (wunschtermin - heute) / (1000 * 60 * 60);
    if (!isNaN(differenzStunden) && differenzStunden < 48) {
      preis *= 1.2; // 20% Zuschlag
    }

    // Speichere Preis global für spätere Verwendung (z. B. PDF)
    window.gesamtpreis = preis.toFixed(2);
  }

  // Globale Events
  document.addEventListener("click", (event) => {
    if (
      event.target.matches(".mini-btn[data-label='PK']") ||
      event.target.matches(".mini-btn[data-label='AK']") ||
      event.target.matches(".mini-btn[data-label='–']") ||
      event.target.matches(".mini-btn[data-label='+']")
    ) {
      setTimeout(berechnePreis, 50);
    }
  });

  if (wunschterminInput) {
    wunschterminInput.addEventListener("change", berechnePreis);
  }

  // Initial einmal ausführen
  berechnePreis();
}