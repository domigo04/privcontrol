// =============================================================================
// UPLOAD-BESTÄTIGUNG JAVASCRIPT
// Datei: js/upload-bestaetigung.js
// =============================================================================

// Dropzone deaktivieren bis manuell initialisiert
Dropzone.autoDiscover = false;

// Globale Variablen
let currentProject = null;
let uploadInstance = null;

// =============================================================================
// HAUPTINITIALISIERUNG
// =============================================================================

async function initUploadConfirmation() {
  console.log("🚀 Upload-Bestätigung initialisieren");
  
  try {
    // Loading anzeigen
    showLoading(true);
    
    // 1. Projekt-ID aus URL extrahieren
    const projektId = getProjektIdFromUrl();
    if (!projektId) {
      throw new Error("Keine Projekt-ID in der URL gefunden");
    }
    
    console.log("📋 Projekt-ID:", projektId);
    document.getElementById('projektIdDisplay').textContent = projektId;
    document.getElementById('projektId').value = projektId;
    
    // 2. Projektdaten laden
    const projektData = await loadProjektData(projektId);
    if (!projektData) {
      throw new Error("Projektdaten konnten nicht geladen werden");
    }
    
    // 3. UI initialisieren
    displayProjektData(projektData);
    initEventListeners();
    
    // Loading ausblenden
    showLoading(false);
    
  } catch (error) {
    console.error("❌ Fehler bei der Initialisierung:", error);
    showLoading(false);
    showError("Fehler beim Laden der Projektdaten. Bitte versuchen Sie es erneut oder erstellen Sie eine neue Offerte.");
    
    // Nach 5 Sekunden zur Offerte-Erstellung weiterleiten
    setTimeout(() => {
      window.location.href = 'offerte-erstellen.html';
    }, 5000);
  }
}

// =============================================================================
// PROJEKTDATEN LADEN
// =============================================================================

// Projekt-ID aus URL extrahieren
function getProjektIdFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('projekt');
}

// Projektdaten laden
async function loadProjektData(projektId) {
  console.log("📊 Lade Projektdaten für ID:", projektId);
  
  try {
    // 1. Versuche aus localStorage zu laden
    const localData = localStorage.getItem(`projekt_${projektId}`);
    if (localData) {
      console.log("✅ Projektdaten aus localStorage geladen");
      const projektData = JSON.parse(localData);
      currentProject = projektData;
      return projektData;
    }
    
    // 2. Fallback: Versuche Server-API
    try {
      const response = await fetch(`/projekt-daten/${projektId}`);
      if (response.ok) {
        const projektData = await response.json();
        console.log("✅ Projekt-Daten vom Server geladen:", projektData);
        currentProject = projektData;
        return projektData;
      }
    } catch (serverError) {
      console.warn("⚠️ Server nicht erreichbar:", serverError);
    }
    
    // 3. Fallback: Mock-Daten für Demo
    console.log("⚠️ Verwende Mock-Daten für Demo");
    const mockProjektData = {
      projektId: projektId,
      projektname: "Demo Projekt",
      kundenmail: "kunde@beispiel.ch", 
      adresse: "Musterstraße 123, 8000 Zürich",
      gemeinde: "Zürich",
      parzellennummer: "1234",
      gebaeudenummer: "42A",
      art_des_gebaeudes: "Einfamilienhaus",
      wunschtermin: new Date().toISOString().split('T')[0],
      gewerke: [
        { gewerk: "Heizung", nachweis: "EN103", typ: "PK", preis: 200, titel: "EN103 – Heizungsverteilung", typLabel: "Privatkontrolle" },
        { gewerk: "Wärmedämmung", nachweis: "EN101", typ: "AK", preis: 250, titel: "EN101 – Gebäudehülle", typLabel: "Ausführungskontrolle" }
      ],
      ausgewaehlteGewerke: [
        { gewerk: "Heizung", nachweis: "EN103", typ: "PK", preis: 200, titel: "EN103 – Heizungsverteilung", typLabel: "Privatkontrolle" },
        { gewerk: "Wärmedämmung", nachweis: "EN101", typ: "AK", preis: 250, titel: "EN101 – Gebäudehülle", typLabel: "Ausführungskontrolle" }
      ],
      status: 'erstellt'
    };
    
    currentProject = mockProjektData;
    return mockProjektData;
    
  } catch (error) {
    console.error("❌ Fehler beim Laden der Projektdaten:", error);
    return null;
  }
}

