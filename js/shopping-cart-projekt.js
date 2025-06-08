// 🛒 Shopping Cart Projekt-Erstellung
// Datei: js/shopping-cart-projekt.js

// 🔧 Globale Variablen
let autocomplete;
let companyLogo = null;
let currentProject = null;
let shoppingCart = [];
let currentStep = 1;

// Preise
const PREISE = {
  GRUNDBETRAG: 1000,
  PK: 200,
  AK: 250
};

// 🚀 Hauptinitialisierung
function initShoppingCartProjekt() {
  console.log("🛒 Initialisiere Shopping Cart Projekt-Erstellung");
  
  // Logo laden
  loadLogo();
  
  // Event Listeners initialisieren
  initEventListeners();
  initGewerkButtons();
  
  // Formulare vorbereiten
  setMinDateToday();
  
  console.log("✅ Shopping Cart vollständig initialisiert");
}

// 🖼️ Logo laden
function loadLogo() {
  if (typeof logoBase64 !== 'undefined') {
    companyLogo = logoBase64;
    console.log("✅ Logo geladen");
  } else if (typeof window.logoBase64 !== 'undefined') {
    companyLogo = window.logoBase64;
    console.log("✅ Logo geladen");
  } else {
    console.warn("⚠️ Logo nicht gefunden");
  }
}

// =============================================================================
// 🎯 EVENT LISTENER
// =============================================================================

function initEventListeners() {
  console.log("🎯 Initialisiere Event Listeners");
  
  // Start Button
  document.getElementById('startProjektBtn').addEventListener('click', startWorkflow);
  
  // Navigation Buttons
  document.getElementById('step1Next').addEventListener('click', () => navigateToStep(2));
  document.getElementById('step2Back').addEventListener('click', () => navigateToStep(1));
  document.getElementById('step2Next').addEventListener('click', () => navigateToStep(3));
  document.getElementById('step3Back').addEventListener('click', () => navigateToStep(2));
  document.getElementById('step3Next').addEventListener('click', () => navigateToStep(4));
  document.getElementById('step4Back').addEventListener('click', () => navigateToStep(3));
  
  // Action Buttons
  document.getElementById('createProjectBtn').addEventListener('click', handleProjektErstellen);
  document.getElementById('downloadOfferteBtn').addEventListener('click', handleDownloadOfferte);
  document.getElementById('neuesProjektBtn').addEventListener('click', handleNeuesProjekt);
  document.getElementById('resetBtn').addEventListener('click', handleReset);
  
  // Form Validation
  initFormValidation();
}

function initFormValidation() {
  // Real-time Validierung für E-Mail
  const emailInput = document.getElementById('kundenmail');
  emailInput.addEventListener('blur', function() {
    validateEmail(this);
  });
  
  // Datum-Validierung
  const datumInput = document.getElementById('wunschtermin');
  datumInput.addEventListener('change', function() {
    validateDate(this);
  });
}

function setMinDateToday() {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('wunschtermin').min = today;
}

// =============================================================================
// 🔄 WORKFLOW NAVIGATION
// =============================================================================

function startWorkflow() {
  console.log("🚀 Workflow gestartet");
  
  // Hero ausblenden, Container anzeigen
  document.getElementById('heroSection').style.display = 'none';
  document.getElementById('workflowContainer').classList.remove('d-none');
  
  // Zum ersten Schritt navigieren
  navigateToStep(1);
  
  // Smooth scroll zum Container
  document.getElementById('workflowContainer').scrollIntoView({ 
    behavior: 'smooth', 
    block: 'start' 
  });
}

