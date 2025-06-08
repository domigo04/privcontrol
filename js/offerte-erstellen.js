// 📋 Offerte-Erstellung - Vereinfachte Version
// Datei: js/offerte-erstellen.js

// 🔧 Globale Variablen
let autocomplete;
let companyLogo = null; // Logo wird aus base64cd.js geladen

// 🚀 Hauptinitialisierung
function initOfferteErstellen() {
  console.log("🚀 Initialisiere Offerte-Erstellung");
  
  // Logo laden
  loadLogo();
  
  // Prüfe ob alle benötigten Elemente vorhanden sind
  const requiredElements = [
    'berechnenBtn', 'adresse', 'gemeinde', 'projektname', 'kundenmail'
  ];
  
  const missingElements = requiredElements.filter(id => !document.getElementById(id));
  if (missingElements.length > 0) {
    console.error("❌ Fehlende Elemente:", missingElements);
    return;
  }
  
  // Initialisierungen
  initGewerkButtons();
  initFormValidation();
  
  console.log("✅ Offerte-Erstellung vollständig initialisiert");
}

// 🖼️ Logo laden
function loadLogo() {
  // Versuche Logo aus base64cd.js zu laden
  if (typeof logoBase64 !== 'undefined') {
    // Logo ist als const logoBase64 in base64cd.js definiert
    companyLogo = logoBase64;
    console.log("✅ Logo aus base64cd.js geladen");
  } else if (typeof window.logoBase64 !== 'undefined') {
    // Logo ist als window.logoBase64 definiert
    companyLogo = window.logoBase64;
    console.log("✅ Logo aus window.logoBase64 geladen");
  } else {
    console.warn("⚠️ Logo nicht gefunden. PDF wird ohne Logo erstellt.");
  }
}

// =============================================================================
// 🗺️ GOOGLE PLACES API FÜR ADRESSEN
// =============================================================================

function initGooglePlaces() {
  console.log("🗺️ Initialisiere Google Places API");
  
  const adresseInput = document.getElementById('adresse');
  if (!adresseInput) {
    console.error("❌ Adresse-Input nicht gefunden");
    return;
  }

  // Google Places Autocomplete initialisieren
  const options = {
    types: ['address'],
    componentRestrictions: { country: 'ch' }, // Schweiz
    fields: ['address_components', 'formatted_address', 'geometry']
  };

  try {
    autocomplete = new google.maps.places.Autocomplete(adresseInput, options);
    
    autocomplete.addListener('place_changed', function() {
      const place = autocomplete.getPlace();
      
      if (!place.geometry) {
        console.warn("⚠️ Keine Geometrie für die gewählte Adresse");
        return;
      }

      // Adressdaten extrahieren
      let gemeinde = '';
      let plz = '';
      
      place.address_components.forEach(component => {
        const types = component.types;
        
        if (types.includes('locality')) {
          gemeinde = component.long_name;
        } else if (types.includes('postal_code')) {
          plz = component.long_name;
        }
      });

      // Gemeinde automatisch ausfüllen
      const gemeindeInput = document.getElementById('gemeinde');
      if (gemeindeInput && gemeinde) {
        gemeindeInput.value = gemeinde;
        gemeindeInput.classList.remove('is-invalid');
      }

      console.log("✅ Adresse gewählt:", {
        adresse: place.formatted_address,
        gemeinde: gemeinde,
        plz: plz
      });
    });
    
    console.log("✅ Google Places API initialisiert");
  } catch (error) {
    console.error("❌ Fehler beim Initialisieren von Google Places:", error);
  }
}

// =============================================================================
// 🔲 GEWERK-BUTTONS FUNKTIONALITÄT
// =============================================================================

function initGewerkButtons() {
  console.log("🔲 Initialisiere Gewerk-Buttons");
  
  document.querySelectorAll('.mini-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      
      // Toggle Button State
      this.classList.toggle('btn-primary');
      this.classList.toggle('btn-outline-primary');
      
      // Aktualisiere Validierung
      updateGewerkValidation();
      
      console.log("🔘 Gewerk-Button geklickt:", {
        gewerk: this.dataset.gewerk,
        nachweis: this.dataset.nachweis,
        typ: this.dataset.typ,
        aktiv: this.classList.contains('btn-primary')
      });
    });
  });
}

