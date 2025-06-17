function initMail() {
  const sendMailBtn = document.getElementById("sendMailBtn");

  if (!sendMailBtn) return;

  sendMailBtn.addEventListener("click", () => {
    const projektname = document.getElementById("projektname").value || "Unbenanntes Projekt";
    const wunschtermin = document.getElementById("wunschtermin").value || "Nicht angegeben";
    const kundenmail = document.getElementById("kundenmail").value || "Ihre E-Mail";
    const gemeinde = document.getElementById("gemeinde")?.value || "Nicht angegeben";
    const parzelle = document.getElementById("parzellennummer")?.value || "Nicht angegeben";
    const gebaeude = document.getElementById("gebaeudenummer")?.value || "Nicht angegeben";

    // Auswahl sammeln
    const ausgewaehlt = [];
    document.querySelectorAll(".mini-btn.btn-primary[data-label='PK'], .mini-btn.btn-primary[data-label='AK']").forEach(btn => {
      const typ = btn.getAttribute("data-label");
      const text = btn.closest("li")?.querySelector("span")?.innerText;
      const gewerk = btn.closest(".collapse")?.previousElementSibling?.innerText.trim().split("\n")[0] || "Unbekannt";
      if (text) {
        ausgewaehlt.push({ titel: text, typ, gewerk });
      }
    });

    // Pflichtunterlagen generieren
    const unterlagenMap = {
      "Heizung": ["Schema", "Projektbeschrieb", "Baubeschrieb"],
      "Lüftung": ["Kellerplan", "UG-Plan", "Lüftungsschema"],
      "Klima": ["Kälteschema", "Energierechnung"],
      "Wärmedämmung": ["Baubeschrieb", "U-Wert-Berechnung", "Fassadenplan"]
    };

    const pflichtunterlagen = {};

    ausgewaehlt.forEach(eintrag => {
      if (!pflichtunterlagen[eintrag.gewerk]) {
        pflichtunterlagen[eintrag.gewerk] = new Set();
      }
      const vorschlaege = unterlagenMap[eintrag.gewerk] || ["Allgemeine Unterlagen"];
      vorschlaege.forEach(ul => pflichtunterlagen[eintrag.gewerk].add(ul));
    });

    // Mail-Text zusammenbauen
    let mailBody = `Sehr geehrtes PrüfControl-Team,%0D%0A%0D%0A`;
    mailBody += `anbei erhalten Sie meine angeforderte Offerte für das folgende Projekt:%0D%0A`;
    mailBody += `Projektname: ${projektname}%0D%0A`;
    mailBody += `Wunschtermin: ${wunschtermin}%0D%0A`;
    mailBody += `Gemeinde / Ort: ${gemeinde}%0D%0A`;
    mailBody += `Parzellennummer: ${parzelle}%0D%0A`;
    mailBody += `Gebäudenummer: ${gebaeude}%0D%0A%0D%0A`;

    mailBody += `Bitte finden Sie untenstehend die erforderlichen Pflichtunterlagen entsprechend meiner Auswahl:%0D%0A%0D%0A`;

    Object.entries(pflichtunterlagen).forEach(([gewerk, unterlagen]) => {
      mailBody += `• ${gewerk}:%0D%0A`;
      unterlagen.forEach(u => {
        mailBody += `  - ${u}%0D%0A`;
      });
      mailBody += `%0D%0A`;
    });

    mailBody += `Zudem sende ich die vorausgefüllten Energienachweise mit, welche unterschrieben zurückgesendet werden müssen.%0D%0A%0D%0A`;
    mailBody += `Bitte beachten Sie, dass die Offerte als PDF angehängt ist.%0D%0A%0D%0ABesten Dank und freundliche Grüsse%0D%0A${kundenmail}`;

    // Mail öffnen
    const mailtoLink = `mailto:info@privcontrol.ch?subject=Pflichtunterlagen zu Projekt ${encodeURIComponent(projektname)}&body=${mailBody}`;
    window.location.href = mailtoLink;
  });
}