function navigateToStep(stepNumber) {
  console.log(`📍 Navigiere zu Schritt ${stepNumber}`);
  
  // Validierung des aktuellen Schritts (außer bei Zurück-Navigation)
  if (stepNumber > currentStep && !validateCurrentStep()) {
    return;
  }
  
  // Alle Schritte ausblenden
  document.querySelectorAll('.step-section').forEach(section => {
    section.classList.remove('active');
  });
  
  // Aktuellen Schritt anzeigen
  const targetStep = document.getElementById(`step${stepNumber}`);
  if (targetStep) {
    targetStep.classList.add('active');
  }
  
  // Progress Bar und Schritt-Anzeige aktualisieren
  updateProgress(stepNumber);
  currentStep = stepNumber;
  
  // Spezielle Aktionen je Schritt
  if (stepNumber === 3) {
    updateCartDisplay();
  } else if (stepNumber === 4) {
    updateSummary();
  }
  
  // Smooth scroll zum Schritt
  setTimeout(() => {
    targetStep?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);
}

function updateProgress(stepNumber) {
  const progressBar = document.getElementById('progressBar');
  const currentStepSpan = document.getElementById('currentStep');
  
  const progressPercentage = (stepNumber / 4) * 100;
  progressBar.style.width = `${progressPercentage}%`;
  currentStepSpan.textContent = stepNumber;
}

function validateCurrentStep() {
  switch (currentStep) {
    case 1:
      return validateStep1();
    case 2:
      return validateStep2();
    case 3:
      return validateStep3();
    default:
      return true;
  }
}

// =============================================================================
// 📋 SCHRITT-VALIDIERUNGEN
// =============================================================================

function validateStep1() {
  const requiredFields = ['projektname', 'wunschtermin', 'kundenmail'];
  const errors = [];
  
  requiredFields.forEach(fieldId => {
    const input = document.getElementById(fieldId);
    const value = input?.value?.trim();
    
    if (!value) {
      errors.push(getFieldLabel(fieldId));
      input?.classList.add('is-invalid');
    } else {
      input?.classList.remove('is-invalid');
    }
  });
  
  // E-Mail-Format prüfen
  const emailInput = document.getElementById('kundenmail');
  if (emailInput?.value && !validateEmail(emailInput)) {
    errors.push('E-Mail (ungültiges Format)');
  }
  
  if (errors.length > 0) {
    showStepError(`Bitte füllen Sie folgende Felder aus: ${errors.join(', ')}`);
    return false;
  }
  
  return true;
}

function validateStep2() {
  const requiredFields = ['adresse', 'gemeinde', 'art_des_gebaeudes', 'parzellennummer', 'gebaeudenummer'];
  const errors = [];
  
  requiredFields.forEach(fieldId => {
    const input = document.getElementById(fieldId);
    const value = input?.value?.trim();
    
    if (!value) {
      errors.push(getFieldLabel(fieldId));
      input?.classList.add('is-invalid');
    } else {
      input?.classList.remove('is-invalid');
    }
  });
  
  if (errors.length > 0) {
    showStepError(`Bitte füllen Sie folgende Felder aus: ${errors.join(', ')}`);
    return false;
  }
  
  return true;
}

function validateStep3() {
  if (shoppingCart.length === 0) {
    showStepError('Bitte wählen Sie mindestens eine Leistung aus.');
    document.getElementById('gewerkValidierung')?.classList.remove('d-none');
    return false;
  }
  
  document.getElementById('gewerkValidierung')?.classList.add('d-none');
  return true;
}

function getFieldLabel(fieldId) {
  const labels = {
    'projektname': 'Projektname',
    'wunschtermin': 'Wunschtermin',
    'kundenmail': 'E-Mail',
    'adresse': 'Adresse',
    'gemeinde': 'Gemeinde',
    'art_des_gebaeudes': 'Art des Gebäudes',
    'parzellennummer': 'Parzellennummer',
    'gebaeudenummer': 'Gebäudenummer'
  };
  return labels[fieldId] || fieldId;
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

function validateDate(input) {
  const selectedDate = new Date(input.value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (selectedDate < today) {
    input.classList.add('is-invalid');
    showStepError('Das Datum kann nicht in der Vergangenheit liegen.');
    return false;
  }
  
  input.classList.remove('is-invalid');
  return true;
}

// =============================================================================
// 🛒 SHOPPING CART FUNKTIONALITÄT
// =============================================================================

function initGewerkButtons() {
  console.log("🔲 Initialisiere Gewerk-Buttons");
  
  document.querySelectorAll('.mini-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      
      const isSelected = this.classList.contains('btn-primary');
      
      if (isSelected) {
        // Item aus Warenkorb entfernen
        removeFromCart(this);
        this.classList.remove('btn-primary');
        this.classList.add('btn-outline-primary');
      } else {
        // Item zum Warenkorb hinzufügen
        addToCart(this);
        this.classList.remove('btn-outline-primary');
        this.classList.add('btn-primary');
      }
      
      updateCartDisplay();
      updateGewerkValidation();
    });
  });
}

