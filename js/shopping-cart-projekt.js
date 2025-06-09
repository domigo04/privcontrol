// 🛒 Shopping Cart Projekt-Erstellung
// Datei: js/shopping-cart-projekt.js

// 🔧 Globale Variablen
let autocomplete;
let companyLogo = null;
let currentProject = null;
let shoppingCart = [];
let currentStep = 1;
const TOTAL_STEPS = 4; // ✅ Konstantendefinition für Progressbar

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
  const startBtn = document.getElementById('startProjektBtn');
  if (startBtn) {
    startBtn.addEventListener('click', startWorkflow);
    console.log("✅ Start Button Event Listener hinzugefügt");
  } else {
    console.error("❌ Start Button nicht gefunden!");
  }
  
  // Navigation Buttons
  const step1Next = document.getElementById('step1Next');
  if (step1Next) step1Next.addEventListener('click', () => navigateToStep(2));
  
  const step2Back = document.getElementById('step2Back');
  if (step2Back) step2Back.addEventListener('click', () => navigateToStep(1));
  
  const step2Next = document.getElementById('step2Next');
  if (step2Next) step2Next.addEventListener('click', () => navigateToStep(3));
  
  const step3Back = document.getElementById('step3Back');
  if (step3Back) step3Back.addEventListener('click', () => navigateToStep(2));
  
  const step3Next = document.getElementById('step3Next');
  if (step3Next) step3Next.addEventListener('click', () => navigateToStep(4));
  
  const step4Back = document.getElementById('step4Back');
  if (step4Back) step4Back.addEventListener('click', () => navigateToStep(3));
  
  // Action Buttons
  const createBtn = document.getElementById('createProjectBtn');
  if (createBtn) createBtn.addEventListener('click', handleProjektErstellen);
  
  const downloadBtn = document.getElementById('downloadOfferteBtn');
  if (downloadBtn) downloadBtn.addEventListener('click', handleDownloadOfferte);
  
  const neuesBtn = document.getElementById('neuesProjektBtn');
  if (neuesBtn) neuesBtn.addEventListener('click', handleNeuesProjekt);
  
  const resetBtn = document.getElementById('resetBtn');
  if (resetBtn) resetBtn.addEventListener('click', handleReset);
  
  // Form Validation
  initFormValidation();
}

function initFormValidation() {
  // Real-time Validierung für E-Mail
  const emailInput = document.getElementById('kundenmail');
  if (emailInput) {
    emailInput.addEventListener('blur', function() {
      validateEmail(this);
    });
  }
  
  // Datum-Validierung
  const datumInput = document.getElementById('wunschtermin');
  if (datumInput) {
    datumInput.addEventListener('change', function() {
      validateDate(this);
    });
  }
}

function setMinDateToday() {
  const today = new Date().toISOString().split('T')[0];
  const wunschterminInput = document.getElementById('wunschtermin');
  if (wunschterminInput) {
    wunschterminInput.min = today;
  }
}

// =============================================================================
// 🔄 WORKFLOW NAVIGATION
// =============================================================================

function startWorkflow() {
  console.log("🚀 Workflow gestartet");
  
  // Hero ausblenden, Container anzeigen
  const heroSection = document.getElementById('heroSection');
  const workflowContainer = document.getElementById('workflowContainer');
  
  if (heroSection) heroSection.style.display = 'none';
  if (workflowContainer) workflowContainer.classList.remove('d-none');
  
  // Zum ersten Schritt navigieren
  navigateToStep(1);
  
  // Smooth scroll zum Container
  if (workflowContainer) {
    workflowContainer.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'start' 
    });
  }
}

function navigateToStep(stepNumber) {
  console.log(`📍 Navigiere zu Schritt ${stepNumber}`);
  
  // ✅ KORRIGIERT: Validierung nur bei Vorwärts-Navigation
  if (stepNumber > currentStep && !validateCurrentStep()) {
    console.log("❌ Validierung fehlgeschlagen, bleibe bei Schritt", currentStep);
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
    console.log(`✅ Schritt ${stepNumber} aktiviert`);
  } else {
    console.error(`❌ Schritt ${stepNumber} nicht gefunden!`);
  }
  
  // ✅ KORRIGIERT: Progress Bar und Current Step korrekt aktualisieren
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
    if (targetStep) {
      targetStep.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, 100);
}