// =============================================================================
// UI ANZEIGE FUNKTIONEN
// =============================================================================

// Projektdaten anzeigen
function displayProjektData(projektData) {
  console.log("📋 Zeige Projektdaten an:", projektData);
  
  // Header aktualisieren
  document.getElementById('projektNameDisplay').textContent = projektData.projektname || 'Unbenanntes Projekt';
  
  // Projekt-Info Grid
  const infoGrid = document.getElementById('projektInfoGrid');
  infoGrid.innerHTML = `
    <div class="info-item">
      <div class="info-label">Projektname</div>
      <div class="info-value">${projektData.projektname || 'Nicht angegeben'}</div>
    </div>
    <div class="info-item">
      <div class="info-label">Adresse</div>
      <div class="info-value">${projektData.adresse || 'Nicht angegeben'}</div>
    </div>
    <div class="info-item">
      <div class="info-label">Gemeinde</div>
      <div class="info-value">${projektData.gemeinde || 'Nicht angegeben'}</div>
    </div>
    <div class="info-item">
      <div class="info-label">Gebäudeart</div>
      <div class="info-value">${projektData.art_des_gebaeudes || 'Nicht angegeben'}</div>
    </div>
    <div class="info-item">
      <div class="info-label">Wunschtermin</div>
      <div class="info-value">${projektData.wunschtermin ? new Date(projektData.wunschtermin).toLocaleDateString('de-CH') : 'Nicht angegeben'}</div>
    </div>
    <div class="info-item">
      <div class="info-label">E-Mail</div>
      <div class="info-value">${projektData.kundenmail || 'Nicht angegeben'}</div>
    </div>
  `;
  
  // Services anzeigen
  displayServices(projektData);
  
  // Preisberechnung
  calculateAndDisplayPrice(projektData);
  
  // Benötigte Dokumente generieren
  generateRequiredDocuments(projektData);
}

// Services anzeigen
function displayServices(projektData) {
  const servicesList = document.getElementById('servicesList');
  const services = projektData.ausgewaehlteGewerke || projektData.gewerke || [];
  
  if (services.length === 0) {
    servicesList.innerHTML = '<p class="text-muted text-center">Keine Leistungen ausgewählt</p>';
    return;
  }
  
  let html = '';
  services.forEach(service => {
    const iconMap = {
      'Heizung': 'fas fa-fire text-danger',
      'Lüftung': 'fas fa-wind text-info',
      'Wärmedämmung': 'fas fa-shield-alt text-success',
      'Klima': 'fas fa-snowflake text-primary',
      'Sanitär': 'fas fa-tint text-info'
    };
    
    const icon = iconMap[service.gewerk] || 'fas fa-tools text-secondary';
    const typLabel = service.typLabel || (service.typ === 'PK' ? 'Privatkontrolle' : 'Ausführungskontrolle');
    
    html += `
      <div class="service-item">
        <div class="service-icon">
          <i class="${icon}"></i>
        </div>
        <div class="flex-grow-1">
          <h6 class="mb-1">${service.nachweis} – ${service.gewerk}</h6>
          <small class="text-muted">${typLabel}</small>
        </div>
        <div class="fw-bold">CHF ${service.preis}.00</div>
      </div>
    `;
  });
  
  servicesList.innerHTML = html;
}

// Preisberechnung
function calculateAndDisplayPrice(projektData) {
  const GRUNDBETRAG = 1000;
  let total = GRUNDBETRAG;
  
  const services = projektData.ausgewaehlteGewerke || projektData.gewerke || [];
  services.forEach(service => {
    total += service.preis || 0;
  });
  
  // Express-Zuschlag prüfen
  if (projektData.wunschtermin) {
    const heute = new Date();
    const termin = new Date(projektData.wunschtermin);
    const diffStunden = (termin - heute) / (1000 * 60 * 60);
    
    if (diffStunden < 48) {
      total += total * 0.2;
    }
  }
  
  document.getElementById('totalPrice').textContent = `CHF ${total.toFixed(2)}`;
}