function addToCart(button) {
  const item = {
    id: `${button.dataset.nachweis}-${button.dataset.typ}`,
    gewerk: button.dataset.gewerk,
    nachweis: button.dataset.nachweis,
    typ: button.dataset.typ,
    preis: parseInt(button.dataset.preis),
    titel: `${button.dataset.nachweis} – ${getGewerkFullName(button.dataset.gewerk, button.dataset.nachweis)}`,
    typLabel: button.dataset.typ === 'PK' ? 'Privatkontrolle' : 'Ausführungskontrolle'
  };
  
  shoppingCart.push(item);
  console.log("🛒 Item hinzugefügt:", item);
}

function removeFromCart(button) {
  const itemId = `${button.dataset.nachweis}-${button.dataset.typ}`;
  shoppingCart = shoppingCart.filter(item => item.id !== itemId);
  console.log("🗑️ Item entfernt:", itemId);
}

function updateCartDisplay() {
  const cartItemsContainer = document.getElementById('cartItems');
  const subtotalElement = document.getElementById('subtotal');
  
  if (shoppingCart.length === 0) {
    cartItemsContainer.innerHTML = `
      <p class="text-muted text-center py-3">
        <i class="fas fa-info-circle me-2"></i>
        Noch keine Leistungen ausgewählt
      </p>`;
    subtotalElement.textContent = '1000.00 CHF';
    return;
  }
  
  // Cart Items anzeigen
  let cartHTML = '';
  let subtotal = PREISE.GRUNDBETRAG;
  
  shoppingCart.forEach(item => {
    subtotal += item.preis;
    cartHTML += `
      <div class="cart-item">
        <div class="d-flex justify-content-between align-items-start">
          <div class="flex-grow-1">
            <h6 class="mb-1">${item.nachweis}</h6>
            <small class="text-muted">${item.typLabel}</small>
          </div>
          <div class="text-end">
            <span class="fw-bold">${item.preis} CHF</span>
          </div>
        </div>
      </div>`;
  });
  
  cartItemsContainer.innerHTML = cartHTML;
  subtotalElement.textContent = `${subtotal.toFixed(2)} CHF`;
}

function updateGewerkValidation() {
  const validationDiv = document.getElementById('gewerkValidierung');
  
  if (shoppingCart.length === 0) {
    validationDiv?.classList.remove('d-none');
  } else {
    validationDiv?.classList.add('d-none');
  }
}

// =============================================================================
// 📊 ZUSAMMENFASSUNG
// =============================================================================

function updateSummary() {
  console.log("📊 Update Zusammenfassung");
  
  // Projektdaten anzeigen
  document.getElementById('summaryProjektname').textContent = 
    document.getElementById('projektname').value;
  document.getElementById('summaryTermin').textContent = 
    new Date(document.getElementById('wunschtermin').value).toLocaleDateString('de-CH');
  document.getElementById('summaryEmail').textContent = 
    document.getElementById('kundenmail').value;
  document.getElementById('summaryAdresse').textContent = 
    `${document.getElementById('adresse').value}, ${document.getElementById('gemeinde').value}`;
  document.getElementById('summaryGebaeudeart').textContent = 
    document.getElementById('art_des_gebaeudes').value;
  document.getElementById('summaryParzelle').textContent = 
    `${document.getElementById('parzellennummer').value} / ${document.getElementById('gebaeudenummer').value}`;
  
  // Services anzeigen
  updateSummaryServices();
  
  // Finale Kalkulation
  updateFinalCalculation();
}