// ✅ KORRIGIERT: Progressbar-Update Funktion
function updateProgress(stepNumber) {
  const progressBar = document.getElementById('progressBar');
  const currentStepSpan = document.getElementById('currentStep');
  
  console.log(`📊 Update Progress: Schritt ${stepNumber} von ${TOTAL_STEPS}`);
  
  if (progressBar) {
    // ✅ KORRIGIERT: Korrekte Prozentberechnung
    const progressPercentage = (stepNumber / TOTAL_STEPS) * 100;
    progressBar.style.width = `${progressPercentage}%`;
    console.log(`📊 Progress Bar: ${progressPercentage}%`);
  } else {
    console.error("❌ Progress Bar Element nicht gefunden!");
  }
  
  if (currentStepSpan) {
    currentStepSpan.textContent = stepNumber;
    console.log(`📊 Current Step Display: ${stepNumber}`);
  } else {
    console.error("❌ Current Step Span nicht gefunden!");
  }
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
      if (input) input.classList.add('is-invalid');
    } else {
      if (input) input.classList.remove('is-invalid');
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
      if (input) input.classList.add('is-invalid');
    } else {
      if (input) input.classList.remove('is-invalid');
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
    const validationDiv = document.getElementById('gewerkValidierung');
    if (validationDiv) validationDiv.classList.remove('d-none');
    return false;
  }
  
  const validationDiv = document.getElementById('gewerkValidierung');
  if (validationDiv) validationDiv.classList.add('d-none');
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
  
  if (!cartItemsContainer || !subtotalElement) return;
  
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
  
  if (validationDiv) {
    if (shoppingCart.length === 0) {
      validationDiv.classList.remove('d-none');
    } else {
      validationDiv.classList.add('d-none');
    }
  }
}

// =============================================================================
// 📊 ZUSAMMENFASSUNG
// =============================================================================

function updateSummary() {
  console.log("📊 Update Zusammenfassung");
  
  // Projektdaten anzeigen
  const summaryProjektname = document.getElementById('summaryProjektname');
  if (summaryProjektname) {
    summaryProjektname.textContent = document.getElementById('projektname')?.value || '';
  }
  
  const summaryTermin = document.getElementById('summaryTermin');
  if (summaryTermin) {
    const wunschtermin = document.getElementById('wunschtermin')?.value;
    if (wunschtermin) {
      summaryTermin.textContent = new Date(wunschtermin).toLocaleDateString('de-CH');
    }
  }
  
  const summaryEmail = document.getElementById('summaryEmail');
  if (summaryEmail) {
    summaryEmail.textContent = document.getElementById('kundenmail')?.value || '';
  }
  
  const summaryAdresse = document.getElementById('summaryAdresse');
  if (summaryAdresse) {
    const adresse = document.getElementById('adresse')?.value || '';
    const gemeinde = document.getElementById('gemeinde')?.value || '';
    summaryAdresse.textContent = `${adresse}, ${gemeinde}`;
  }
  
  const summaryGebaeudeart = document.getElementById('summaryGebaeudeart');
  if (summaryGebaeudeart) {
    summaryGebaeudeart.textContent = document.getElementById('art_des_gebaeudes')?.value || '';
  }
  
  const summaryParzelle = document.getElementById('summaryParzelle');
  if (summaryParzelle) {
    const parzelle = document.getElementById('parzellennummer')?.value || '';
    const gebaeude = document.getElementById('gebaeudenummer')?.value?.trim() || '';
    summaryParzelle.textContent = `${parzelle} / ${gebaeude}`;
  }
  
  // Services anzeigen
  updateSummaryServices();
  
  // Finale Kalkulation
  updateFinalCalculation();
}