// Benötigte Dokumente generieren
function generateRequiredDocuments(projektData) {
  const dokumenteMap = {
    "Heizung": ["Heizungsschema", "Projektbeschrieb Heizung", "Baubeschrieb Heizung", "Energierechnung Heizung"],
    "Lüftung": ["Lüftungsschema", "Kellerplan", "UG-Plan", "Projektbeschrieb Lüftung"],
    "Klima": ["Kälteschema", "Energierechnung Klima", "Projektbeschrieb Klima"],
    "Wärmedämmung": ["Baubeschrieb Wärmedämmung", "U-Wert-Berechnung", "Fassadenplan", "Detailpläne Dämmung"],
    "Sanitär": ["Warmwasser-Schema", "Sanitärplan", "Projektbeschrieb Sanitär"]
  };
  
  const standardDokumente = ["Situationsplan", "Grundrisse", "Baubewilligung", "Technische Spezifikationen"];
  
  const dokumentenListe = document.getElementById('dokumentenListe');
  let html = '';
  
  // Standard-Dokumente
  html += `
    <div class="mb-3">
      <h6><i class="fas fa-file-alt me-2"></i>Standard-Unterlagen</h6>
      <div class="row">
  `;
  
  standardDokumente.forEach(dok => {
    html += `
      <div class="col-md-6 col-lg-4 mb-2">
        <div class="badge bg-secondary w-100 text-start">
          <i class="fas fa-file-pdf"></i>${dok}
        </div>
      </div>
    `;
  });
  
  html += `</div></div>`;
  
  // Gewerk-spezifische Dokumente
  const services = projektData.ausgewaehlteGewerke || projektData.gewerke || [];
  const ausgewaehlteGewerke = [...new Set(services.map(s => s.gewerk))];
  
  ausgewaehlteGewerke.forEach(gewerk => {
    if (dokumenteMap[gewerk]) {
      html += `
        <div class="mb-3">
          <h6><i class="fas fa-tools me-2"></i>${gewerk}</h6>
          <div class="row">
      `;
      
      dokumenteMap[gewerk].forEach(dok => {
        html += `
          <div class="col-md-6 col-lg-4 mb-2">
            <div class="badge bg-info w-100 text-start">
              <i class="fas fa-file-pdf"></i>${dok}
            </div>
          </div>
        `;
      });
      
      html += `</div></div>`;
    }
  });
  
  dokumentenListe.innerHTML = html;
}

// =============================================================================
// EVENT LISTENERS
// =============================================================================

// Event Listeners initialisieren
function initEventListeners() {
  // AGB Checkbox
  const agbCheck = document.getElementById('agbCheck');
  const confirmBtn = document.getElementById('confirmOrderBtn');
  
  agbCheck.addEventListener('change', function() {
    confirmBtn.disabled = !this.checked;
  });
  
  // Bestätigung Button
  confirmBtn.addEventListener('click', function() {
    confirmOrder();
  });
  
  // Modal schließen
  document.getElementById('closeModalBtn')?.addEventListener('click', function() {
    const modal = bootstrap.Modal.getInstance(document.getElementById('uploadSuccessModal'));
    modal?.hide();
    showSuccessMessage();
  });
}

// =============================================================================
// BESTÄTIGUNG & UPLOAD
// =============================================================================

// Bestellung bestätigen
async function confirmOrder() {
  console.log("✅ Bestellung bestätigen");
  
  try {
    // Loading anzeigen
    showLoading(true, "Bestellung wird bestätigt...");
    
    // Simuliere Bestätigung
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Status in localStorage aktualisieren
    if (currentProject) {
      currentProject.status = 'bestätigt';
      currentProject.bestaetigtAm = new Date().toISOString();
      
      localStorage.setItem(`projekt_${currentProject.projektId}`, JSON.stringify(currentProject));
    }
    
    // Bestätigungs-Sektion ausblenden, Upload-Sektion anzeigen
    document.getElementById('confirmationSection').style.display = 'none';
    document.getElementById('uploadSection').classList.add('active');
    
    // Upload initialisieren
    initUpload();
    
    // Loading ausblenden
    showLoading(false);
    
    // Scroll zum Upload-Bereich
    document.getElementById('uploadSection').scrollIntoView({ 
      behavior: 'smooth', 
      block: 'start' 
    });
    
  } catch (error) {
    console.error("❌ Fehler bei der Bestätigung:", error);
    showLoading(false);
    showError("Fehler bei der Bestätigung. Bitte versuchen Sie es erneut.");
  }
}