function updateSummaryServices() {
  const container = document.getElementById('summaryServices');
  
  if (shoppingCart.length === 0) {
    container.innerHTML = '<p class="text-muted">Keine Leistungen ausgewählt</p>';
    return;
  }
  
  // Gruppiere nach Gewerk
  const grouped = {};
  shoppingCart.forEach(item => {
    if (!grouped[item.gewerk]) {
      grouped[item.gewerk] = [];
    }
    grouped[item.gewerk].push(item);
  });
  
  let html = '';
  Object.keys(grouped).forEach(gewerk => {
    html += `
      <div class="card mb-3">
        <div class="card-header bg-light">
          <h6 class="mb-0">${gewerk}</h6>
        </div>
        <div class="card-body">
    `;
    
    grouped[gewerk].forEach(item => {
      html += `
        <div class="d-flex justify-content-between align-items-center mb-2">
          <div>
            <strong>${item.nachweis}</strong><br>
            <small class="text-muted">${item.typLabel}</small>
          </div>
          <span class="fw-bold">${item.preis} CHF</span>
        </div>
      `;
    });
    
    html += '</div></div>';
  });
  
  container.innerHTML = html;
}

function updateFinalCalculation() {
  let subtotal = PREISE.GRUNDBETRAG;
  let servicesTotal = 0;
  
  shoppingCart.forEach(item => {
    servicesTotal += item.preis;
  });
  
  subtotal += servicesTotal;
  
  // Express-Zuschlag prüfen
  const wunschtermin = document.getElementById('wunschtermin').value;
  const heute = new Date();
  const termin = new Date(wunschtermin);
  const diffStunden = (termin - heute) / (1000 * 60 * 60);
  const isExpress = diffStunden < 48;
  
  let expressZuschlag = 0;
  if (isExpress) {
    expressZuschlag = subtotal * 0.2;
  }
  
  const gesamtpreis = subtotal + expressZuschlag;
  
  // HTML generieren
  let html = `
    <div class="d-flex justify-content-between mb-2">
      <span>Grundbetrag:</span>
      <span>${PREISE.GRUNDBETRAG}.00 CHF</span>
    </div>
  `;
  
  if (servicesTotal > 0) {
    html += `
      <div class="d-flex justify-content-between mb-2">
        <span>Leistungen:</span>
        <span>${servicesTotal}.00 CHF</span>
      </div>
    `;
  }
  
  if (isExpress) {
    html += `
      <div class="d-flex justify-content-between mb-2">
        <span>Express-Zuschlag (&lt;48h):</span>
        <span>+${expressZuschlag.toFixed(2)} CHF</span>
      </div>
    `;
  }
  
  document.getElementById('finalCalculation').innerHTML = html;
  document.getElementById('finalTotal').textContent = `${gesamtpreis.toFixed(2)} CHF`;
}

// =============================================================================
// 🏗️ PROJEKT-ERSTELLUNG
// =============================================================================

async function handleProjektErstellen(e) {
  e.preventDefault();
  console.log("🏗️ Projekt erstellen - START");
  
  const step4 = document.getElementById('step4');
  
  // Loading anzeigen
  showLoadingInContainer(step4, "Projekt wird erstellt und gespeichert...");
  
  try {
    // Projektdaten sammeln
    const projektData = collectFormData();
    
    // Projekt-ID generieren
    const projektId = generateProjektId();
    projektData.projektId = projektId;
    projektData.erstelltAm = new Date().toISOString();
    projektData.status = 'erstellt';
    projektData.ausgewaehlteGewerke = [...shoppingCart];
    
    console.log("📊 Projekt-Daten:", projektData);
    
    // Simuliere Speicherung in Datenbank
    await saveProjektToDatabase(projektData);
    
    // E-Mail senden
    try {
      await sendOfferEmail(projektData, projektId);
      console.log("✅ E-Mail gesendet");
    } catch (emailError) {
      console.warn("⚠️ E-Mail-Versand fehlgeschlagen:", emailError);
    }
    
    // Aktuelles Projekt setzen
    currentProject = projektData;
    
    // Loading ausblenden
    hideLoadingInContainer(step4);
    
    // Zum Success-Schritt navigieren
    navigateToSuccess();
    
  } catch (error) {
    console.error("❌ Fehler bei Projekt-Erstellung:", error);
    hideLoadingInContainer(step4);
    showStepError("Fehler bei der Projekt-Erstellung. Bitte versuchen Sie es erneut.");
  }
}