function updateGewerkValidation() {
  const selectedButtons = document.querySelectorAll('.mini-btn.btn-primary');
  const validationDiv = document.getElementById('gewerkValidierung');
  
  if (selectedButtons.length === 0) {
    validationDiv?.classList.remove('d-none');
  } else {
    validationDiv?.classList.add('d-none');
  }
}

// =============================================================================
// 📋 FORMULAR-VALIDIERUNG
// =============================================================================

function initFormValidation() {
  console.log("📋 Initialisiere Formular-Validierung");
  
  const form = document.querySelector('#projektbereich');
  if (!form) return;

  // Validierung bei Submit
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    validateAndSubmitForm();
  });

  // Echtzeit-Validierung für E-Mail
  const emailInput = document.getElementById('kundenmail');
  if (emailInput) {
    emailInput.addEventListener('blur', function() {
      validateEmail(this);
    });
  }
}

function validateAndSubmitForm() {
  const requiredFields = [
    { id: 'projektname', name: 'Projektname' },
    { id: 'wunschtermin', name: 'Wunschtermin' },
    { id: 'adresse', name: 'Adresse' },
    { id: 'gemeinde', name: 'Gemeinde' },
    { id: 'parzellennummer', name: 'Parzellennummer' },
    { id: 'gebaeudenummer', name: 'Gebäudenummer' },
    { id: 'art_des_gebaeudes', name: 'Art des Gebäudes' },
    { id: 'kundenmail', name: 'E-Mail' }
  ];
  
  const errors = [];
  
  // Prüfe Pflichtfelder
  requiredFields.forEach(field => {
    const input = document.getElementById(field.id);
    const value = input?.value?.trim();
    
    if (!value) {
      errors.push(field.name);
      input?.classList.add('is-invalid');
    } else {
      input?.classList.remove('is-invalid');
    }
  });
  
  // Prüfe E-Mail-Format
  const emailInput = document.getElementById('kundenmail');
  if (emailInput?.value && !validateEmail(emailInput)) {
    errors.push('E-Mail (ungültiges Format)');
  }
  
  // Prüfe Gewerk-Auswahl
  const selectedGewerke = document.querySelectorAll('.mini-btn.btn-primary');
  if (selectedGewerke.length === 0) {
    errors.push('Mindestens ein Gewerk');
    document.getElementById('gewerkValidierung')?.classList.remove('d-none');
  } else {
    document.getElementById('gewerkValidierung')?.classList.add('d-none');
  }
  
  if (errors.length > 0) {
    showError(`Bitte füllen Sie folgende Felder aus: ${errors.join(', ')}`);
    return false;
  }
  
  return true;
}

function validateEmail(input) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValid = emailRegex.test(input.value.trim());
  
  if (!isValid) {
    input.classList.add('is-invalid');
  } else {
    input.classList.remove('is-invalid');
  }
  
  return isValid;
}

// =============================================================================
// 📧 E-MAIL FUNKTIONALITÄT
// =============================================================================