// Upload initialisieren
function initUpload() {
  console.log("📤 Upload initialisieren");
  
  const uploadBtn = document.getElementById('uploadBtn');
  const statusDiv = document.getElementById('status');
  
  // Mock Upload-System aktivieren
  createMockUploadEndpoint();
  
  uploadInstance = new Dropzone("#nachweisDropzone", {
    url: "/upload",
    method: "post",
    paramName: "datei",
    maxFiles: 10,
    maxFilesize: 10, // MB
    acceptedFiles: ".pdf,.docx,.xlsx,.zip,.jpg,.jpeg,.png",
    autoProcessQueue: false,
    addRemoveLinks: true,
    dictDefaultMessage: "",
    dictRemoveFile: "Entfernen",
    dictMaxFilesExceeded: "Zu viele Dateien",
    dictFileTooBig: "Datei zu groß (max. 10MB)",
    dictInvalidFileType: "Ungültiger Dateityp",
    init: function () {
      const dzInstance = this;
      
      // Upload Button Event
      uploadBtn.addEventListener("click", function(e) {
        e.preventDefault();
        const queued = dzInstance.getQueuedFiles();
        
        if (queued.length === 0) {
          showStatus("⚠️ Bitte mindestens eine Datei hinzufügen.", "warning");
          return;
        }
        
        const projektId = document.getElementById('projektId').value;
        if (!projektId) {
          showStatus("❌ Keine gültige Projekt-ID gefunden", "danger");
          return;
        }
        
        console.log("🚀 Starte Upload für", queued.length, "Dateien mit ID:", projektId);
        dzInstance.processQueue();
      });
      
      // Datei hinzugefügt
      dzInstance.on("addedfile", function(file) {
        console.log("📄 Datei hinzugefügt:", file.name);
        updateUploadButton();
      });
      
      // Datei entfernt
      dzInstance.on("removedfile", function(file) {
        console.log("🗑️ Datei entfernt:", file.name);
        updateUploadButton();
      });
      
      // Vor dem Senden
      dzInstance.on("sending", function(file, xhr, formData) {
        const projektId = document.getElementById('projektId').value;
        formData.append("projektId", projektId);
        showStatus(`⏳ Lade ${file.name} hoch...`, "info");
        uploadBtn.disabled = true;
        uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Wird hochgeladen...';
      });
      
      // Upload erfolgreich
      dzInstance.on("success", function(file, response) {
        console.log("✅ Upload erfolgreich:", file.name);
        
        let responseData = response;
        if (typeof response === 'string') {
          try {
            responseData = JSON.parse(response);
          } catch (e) {
            responseData = { success: true, message: response };
          }
        }
        
        if (responseData && responseData.success) {
          showStatus(`✅ ${file.name} erfolgreich hochgeladen!`, "success");
        } else {
          showStatus(`✅ ${file.name} hochgeladen`, "success");
        }
      });
      
      // Upload-Fehler
      dzInstance.on("error", function(file, errorMessage, xhr) {
        console.error("❌ Upload-Fehler für", file.name, ":", errorMessage);
        
        let errorText = "Upload-Fehler";
        if (typeof errorMessage === 'string') {
          errorText = errorMessage;
        } else if (errorMessage && errorMessage.error) {
          errorText = errorMessage.error;
        } else if (xhr && xhr.status) {
          errorText = `Server-Fehler ${xhr.status}`;
        }
        
        showStatus(`❌ Fehler bei ${file.name}: ${errorText}`, "danger");
      });
      
      // Alle Uploads abgeschlossen
      dzInstance.on("queuecomplete", function() {
        console.log("🏁 Alle Uploads abgeschlossen");
        uploadBtn.disabled = false;
        uploadBtn.innerHTML = '<i class="fas fa-upload me-2"></i>Upload starten';
        
        // Success Modal anzeigen
        const successfulUploads = dzInstance.getAcceptedFiles().length;
        if (successfulUploads > 0) {
          const modal = new bootstrap.Modal(document.getElementById('uploadSuccessModal'));
          modal.show();
          console.log("🎉 Success Modal angezeigt für", successfulUploads, "erfolgreiche Uploads");
        }
      });
      
      // Upload-Fortschritt
      dzInstance.on("uploadprogress", function(file, progress, bytesSent) {
        if (progress % 20 === 0) { // Nur alle 20% loggen
          console.log(`📊 Upload-Fortschritt für ${file.name}: ${Math.round(progress)}%`);
        }
      });
      
      // Upload Button Status aktualisieren
      function updateUploadButton() {
        const hasFiles = dzInstance.getQueuedFiles().length > 0;
        const projektId = document.getElementById('projektId').value;
        
        uploadBtn.disabled = !hasFiles || !projektId;
        
        if (hasFiles && projektId) {
          const fileCount = dzInstance.getQueuedFiles().length;
          uploadBtn.innerHTML = `<i class="fas fa-upload me-2"></i>${fileCount} Datei(en) hochladen`;
        } else if (!projektId) {
          uploadBtn.innerHTML = `<i class="fas fa-exclamation-triangle me-2"></i>Keine gültige Projekt-ID`;
        } else {
          uploadBtn.innerHTML = '<i class="fas fa-upload me-2"></i>Upload starten';
        }
      }
      
      // Initial Setup
      updateUploadButton();
    }
  });
}