function navigateToSuccess() {
  // Alle Schritte ausblenden
  document.querySelectorAll('.step-section').forEach(section => {
    section.classList.remove('active');
  });
  
  // Success-Sektion anzeigen
  document.getElementById('successSection').classList.add('active');
  
  // Projektdaten anzeigen
  showSuccessData();
  
  // Progress auf 100% setzen
  document.getElementById('progressBar').style.width = '100%';
  document.getElementById('currentStep').textContent = '✓';
  
  // Smooth scroll
  setTimeout(() => {
    document.getElementById('successSection').scrollIntoView({ 
      behavior: 'smooth', 
      block: 'start' 
    });
  }, 100);
}

function showSuccessData() {
  if (!currentProject) return;
  
  document.getElementById('displayProjektId').textContent = currentProject.projektId;
  document.getElementById('displayProjektname').textContent = currentProject.projektname;
  document.getElementById('displayAdresse').textContent = `${currentProject.adresse}, ${currentProject.gemeinde}`;
  document.getElementById('displayWunschtermin').textContent = 
    new Date(currentProject.wunschtermin).toLocaleDateString('de-CH');
  document.getElementById('displayEmail').textContent = currentProject.kundenmail;
  
  const gewerkeText = currentProject.ausgewaehlteGewerke
    .map(g => `${g.nachweis} (${g.typ})`)
    .join(', ');
  document.getElementById('displayGewerke').textContent = gewerkeText;
}

// =============================================================================
// 💾 DATENBANK FUNKTIONEN
// =============================================================================

async function saveProjektToDatabase(projektData) {
  console.log("💾 Speichere Projekt in Datenbank");
  
  // Simulation für Demo-Zwecke
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // JSON-Struktur für die Datenbank
  const dbEntry = {
    id: projektData.projektId,
    projektname: projektData.projektname,
    kundendaten: {
      email: projektData.kundenmail,
      adresse: projektData.adresse,
      gemeinde: projektData.gemeinde,
      parzellennummer: projektData.parzellennummer,
      gebaeudenummer: projektData.gebaeudenummer,
      art_des_gebaeudes: projektData.art_des_gebaeudes
    },
    projektstatus: {
      status: projektData.status,
      erstelltAm: projektData.erstelltAm,
      wunschtermin: projektData.wunschtermin
    },
    gewerke: projektData.ausgewaehlteGewerke.map(g => ({
      id: g.id,
      gewerk: g.gewerk,
      nachweis: g.nachweis,
      typ: g.typ,
      preis: g.preis,
      status: 'offen'
    })),
    offerte: {
      erstellt: true,
      versendet: false,
      gesamtpreis: calculateTotalPrice(projektData.ausgewaehlteGewerke, projektData.wunschtermin)
    }
  };
  
  console.log("💾 JSON für Datenbank:", JSON.stringify(dbEntry, null, 2));
  
  return { success: true, id: projektData.projektId };
}

function generateProjektId() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `PROJ-${timestamp}-${random}`;
}

function calculateTotalPrice(gewerke, wunschtermin) {
  let total = PREISE.GRUNDBETRAG;
  
  gewerke.forEach(g => {
    total += g.preis;
  });
  
  // Express-Zuschlag
  const heute = new Date();
  const termin = new Date(wunschtermin);
  const diffStunden = (termin - heute) / (1000 * 60 * 60);
  
  if (diffStunden < 48) {
    total += total * 0.2;
  }
  
  return total;
}

// =============================================================================
// 🔄 RESET & NEUE PROJEKTE
// =============================================================================

function handleReset() {
  console.log("🔄 Reset - Neu starten");
  
  if (confirm('Möchten Sie wirklich neu starten? Alle Eingaben gehen verloren.')) {
    // Container ausblenden, Hero anzeigen
    document.getElementById('workflowContainer').classList.add('d-none');
    document.getElementById('heroSection').style.display = 'flex';
    
    // Alles zurücksetzen
    resetWorkflow();
    
    // Zum Hero scrollen
    document.getElementById('heroSection').scrollIntoView({ 
      behavior: 'smooth', 
      block: 'start' 
    });
  }
}

function handleNeuesProjekt() {
  console.log("🆕 Neues Projekt");
  
  // Zum Hero zurückkehren
  document.getElementById('workflowContainer').classList.add('d-none');
  document.getElementById('heroSection').style.display = 'flex';
  
  // Alles zurücksetzen
  resetWorkflow();
  
  // Zum Hero scrollen
  document.getElementById('heroSection').scrollIntoView({ 
    behavior: 'smooth', 
    block: 'start' 
  });
}

