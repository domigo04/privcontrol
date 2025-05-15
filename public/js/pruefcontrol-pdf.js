function initPDF() {
  const berechnenBtn = document.getElementById("berechnenBtn");
  const modalElement = document.getElementById("offerteModal");
  const downloadBtn = document.getElementById("downloadPDF");
  const dynamischerBereich = document.getElementById("dynamischerBereich");

  if (!berechnenBtn || !modalElement || !downloadBtn) return;

  const modal = new bootstrap.Modal(modalElement);

  // Button-Auswahl aktivieren (Toggle zwischen aktiv/inaktiv)
  document.querySelectorAll(".mini-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      btn.classList.toggle("btn-primary");
      btn.classList.toggle("btn-outline-primary");
    });
  });

  // Berechnen-Button zeigt Ladespinner + Modal
  berechnenBtn.addEventListener("click", () => {
    document.getElementById("loading")?.remove();
    const loading = document.createElement("div");
    loading.id = "loading";
    loading.innerHTML = `
      <div class="text-center my-4">
        <div class="spinner-border text-primary" role="status"></div>
        <p class="mt-2">Offerte wird berechnet...</p>
      </div>`;
    dynamischerBereich.appendChild(loading);

    setTimeout(() => {
      document.getElementById("loading")?.remove();
      modal.show();
    }, 1000);
  });

  // PDF generieren
  downloadBtn.addEventListener("click", () => {
    const projektname = document.getElementById("projektname").value || "Unbenanntes_Projekt";
    const wunschtermin = document.getElementById("wunschtermin").value || "Nicht angegeben";

    const ausgewaehlt = [];

    document.querySelectorAll(".mini-btn").forEach(btn => {
      const isActive = btn.classList.contains("btn-primary");
      const typ = btn.innerText.trim().toUpperCase(); // PK oder AK
      const text = btn.closest("li")?.querySelector("span")?.innerText?.trim();
      const gewerk = btn.closest(".collapse")?.previousElementSibling?.innerText.trim().split("\n")[0] || "Unbekannt";

      if (isActive && (typ === "PK" || typ === "AK") && text) {
        ausgewaehlt.push({ titel: text, typ, gewerk });
      }
    });

    const GRUNDBETRAG = 1000;
    const PREIS_PK = 200;
    const PREIS_AK = 250;

    let pkCount = ausgewaehlt.filter(n => n.typ === "PK").length;
    let akCount = ausgewaehlt.filter(n => n.typ === "AK").length;
    let gesamtpreis = GRUNDBETRAG + (pkCount * PREIS_PK) + (akCount * PREIS_AK);

    const heute = new Date();
    const termin = new Date(wunschtermin);
    const diffStunden = (termin - heute) / (1000 * 60 * 60);
    const expressZuschlag = (!isNaN(diffStunden) && diffStunden < 48);

    let expressBetrag = 0;
    if (expressZuschlag) {
      expressBetrag = gesamtpreis * 0.2;
      gesamtpreis += expressBetrag;
    }

    const datum = new Date().toLocaleDateString("de-CH");

    const nachweisTabelle = [
      [{ text: "Nachweis", bold: true }, { text: "Typ", bold: true }, { text: "Preis", bold: true }]
    ];

    const gruppiert = {};
    ausgewaehlt.forEach(n => {
      if (!gruppiert[n.gewerk]) gruppiert[n.gewerk] = [];
      const preis = n.typ === "PK" ? PREIS_PK : PREIS_AK;
      const typLabel = n.typ === "PK" ? "Privatkontrolle" : "Ausführungskontrolle";
      gruppiert[n.gewerk].push([n.titel, typLabel, `${preis.toFixed(2)} CHF`]);
    });

    Object.keys(gruppiert).forEach(gewerk => {
      nachweisTabelle.push([{ text: gewerk, colSpan: 3, bold: true, fillColor: '#f1f1f1' }, {}, {}]);
      nachweisTabelle.push(...gruppiert[gewerk]);
    });

    nachweisTabelle.push([{ text: "Grundbetrag", colSpan: 2 }, "", `${GRUNDBETRAG.toFixed(2)} CHF`]);
    if (expressZuschlag) {
      nachweisTabelle.push([{ text: "Expresszuschlag (<48h)", colSpan: 2 }, "", `+${expressBetrag.toFixed(2)} CHF`]);
    }
    nachweisTabelle.push([{ text: "Gesamtpreis", colSpan: 2, bold: true }, "", `${gesamtpreis.toFixed(2)} CHF`]);

    const docDefinition = {
      content: [
        {
          image: typeof logoBase64 !== 'undefined' ? logoBase64 : undefined,
          width: 100,
          margin: [0, 0, 0, 20]
        },
        { text: "Offerte – PrüfControl", style: "header" },
        { text: `Datum: ${datum}`, margin: [0, 10, 0, 5] },
        { text: `Projekt: ${projektname}` },
        { text: `Wunschtermin: ${wunschtermin}`, margin: [0, 0, 0, 15] },
        { text: "Ausgewählte Nachweise", style: "subheader" },
        {
          table: {
            headerRows: 1,
            widths: ['*', 'auto', 'auto'],
            body: nachweisTabelle
          },
          layout: 'lightHorizontalLines',
          margin: [0, 5, 0, 15]
        },
        { text: "Bitte senden Sie die Offerte zusammen mit den Pflichtunterlagen zurück.", italics: true },
        { text: "E-Mail:    info@priv-control.ch", italics: true },
        { text: "Diese Offerte ist nicht rechtsverbindlich. Änderungen vorbehalten.", style: "klein", margin: [0, 30, 0, 0] }
      ],
      styles: {
        header: { fontSize: 18, bold: true },
        subheader: { fontSize: 14, bold: true, margin: [0, 10, 0, 5] },
        klein: { fontSize: 8, color: '#888' }
      }
    };

    pdfMake.createPdf(docDefinition).download(`Offerte_${projektname}.pdf`);
  });
}