async function sendOfferEmail(projektData, projektId) {
  console.log("📧 Sende Offerte-E-Mail - START");
  console.log("📊 Projekt-Daten:", projektData);
  
  try {
    // 1. EmailJS verfügbar? (NEUE VERSION)
    if (typeof emailjs === 'undefined') {
      console.error("❌ EmailJS ist nicht geladen!");
      throw new Error('EmailJS ist nicht geladen. Bitte Seite neu laden.');
    }
    console.log("✅ EmailJS ist verfügbar");
    
    // 2. E-Mail-Daten vorbereiten
    const emailData = {
      to_email: projektData.kundenmail,
      to_name: projektData.projektname,
      projekt_id: projektId,
      projektname: projektData.projektname,
      gemeinde: projektData.gemeinde,
      parzellennummer: projektData.parzellennummer,
      gebaeudenummer: projektData.gebaeudenummer,
      art_des_gebaeudes: projektData.art_des_gebaeudes,
      wunschtermin: projektData.wunschtermin,
      adresse: projektData.adresse,
      datum: new Date().toLocaleDateString('de-CH'),
      uhrzeit: new Date().toLocaleTimeString('de-CH', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      gewerke_liste: projektData.ausgewaehlteGewerke.map(g => 
        `${g.gewerk}: ${g.nachweis} (${g.typ})`
      ).join(', ')
    };
    
    console.log("📨 E-Mail-Daten:", emailData);

    // 3. Service und Template IDs
    const serviceId = 'service_n2f4g3w';
    const templateId = 'template_offerte_bestaet';
    
    console.log("🆔 Service ID:", serviceId);
    console.log("🆔 Template ID:", templateId);
    
    // 4. E-Mail senden (NEUE SYNTAX)
    console.log("📤 Sende E-Mail...");
    const response = await emailjs.send(serviceId, templateId, emailData);
    
    console.log("✅ E-Mail erfolgreich gesendet:", response);
    return { success: true, response };
    
  } catch (error) {
    console.error("❌ E-Mail-Versand Fehler:", error);
    console.error("❌ Error Status:", error.status);
    console.error("❌ Error Text:", error.text);
    return { 
      success: false, 
      error: error.message || error.text || 'Unbekannter E-Mail-Fehler'
    };
  }
}

// =============================================================================
// 📄 PDF FUNKTIONALITÄT (aus dem bereitgestellten Code)
// =============================================================================

function initPDF() {
  console.log("📄 Initialisiere PDF-Funktionalität");
  
  const berechnenBtn = document.getElementById("berechnenBtn");
  const modalElement = document.getElementById("offerteModal");
  const downloadBtn = document.getElementById("downloadPDF");
  const dynamischerBereich = document.getElementById("dynamischerBereich");

  if (!berechnenBtn || !modalElement || !downloadBtn) {
    console.error("❌ PDF: Erforderliche Elemente nicht gefunden");
    return;
  }

  const modal = new bootstrap.Modal(modalElement);

  // Berechnen-Button Event
  berechnenBtn.addEventListener("click", async function(e) {
    e.preventDefault();
    
    // Validierung
    if (!validateAndSubmitForm()) {
      return;
    }

    // Loading anzeigen
    showLoadingInContainer(dynamischerBereich);

    try {
      // Simuliere Verarbeitung
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // E-Mail senden (jetzt aktiv)
      const projektData = collectFormData();
      const projektId = 'PROJ-' + Date.now();
      
      // Versuche E-Mail zu senden
      try {
        await sendOfferEmail(projektData, projektId);
        console.log("✅ E-Mail gesendet");
      } catch (emailError) {
        console.warn("⚠️ E-Mail-Versand fehlgeschlagen:", emailError);
      }
      
      // Modal anzeigen
      hideLoadingInContainer(dynamischerBereich);
      
      // E-Mail-Adresse im Modal anzeigen
      const mailAdresseSpan = document.getElementById('mailAdresse');
      if (mailAdresseSpan) {
        mailAdresseSpan.textContent = projektData.kundenmail;
      }
      
      modal.show();
      
    } catch (error) {
      console.error("❌ Fehler bei Verarbeitung:", error);
      hideLoadingInContainer(dynamischerBereich);
      showError("Fehler bei der Verarbeitung. Bitte versuchen Sie es erneut.");
    }
  });

  // PDF Download Event
  downloadBtn.addEventListener("click", function() {
    generatePDF();
  });
  
  console.log("✅ PDF-Funktionalität initialisiert");
}

function generatePDF() {
  console.log("📄 Generiere PDF");
  
  const projektname = document.getElementById("projektname").value || "Unbenanntes_Projekt";
  const wunschtermin = document.getElementById("wunschtermin").value || "Nicht angegeben";
  const adresse = document.getElementById("adresse").value || "Nicht angegeben";
  const gemeinde = document.getElementById("gemeinde").value || "Nicht angegeben";

  // Ausgewählte Nachweise sammeln
  const ausgewaehlt = [];
  document.querySelectorAll(".mini-btn.btn-primary").forEach(btn => {
    const typ = btn.dataset.typ;
    const nachweis = btn.dataset.nachweis;
    const gewerk = btn.dataset.gewerk;
    
    if (typ && nachweis && gewerk) {
      ausgewaehlt.push({ 
        titel: `${nachweis} – ${getGewerkFullName(gewerk, nachweis)}`, 
        typ, 
        gewerk 
      });
    }
  });

  // Preisberechnung
  const GRUNDBETRAG = 1000;
  const PREIS_PK = 200;
  const PREIS_AK = 250;

  let pkCount = ausgewaehlt.filter(n => n.typ === "PK").length;
  let akCount = ausgewaehlt.filter(n => n.typ === "AK").length;
  let gesamtpreis = GRUNDBETRAG + (pkCount * PREIS_PK) + (akCount * PREIS_AK);

  // Express-Zuschlag prüfen
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

  // PDF-Tabelle erstellen
  const nachweisTabelle = [
    [{ text: "Nachweis", bold: true }, { text: "Typ", bold: true }, { text: "Preis", bold: true }]
  ];

  // Gruppierung nach Gewerk
  const gruppiert = {};
  ausgewaehlt.forEach(n => {
    if (!gruppiert[n.gewerk]) gruppiert[n.gewerk] = [];
    const preis = n.typ === "PK" ? PREIS_PK : PREIS_AK;
    const typLabel = n.typ === "PK" ? "Privatkontrolle" : "Ausführungskontrolle";
    gruppiert[n.gewerk].push([n.titel, typLabel, `${preis.toFixed(2)} CHF`]);
  });

  // Tabelle aufbauen
  Object.keys(gruppiert).forEach(gewerk => {
    nachweisTabelle.push([{ text: gewerk, colSpan: 3, bold: true, fillColor: '#f8f9fa' }, {}, {}]);
    nachweisTabelle.push(...gruppiert[gewerk]);
  });

  // Summen hinzufügen
  nachweisTabelle.push([{ text: "Grundbetrag", colSpan: 2 }, "", `${GRUNDBETRAG.toFixed(2)} CHF`]);
  if (expressZuschlag) {
    nachweisTabelle.push([{ text: "Expresszuschlag (<48h)", colSpan: 2 }, "", `+${expressBetrag.toFixed(2)} CHF`]);
  }
  nachweisTabelle.push([{ text: "Gesamtpreis", colSpan: 2, bold: true, fillColor: '#e9ecef' }, "", { text: `${gesamtpreis.toFixed(2)} CHF`, bold: true }]);

  // PDF-Definition (mit Logo wenn verfügbar)
  const docDefinition = {
    pageSize: 'A4',
    pageMargins: [50, companyLogo ? 120 : 80, 50, 80],
    
    // Header mit Logo
    header: companyLogo ? function(currentPage, pageCount) {
      return {
        margin: [50, 20, 50, 20],
        table: {
          widths: ['*', 'auto'],
          body: [
            [
              { image: companyLogo, width: 120, border: [false, false, false, false] },
              { 
                text: `Seite ${currentPage} von ${pageCount}`, 
                alignment: 'right', 
                fontSize: 8, 
                color: '#6c757d',
                border: [false, false, false, false]
              }
            ]
          ]
        },
        layout: 'noBorders'
      };
    } : undefined,

    content: [
      { text: "Offerte – PrüfControl", style: "header" },
      { text: `Datum: ${datum}`, margin: [0, 10, 0, 5] },
      { text: `Projekt: ${projektname}`, margin: [0, 0, 0, 5] },
      { text: `Adresse: ${adresse}, ${gemeinde}`, margin: [0, 0, 0, 5] },
      { text: `Wunschtermin: ${wunschtermin}`, margin: [0, 0, 0, 20] },
      
      { text: "Ausgewählte Nachweise", style: "subheader" },
      {
        table: {
          headerRows: 1,
          widths: ['*', 'auto', 'auto'],
          body: nachweisTabelle
        },
        layout: 'lightHorizontalLines',
        margin: [0, 5, 0, 20]
      },
      
      { text: "Nächste Schritte:", style: "subheader" },
      { text: "1. Offerte prüfen und bei Einverständnis zurücksenden" },
      { text: "2. Termine werden nach Auftragserteilung koordiniert" },
      { text: "3. Unterlagen gemäß Checkliste bereitstellen", margin: [0, 0, 0, 15] },
      
      { text: "Kontakt:", style: "subheader" },
      { text: "E-Mail: info@priv-control.ch" },
      { text: "Diese Offerte ist 30 Tage gültig. Änderungen vorbehalten.", style: "klein", margin: [0, 30, 0, 0] }
    ],
    styles: {
      header: { fontSize: 18, bold: true, color: '#0d6efd' },
      subheader: { fontSize: 14, bold: true, margin: [0, 15, 0, 5] },
      klein: { fontSize: 8, color: '#6c757d' }
    }
  };

  // PDF generieren und downloaden
  try {
    pdfMake.createPdf(docDefinition).download(`Offerte_${projektname.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
    console.log("✅ PDF erfolgreich generiert");
  } catch (error) {
    console.error("❌ Fehler beim PDF-Export:", error);
    showError("Fehler beim PDF-Export. Bitte versuchen Sie es erneut.");
  }
}

function getGewerkFullName(gewerk, nachweis) {
  const gewerkNames = {
    'EN101': 'Gebäudehülle',
    'EN102': 'Fenster & Türen', 
    'EN103': 'Heizungsverteilung',
    'EN104': 'Warmwasseranlage',
    'EN105': 'Wärmeerzeugung',
    'EN106': 'Lüftungsanlage',
    'EN107': 'Klimaanlage',
    'EN108': 'Wärmepumpe'
  };
  
  return gewerkNames[nachweis] || nachweis;
}

// =============================================================================
// 🔧 HILFSFUNKTIONEN
// =============================================================================

function collectFormData() {
  const data = {
    projektname: document.getElementById('projektname')?.value?.trim() || '',
    wunschtermin: document.getElementById('wunschtermin')?.value || '',
    adresse: document.getElementById('adresse')?.value?.trim() || '',
    gemeinde: document.getElementById('gemeinde')?.value?.trim() || '',
    parzellennummer: document.getElementById('parzellennummer')?.value?.trim() || '',
    gebaeudenummer: document.getElementById('gebaeudenummer')?.value?.trim() || '',
    art_des_gebaeudes: document.getElementById('art_des_gebaeudes')?.value || '',
    kundenmail: document.getElementById('kundenmail')?.value?.trim() || ''
  };
  
  // Ausgewählte Gewerke sammeln
  const ausgewaehlteGewerke = [];
  document.querySelectorAll('.mini-btn.btn-primary').forEach(btn => {
    ausgewaehlteGewerke.push({
      gewerk: btn.dataset.gewerk,
      nachweis: btn.dataset.nachweis,
      typ: btn.dataset.typ
    });
  });
  
  data.ausgewaehlteGewerke = ausgewaehlteGewerke;
  return data;
}

function showLoadingInContainer(container) {
  // Entferne altes Loading
  const oldLoading = container.querySelector('#loading');
  if (oldLoading) oldLoading.remove();

  // Erstelle neues Loading
  const loading = document.createElement("div");
  loading.id = "loading";
  loading.innerHTML = `
    <div class="text-center my-4">
      <div class="spinner-border text-primary" role="status"></div>
      <p class="mt-2">Offerte wird berechnet...</p>
    </div>`;
  container.appendChild(loading);
}

function hideLoadingInContainer(container) {
  const loading = container.querySelector('#loading');
  if (loading) loading.remove();
}

function showError(message) {
  // Entferne alte Fehlermeldungen
  const oldError = document.getElementById('errorMessage');
  if (oldError) oldError.remove();
  
  const errorDiv = document.createElement('div');
  errorDiv.id = 'errorMessage';
  errorDiv.className = 'alert alert-danger mt-3';
  errorDiv.innerHTML = `<i class="fas fa-exclamation-triangle me-2"></i>${message}`;
  
  const actionButtons = document.querySelector('.action-buttons');
  if (actionButtons) {
    actionButtons.parentNode.insertBefore(errorDiv, actionButtons);
    errorDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

// =============================================================================
// 🌍 GLOBALE EXPORTS
// =============================================================================

// Globale Funktionen exportieren
window.initOfferteErstellen = initOfferteErstellen;
window.initPDF = initPDF;
window.initGooglePlaces = initGooglePlaces;

console.log("✅ Offerte-Erstellung JavaScript geladen (vereinfacht)");