function handleDownloadOfferte() {
  console.log("📄 Download Offerte");
  
  if (currentProject) {
    generatePDF(currentProject);
  } else {
    showStepError("Keine Projektdaten verfügbar für PDF-Download.");
  }
}

function resetWorkflow() {
  // Variablen zurücksetzen
  currentProject = null;
  shoppingCart = [];
  currentStep = 1;
  
  // Formular zurücksetzen
  const inputs = document.querySelectorAll('input, select');
  inputs.forEach(input => {
    input.value = '';
    input.classList.remove('is-invalid');
  });
  
  // Gewerk-Buttons zurücksetzen
  document.querySelectorAll('.mini-btn.btn-primary').forEach(btn => {
    btn.classList.remove('btn-primary');
    btn.classList.add('btn-outline-primary');
  });
  
  // Validierungs-Nachrichten ausblenden
  hideAllErrors();
  
  // Progress zurücksetzen
  document.getElementById('progressBar').style.width = '20%';
  document.getElementById('currentStep').textContent = '1';
  
  // Alle Schritte ausblenden
  document.querySelectorAll('.step-section').forEach(section => {
    section.classList.remove('active');
  });
  
  // Datum neu setzen
  setMinDateToday();
}

// =============================================================================
// 🗺️ GOOGLE PLACES API
// =============================================================================

function initGooglePlaces() {
  console.log("🗺️ Initialisiere Google Places API");
  
  const adresseInput = document.getElementById('adresse');
  if (!adresseInput) {
    console.error("❌ Adresse-Input nicht gefunden");
    return;
  }

  const options = {
    types: ['address'],
    componentRestrictions: { country: 'ch' },
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

      let gemeinde = '';
      
      place.address_components.forEach(component => {
        const types = component.types;
        
        if (types.includes('locality')) {
          gemeinde = component.long_name;
        }
      });

      const gemeindeInput = document.getElementById('gemeinde');
      if (gemeindeInput && gemeinde) {
        gemeindeInput.value = gemeinde;
        gemeindeInput.classList.remove('is-invalid');
      }

      console.log("✅ Adresse gewählt:", {
        adresse: place.formatted_address,
        gemeinde: gemeinde
      });
    });
    
    console.log("✅ Google Places API initialisiert");
  } catch (error) {
    console.error("❌ Fehler beim Initialisieren von Google Places:", error);
  }
}

// =============================================================================
// 📧 E-MAIL FUNKTIONALITÄT
// =============================================================================

async function sendOfferEmail(projektData, projektId) {
  console.log("📧 Sende Offerte-E-Mail - START");
  
  try {
    if (typeof emailjs === 'undefined') {
      throw new Error('EmailJS ist nicht geladen');
    }
    
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
    
    const serviceId = 'service_n2f4g3w';
    const templateId = 'template_offerte_bestaet';
    
    const response = await emailjs.send(serviceId, templateId, emailData);
    
    console.log("✅ E-Mail erfolgreich gesendet:", response);
    return { success: true, response };
    
  } catch (error) {
    console.error("❌ E-Mail-Versand Fehler:", error);
    return { success: false, error: error.message };
  }
}

// =============================================================================
// 📄 PDF FUNKTIONALITÄT
// =============================================================================