function updateSummaryServices() {
  const container = document.getElementById('summaryServices');
  if (!container) return;
  
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
  const wunschtermin = document.getElementById('wunschtermin')?.value;
  const heute = new Date();
  const termin = new Date(wunschtermin);
  const diffStunden = (termin - heute) / (1000 * 60 * 60);
  const isExpress = diffStunden < 48;
  
  let expressZuschlag = 0;
  if (isExpress && !isNaN(diffStunden)) {
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
  
  if (isExpress && !isNaN(diffStunden)) {
    html += `
      <div class="d-flex justify-content-between mb-2">
        <span>Express-Zuschlag (&lt;48h):</span>
        <span>+${expressZuschlag.toFixed(2)} CHF</span>
      </div>
    `;
  }
  
  const finalCalculation = document.getElementById('finalCalculation');
  if (finalCalculation) {
    finalCalculation.innerHTML = html;
  }
  
  const finalTotal = document.getElementById('finalTotal');
  if (finalTotal) {
    finalTotal.textContent = `${gesamtpreis.toFixed(2)} CHF`;
  }
}

// =============================================================================
// 🏗️ PROJEKT-ERSTELLUNG (KORRIGIERT)
// =============================================================================

async function handleProjektErstellen() {
    console.log('🏗️ Projekt wird erstellt...');
    
    try {
        // 1. Projektdaten sammeln
        const projektData = generateProjektData();
        console.log('📦 Projektdaten gesammelt:', projektData);
        
        // 2. Projekt im Backend speichern
        const result = await saveProjektToDatabase(projektData);
        console.log('💾 Backend-Response:', result);
        
        if (result && result.success && result.projektId) {
            const echteBackendId = result.projektId;
            console.log('🔑 Echte Backend-ID erhalten:', echteBackendId);
            
            // 3. Projektdaten mit echter ID aktualisieren
            projektData.projektId = echteBackendId;
            currentProject = projektData;
            
            // 4. E-Mail mit RICHTIGER Backend-ID senden
            console.log('📧 E-Mail wird mit Backend-ID gesendet:', echteBackendId);
            await sendOfferEmail(projektData, echteBackendId);
            
            // 5. Erfolg anzeigen
            console.log('✅ Projekt erfolgreich erstellt und E-Mail versendet!');
            navigateToSuccess();
            
        } else {
            throw new Error('Backend-Speicherung fehlgeschlagen: ' + (result?.error || 'Unbekannter Fehler'));
        }
        
    } catch (error) {
        console.error('❌ Fehler beim Projekt erstellen:', error);
        showStepError('Fehler beim Erstellen des Projekts: ' + error.message);
    }
}

// Fehlende generateProjektData Funktion
function generateProjektData() {
    // Sammle Formulardaten
    const formData = collectFormData();
    
    // Generiere Frontend-ID (wird später durch Backend-ID ersetzt)
    const projektId = generateProjektId();
    
    // Erstelle vollständige Projektdaten
    const projektData = {
        ...formData,
        projektId: projektId,
        ausgewaehlteGewerke: shoppingCart.map(item => ({
            gewerk: item.gewerk,
            nachweis: item.nachweis,
            typ: item.typ,
            typLabel: item.typLabel,
            preis: item.preis,
            titel: item.titel
        })),
        gesamtpreis: calculateTotalPrice(),
        erstelltAm: new Date().toISOString(),
        status: 'erstellt'
    };
    
    console.log('📊 Generierte Projektdaten:', projektData);
    return projektData;
}

// Hilfsfunktion für Gesamtpreis-Berechnung
function calculateTotalPrice() {
    let total = PREISE.GRUNDBETRAG;
    
    shoppingCart.forEach(item => {
        total += item.preis;
    });
    
    // Express-Zuschlag prüfen
    const wunschtermin = document.getElementById('wunschtermin')?.value;
    if (wunschtermin) {
        const heute = new Date();
        const termin = new Date(wunschtermin);
        const diffStunden = (termin - heute) / (1000 * 60 * 60);
        
        if (!isNaN(diffStunden) && diffStunden < 48) {
            total += total * 0.2; // 20% Express-Zuschlag
        }
    }
    
    return total;
}

// =============================================================================
// 💾 BACKEND-INTEGRATION (KORRIGIERT - KEIN FALLBACK)
// =============================================================================

async function saveProjektToDatabase(projektData) {
  console.log("💾 Speichere Projekt im Backend");
  
  try {
    // Backend-API aufrufen
    const response = await fetch('/projekt-anlegen', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(projektData)
    });
    
    if (!response.ok) {
      throw new Error(`Backend-Fehler: ${response.status} - ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log("📨 Backend-Response:", result);
    
    if (!result.success) {
      throw new Error(result.message || 'Backend meldet Fehler');
    }
    
    console.log("✅ Projekt erfolgreich im Backend gespeichert");
    console.log("🔑 Backend Projekt-ID:", result.projektId);
    console.log("📊 Interne ID:", result.interneId);
    
    // Auch in localStorage mit ECHTER ID speichern
    if (result.projektId) {
      projektData.projektId = result.projektId; // ID aktualisieren
      localStorage.setItem(`projekt_${result.projektId}`, JSON.stringify(projektData));
      console.log("💾 Projekt in localStorage gespeichert mit echter ID:", result.projektId);
    }
    
    return result; // Enthält: { success: true, projektId: "25001", interneId: "...", message: "..." }
    
  } catch (error) {
    console.error("❌ Fehler beim Speichern im Backend:", error);
    
    // ✅ KORRIGIERT: KEIN FALLBACK - Echten Fehler werfen
    throw new Error(`Backend nicht erreichbar: ${error.message}`);
  }
}

// =============================================================================
// 📧 E-MAIL FUNKTIONALITÄT (KORRIGIERT)
// =============================================================================

async function sendOfferEmail(projektData, projektId) {
  console.log("📧 Sende Offerte-E-Mail - START");
  console.log("📧 Verwende Projekt-ID für E-Mail:", projektId);
  
  try {
    if (typeof emailjs === 'undefined') {
      throw new Error('EmailJS ist nicht geladen');
    }
    
    const emailData = {
      to_email: projektData.kundenmail,
      to_name: projektData.projektname,
      projekt_id: projektId, // ✅ ECHTE BACKEND-ID
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
      ).join(', '),
      // ✅ UPLOAD-LINK mit ECHTER BACKEND-ID
      upload_link: `${window.location.origin}/upload-bestaetigung.html?projekt=${encodeURIComponent(projektId)}`
    };
    
    console.log("📧 E-Mail Upload-Link:", emailData.upload_link);
    
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
// 🔄 SUCCESS & NAVIGATION
// =============================================================================

function navigateToSuccess() {
  // Alle Schritte ausblenden
  document.querySelectorAll('.step-section').forEach(section => {
    section.classList.remove('active');
  });
  
  // Success-Sektion anzeigen
  const successSection = document.getElementById('successSection');
  if (successSection) {
    successSection.classList.add('active');
  }
  
  // Projektdaten anzeigen
  showSuccessData();
  
  // ✅ KORRIGIERT: Progress auf 100% setzen
  const progressBar = document.getElementById('progressBar');
  if (progressBar) {
    progressBar.style.width = '100%';
  }
  
  const currentStepSpan = document.getElementById('currentStep');
  if (currentStepSpan) {
    currentStepSpan.textContent = '✓';
  }
  
  // Smooth scroll
  setTimeout(() => {
    if (successSection) {
      successSection.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }
  }, 100);
}

function showSuccessData() {
  if (!currentProject) return;
  
  const displayProjektId = document.getElementById('displayProjektId');
  if (displayProjektId) {
    displayProjektId.textContent = currentProject.projektId;
  }
  
  const displayProjektname = document.getElementById('displayProjektname');
  if (displayProjektname) {
    displayProjektname.textContent = currentProject.projektname;
  }
  
  const displayAdresse = document.getElementById('displayAdresse');
  if (displayAdresse) {
    displayAdresse.textContent = `${currentProject.adresse}, ${currentProject.gemeinde}`;
  }
  
  const displayWunschtermin = document.getElementById('displayWunschtermin');
  if (displayWunschtermin) {
    displayWunschtermin.textContent = new Date(currentProject.wunschtermin).toLocaleDateString('de-CH');
  }
  
  const displayEmail = document.getElementById('displayEmail');
  if (displayEmail) {
    displayEmail.textContent = currentProject.kundenmail;
  }
  
  const gewerkeText = currentProject.ausgewaehlteGewerke
    .map(g => `${g.nachweis} (${g.typ})`)
    .join(', ');
  
  const displayGewerke = document.getElementById('displayGewerke');
  if (displayGewerke) {
    displayGewerke.textContent = gewerkeText;
  }
}

// =============================================================================
// 🔄 RESET & NAVIGATION
// =============================================================================

function handleReset() {
  console.log("🔄 Reset - Neu starten");
  
  if (confirm('Möchten Sie wirklich neu starten? Alle Eingaben gehen verloren.')) {
    // Container ausblenden, Hero anzeigen
    const workflowContainer = document.getElementById('workflowContainer');
    const heroSection = document.getElementById('heroSection');
    
    if (workflowContainer) workflowContainer.classList.add('d-none');
    if (heroSection) heroSection.style.display = 'flex';
    
    // Alles zurücksetzen
    resetWorkflow();
    
    // Zum Hero scrollen
    if (heroSection) {
      heroSection.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }
  }
}

function handleNeuesProjekt() {
  console.log("🆕 Neues Projekt");
  
  // Zum Hero zurückkehren
  const workflowContainer = document.getElementById('workflowContainer');
  const heroSection = document.getElementById('heroSection');
  
  if (workflowContainer) workflowContainer.classList.add('d-none');
  if (heroSection) heroSection.style.display = 'flex';
  
  // Alles zurücksetzen
  resetWorkflow();
  
  // Zum Hero scrollen
  if (heroSection) {
    heroSection.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'start' 
    });
  }
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
  
  // ✅ KORRIGIERT: Progress korrekt zurücksetzen
  const progressBar = document.getElementById('progressBar');
  if (progressBar) {
    progressBar.style.width = '25%'; // 1/4 = 25%
  }
  
  const currentStepSpan = document.getElementById('currentStep');
  if (currentStepSpan) {
    currentStepSpan.textContent = '1';
  }
  
  // Alle Schritte ausblenden
  document.querySelectorAll('.step-section').forEach(section => {
    section.classList.remove('active');
  });
  
  // Datum neu setzen
  setMinDateToday();
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

function generateProjektId() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `PROJ-${timestamp}-${random}`;
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

// Fehlende showError Funktion hinzugefügt
function showError(message) {
  showStepError(message);
}

function hideAllErrors() {
  document.querySelectorAll('.step-error').forEach(error => error.remove());
  const validationDiv = document.getElementById('gewerkValidierung');
  if (validationDiv) validationDiv.classList.add('d-none');
}

// =============================================================================
// 📄 PDF FUNKTIONALITÄT (VOLLSTÄNDIG)
// =============================================================================

function generatePDF(projektData) {
  console.log("📄 Generiere PDF für:", projektData.projektname);
  
  // Prüfe ob pdfMake verfügbar ist
  if (typeof pdfMake === 'undefined') {
    console.error("❌ pdfMake ist nicht geladen!");
    showStepError("PDF-Bibliothek nicht verfügbar. Bitte Seite neu laden.");
    return;
  }
  
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
    gruppiert[item.gewerk].push([
      item.titel || `${item.nachweis} – ${item.gewerk}`, 
      item.typLabel, 
      `${item.preis.toFixed(2)} CHF`
    ]);
  });

  // Tabelle aufbauen
  Object.keys(gruppiert).forEach(gewerk => {
    nachweisTabelle.push([
      { text: gewerk, colSpan: 3, bold: true, fillColor: '#f8f9fa' }, 
      {}, 
      {}
    ]);
    nachweisTabelle.push(...gruppiert[gewerk]);
  });

  // Summen hinzufügen
  nachweisTabelle.push([
    { text: "Grundbetrag", colSpan: 2 }, 
    "", 
    `${PREISE.GRUNDBETRAG.toFixed(2)} CHF`
  ]);
  
  if (expressZuschlag) {
    nachweisTabelle.push([
      { text: "Expresszuschlag (<48h)", colSpan: 2 }, 
      "", 
      `+${expressBetrag.toFixed(2)} CHF`
    ]);
  }
  
  nachweisTabelle.push([
    { text: "Gesamtpreis", colSpan: 2, bold: true, fillColor: '#e9ecef' }, 
    "", 
    { text: `${gesamtpreis.toFixed(2)} CHF`, bold: true }
  ]);

  // PDF-Definition
  const docDefinition = {
    pageSize: 'A4',
    pageMargins: [50, 80, 50, 80],

    content: [
      { text: "Offerte – Priv-Control", style: "header" },
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
      { text: "3. Unterlagen gemäss Checkliste bereitstellen", margin: [0, 0, 0, 15] },
      
      { text: "Kontakt:", style: "subheader" },
      { text: "E-Mail: info@priv-control.ch" },
      { text: "Telefon: +41 76 817 53 63" },
      { text: "Diese Offerte ist 30 Tage gültig. Änderungen vorbehalten.", style: "klein", margin: [0, 30, 0, 0] }
    ],
    styles: {
      header: { fontSize: 18, bold: true, color: '#0d6efd' },
      subheader: { fontSize: 14, bold: true, margin: [0, 15, 0, 5] },
      klein: { fontSize: 8, color: '#6c757d' }
    }
  };

  try {
    const safeProjektname = projektname.replace(/[^a-zA-Z0-9\-_]/g, '_');
    const filename = `Offerte_${projektData.projektId}_${safeProjektname}.pdf`;
    
    pdfMake.createPdf(docDefinition).download(filename);
    console.log("✅ PDF erfolgreich generiert:", filename);
  } catch (error) {
    console.error("❌ Fehler beim PDF-Export:", error);
    showStepError("Fehler beim PDF-Export. Bitte versuchen Sie es erneut.");
  }
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

  if (typeof google === 'undefined' || !google.maps || !google.maps.places) {
    console.warn("⚠️ Google Places API nicht verfügbar");
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
// 🌍 GLOBALE EXPORTS
// =============================================================================

window.initShoppingCartProjekt = initShoppingCartProjekt;
window.initGooglePlaces = initGooglePlaces;

console.log("✅ Shopping Cart Projekt JavaScript geladen (BACKEND-FEHLER + PROGRESSBAR KORRIGIERT)");