// =============================================================================
// MOCK UPLOAD SYSTEM
// =============================================================================

function createMockUploadEndpoint() {
  console.log("🔄 Erstelle Mock Upload-Endpoint für Demo");
  
  const originalFetch = window.fetch;
  
  window.fetch = function(url, options) {
    if (url.includes('/upload') && options && options.method === 'POST') {
      console.log("🔄 Mock Upload Request abgefangen für:", url);
      
      return new Promise((resolve) => {
        const delay = 1000 + Math.random() * 2000; // 1-3 Sekunden delay
        
        setTimeout(() => {
          console.log("✅ Mock Upload erfolgreich nach", Math.round(delay), "ms");
          resolve({
            ok: true,
            status: 200,
            statusText: 'OK',
            json: () => Promise.resolve({
              success: true,
              message: "Datei erfolgreich hochgeladen",
              filename: "mock_upload.pdf",
              projektId: document.getElementById('projektId').value
            }),
            text: () => Promise.resolve('{"success":true,"message":"Upload erfolgreich"}')
          });
        }, delay);
      });
    }
    
    return originalFetch.call(this, url, options);
  };
  
  console.log("✅ Mock Upload-Endpoint erstellt");
}

// =============================================================================
// HILFSFUNKTIONEN
// =============================================================================

function showLoading(show, message = "Projektdaten werden geladen...") {
  const overlay = document.getElementById('loadingOverlay');
  if (show) {
    overlay.style.display = 'flex';
    overlay.querySelector('h5').textContent = message;
  } else {
    overlay.style.display = 'none';
  }
}

function showStatus(message, type) {
  const statusDiv = document.getElementById('status');
  const alertClass = type === 'warning' ? 'alert-warning' : 
                    type === 'info' ? 'alert-info' :
                    type === 'success' ? 'alert-success' : 'alert-danger';
  
  statusDiv.className = `alert ${alertClass} text-center`;
  statusDiv.textContent = message;
  statusDiv.classList.remove('d-none');
  
  if (type === 'success' || type === 'info') {
    setTimeout(() => statusDiv.classList.add('d-none'), 5000);
  }
}

function showError(message) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'alert alert-danger text-center';
  errorDiv.innerHTML = `<i class="fas fa-exclamation-triangle me-2"></i>${message}`;
  
  const container = document.querySelector('.container');
  if (container) {
    container.prepend(errorDiv);
    
    // Nach 10 Sekunden ausblenden
    setTimeout(() => {
      errorDiv.remove();
    }, 10000);
  } else {
    alert("Fehler: " + message);
  }
}

function showSuccessMessage() {
  document.getElementById('uploadSection').style.display = 'none';
  document.getElementById('successMessage').style.display = 'block';
  
  // Scroll to success message
  document.getElementById('successMessage').scrollIntoView({ 
    behavior: 'smooth', 
    block: 'center' 
  });
}

// =============================================================================
// GLOBALE EXPORTS
// =============================================================================

window.initUploadConfirmation = initUploadConfirmation;

console.log("✅ Upload-Bestätigung JavaScript geladen");