function generatePDF(projektData) {
  console.log("📄 Generiere PDF");
  
  const projektname = projektData.projektname || "Unbenanntes_Projekt";
  const wunschtermin = projektData.wunschtermin || "Nicht angegeben";
  const adresse = projektData.adresse || "Nicht angegeben";
  const gemeinde = projektData.gemeinde || "Nicht angegeben";

  // Ausgewählte Nachweise aus Projektdaten
  const ausgewaehlt = projektData.ausgewaehlteGewerke || [];
  
  // Preisberechnung
  let gesamtpreis = PREISE.GRUNDBETRAG;
  ausgewaehlt.forEach(item => {
    gesamtpreis += item.preis;
  });
  
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
  ausgewaehlt.forEach(item => {
    if (!gruppiert[item.gewerk]) gruppiert[item.gewerk] = [];
    gruppiert[item.gewerk].push([item.titel, item.typLabel, `${item.preis.toFixed(2)} CHF`]);
  });

  // Tabelle aufbauen
  Object.keys(gruppiert).forEach(gewerk => {
    nachweisTabelle.push([{ text: gewerk, colSpan: 3, bold: true, fillColor: '#f8f9fa' }, {}, {}]);
    nachweisTabelle.push(...gruppiert[gewerk]);
  });

  // Summen hinzufügen
  nachweisTabelle.push([{ text: "Grundbetrag", colSpan: 2 }, "", `${PREISE.GRUNDBETRAG.toFixed(2)} CHF`]);
  if (expressZuschlag) {
    nachweisTabelle.push([{ text: "Expresszuschlag (<48h)", colSpan: 2 }, "", `+${expressBetrag.toFixed(2)} CHF`]);
  }
  nachweisTabelle.push([{ text: "Gesamtpreis", colSpan: 2, bold: true, fillColor: '#e9ecef' }, "", { text: `${gesamtpreis.toFixed(2)} CHF`, bold: true }]);

  // PDF-Definition
  const docDefinition = {
    pageSize: 'A4',
    pageMargins: [50, companyLogo ? 120 : 80, 50, 80],
    
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
      { text: `Projekt-ID: ${projektData.projektId}`, margin: [0, 0, 0, 5] },
      { text: `Projekt: ${projektname}`, margin: [0, 0, 0, 5] },
      { text: `Adresse: ${adresse}, ${gemeinde}`, margin: [0, 0, 0, 5] },
      { text: `Wunschtermin: ${new Date(wunschtermin).toLocaleDateString('de-CH')}`, margin: [0, 0, 0, 20] },
      
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

  try {
    pdfMake.createPdf(docDefinition).download(`Offerte_${projektData.projektId}_${projektname.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
    console.log("✅ PDF erfolgreich generiert");
  } catch (error) {
    console.error("❌ Fehler beim PDF-Export:", error);
    showStepError("Fehler beim PDF-Export. Bitte versuchen Sie es erneut.");
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
  return {
    projektname: document.getElementById('projektname')?.value?.trim() || '',
    wunschtermin: document.getElementById('wunschtermin')?.value || '',
    adresse: document.getElementById('adresse')?.value?.trim() || '',
    gemeinde: document.getElementById('gemeinde')?.value?.trim() || '',
    parzellennummer: document.getElementById('parzellennummer')?.value?.trim() || '',
    gebaeudenummer: document.getElementById('gebaeudenummer')?.value?.trim() || '',
    art_des_gebaeudes: document.getElementById('art_des_gebaeudes')?.value || '',
    kundenmail: document.getElementById('kundenmail')?.value?.trim() || ''
  };
}

function showLoadingInContainer(container, message = "Wird verarbeitet...") {
  const oldLoading = container.querySelector('#loading');
  if (oldLoading) oldLoading.remove();

  const loading = document.createElement("div");
  loading.id = "loading";
  loading.innerHTML = `
    <div class="text-center my-4">
      <div class="spinner-border text-primary" role="status"></div>
      <p class="mt-2">${message}</p>
    </div>`;
  container.appendChild(loading);
}

function hideLoadingInContainer(container) {
  const loading = container.querySelector('#loading');
  if (loading) loading.remove();
}

function showStepError(message) {
  const oldError = document.querySelector('.step-error');
  if (oldError) oldError.remove();
  
  const errorDiv = document.createElement('div');
  errorDiv.className = 'alert alert-danger mt-3 step-error';
  errorDiv.innerHTML = `<i class="fas fa-exclamation-triangle me-2"></i>${message}`;
  
  const activeStep = document.querySelector('.step-section.active');
  if (activeStep) {
    const cardBody = activeStep.querySelector('.card-body');
    if (cardBody) {
      cardBody.appendChild(errorDiv);
      errorDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
}

function hideAllErrors() {
  document.querySelectorAll('.step-error').forEach(error => error.remove());
  document.getElementById('gewerkValidierung')?.classList.add('d-none');
}

// =============================================================================
// 🌍 GLOBALE EXPORTS
// =============================================================================

window.initShoppingCartProjekt = initShoppingCartProjekt;
window.initGooglePlaces = initGooglePlaces;

console.log("✅ Shopping Cart Projekt JavaScript geladen");