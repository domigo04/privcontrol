document.addEventListener("DOMContentLoaded", function () {
  const gewerkCheckboxes = document.querySelectorAll(".gewerk");
  const dynamischerBereich = document.getElementById("dynamischerBereich");
  const berechnenBtn = document.getElementById("berechnenBtn");
  const modal = new bootstrap.Modal(document.getElementById("offerteModal"));
  const downloadBtn = document.getElementById("downloadPDF");
  const unterlagenListe = document.getElementById("pflichtunterlagen");
  const sendMailBtn = document.getElementById("sendMailBtn");

  const unterkategorien = {
    heizung: [{ label: "EN 103 (Heizungsersatz)", wert: 300 }],
    lueftung: [
      { label: "Kellerlüftung", wert: 200 },
      { label: "Liftschachtentlüftung", wert: 200 }
    ],
    klima: [{ label: "Split-Klimagerät Kontrolle", wert: 250 }]
  };

  const unterlagenMap = {
    heizung: ["Heizschema", "Energienachweis EN-103"],
    lueftung: ["Lüftungskonzept", "Grundriss mit Lüftungsleitungen"],
    klima: ["Kältebedarfsnachweis", "Gerätedatenblatt"],
    plankontrolle: ["Pläne als PDF", "Planliste"]
  };

  const empfaengerMap = {
    heizung: "heizung@privcontrol.ch",
    lueftung: "lueftung@privcontrol.ch",
    klima: "lueftung@privcontrol.ch",
    plankontrolle: "team@privcontrol.ch"
  };

  const state = {
    ausgewaehlt: new Set(),
    preise: [],
    projektname: "",
    wunschtermin: "",
    gesamtpreis: 0
  };

  function renderUntergruppen() {
    dynamischerBereich.innerHTML = "";

    state.ausgewaehlt.forEach((gewerk) => {
      const wrapper = document.createElement("div");
      wrapper.className = "untergruppe-box";

      if (gewerk === "plankontrolle") {
        wrapper.innerHTML = `
          <label for="planAnzahl" class="form-label">Anzahl Pläne zur Kontrolle:</label>
          <input type="number" id="planAnzahl" class="form-control w-25" value="0" min="0">
        `;
      } else if (unterkategorien[gewerk]) {
        unterkategorien[gewerk].forEach((item, i) => {
          const id = `${gewerk}-${i}`;
          wrapper.innerHTML += `
            <div class="form-check">
              <input class="form-check-input untergruppe" type="checkbox" value="${item.wert}" id="${id}">
              <label class="form-check-label" for="${id}">${item.label}</label>
            </div>
          `;
        });
      }

      dynamischerBereich.appendChild(wrapper);
    });
  }

  function updateUnterlagenListe() {
    unterlagenListe.innerHTML = "";
    state.ausgewaehlt.forEach((g) => {
      (unterlagenMap[g] || []).forEach((eintrag) => {
        const li = document.createElement("li");
        li.className = "list-group-item";
        li.textContent = eintrag;
        unterlagenListe.appendChild(li);
      });
    });
  }

  gewerkCheckboxes.forEach((box) => {
    box.addEventListener("change", () => {
      if (box.checked) {
        state.ausgewaehlt.add(box.value);
      } else {
        state.ausgewaehlt.delete(box.value);
      }
      renderUntergruppen();
      updateUnterlagenListe();
    });
  });

  berechnenBtn.addEventListener("click", () => {
    const loading = document.createElement("div");
    loading.id = "loading";
    loading.innerHTML = `
      <div class="spinner-border text-primary mb-2" role="status"></div>
      <p>Offerte wird berechnet...</p>
    `;
    dynamischerBereich.appendChild(loading);

    setTimeout(() => {
      document.getElementById("loading")?.remove();

      let gesamt = 1500;
      document.querySelectorAll(".untergruppe:checked").forEach((cb) => {
        gesamt += parseInt(cb.value) || 0;
      });

      const plaene = parseInt(document.getElementById("planAnzahl")?.value || "0");
      if (!isNaN(plaene)) gesamt += plaene * 100;

      state.projektname = document.getElementById("projektname").value;
      state.wunschtermin = document.getElementById("wunschtermin").value;
      state.gesamtpreis = gesamt;

      modal.show();
    }, 1300);
  });

  downloadBtn.addEventListener("click", () => {
    const datum = new Date().toLocaleDateString("de-CH");
    const ausgewaehlt = [...state.ausgewaehlt].map(g => `• ${g}`).join("\n");
    const preis = `CHF ${state.gesamtpreis.toFixed(2)}`;

    const docDefinition = {
      content: [
        { image: 'logo', width: 120, margin: [0, 0, 0, 20] },
        { text: 'Offerte – PrüfControl', style: 'header' },
        { text: `Datum: ${datum}`, margin: [0, 10] },
        { text: `Projekt: ${state.projektname}` },
        { text: `Wunschtermin: ${state.wunschtermin}`, margin: [0, 0, 0, 10] },
        { text: `Gewählte Leistungen:\n${ausgewaehlt}`, margin: [0, 10] },
        { text: `Gesamtpreis: ${preis}`, bold: true, fontSize: 14, margin: [0, 10] },
        { text: 'Danke für Ihr Vertrauen.', italics: true }
      ],
      images: {
        logo: logoBase64
      },
      styles: {
        header: { fontSize: 18, bold: true }
      }
    };

    pdfMake.createPdf(docDefinition).download(`Offerte_${state.projektname}.pdf`);
  });

  sendMailBtn.addEventListener("click", () => {
    const kundenmail = document.getElementById("kundenmail").value || "kundemail@example.com";
    const projektname = document.getElementById("projektname").value || "Unbekanntes Projekt";

    let unterlagenText = "";
    const auswahl = [...state.ausgewaehlt];

    auswahl.forEach((g) => {
      const unterlagen = unterlagenMap[g] || [];
      if (unterlagen.length > 0) {
        unterlagenText += `${g.toUpperCase()}:\n`;
        unterlagen.forEach((u) => unterlagenText += `• ${u}\n`);
        unterlagenText += `\n`;
      }
    });

    emailjs.send("service_n2f4g3w", "template_ji16xl8", {
      email: kundenmail,
      projektname: projektname,
      pflichtunterlagen: unterlagenText
    })
    .then(() => {
      alert("✅ Die E-Mail wurde erfolgreich an den Kunden verschickt!");
    })
    .catch((error) => {
      console.error("❌ Fehler beim Senden:", error);
      alert("Die E-Mail konnte nicht gesendet werden.");
    });
  });
});
