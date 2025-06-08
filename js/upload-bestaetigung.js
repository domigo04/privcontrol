// =============================================================================
// UPLOAD-BESTÄTIGUNG JAVASCRIPT (UPLOAD FIRST WORKFLOW) - KORRIGIERT
// Datei: js/upload-bestaetigung.js
// =============================================================================

// Dropzone deaktivieren bis manuell initialisiert
Dropzone.autoDiscover = false;

// Globale Variablen
let currentProject = null;
let uploadInstance = null;
let hasUploadedFiles = false;

// =============================================================================
// HAUPTINITIALISIERUNG (UPLOAD FIRST) - KORRIGIERT
// =============================================================================

async function initUploadConfirmation() {
  console.log("🚀 Upload-Bestätigung initialisieren (Upload First)");
  
  try {
    // Loading anzeigen
    showLoading(true);
    
    // 1. Projekt-ID aus URL extrahieren
    const projektId = getProjektIdFromUrl();
    if (!projektId) {
      throw new Error("Keine Projekt-ID in der URL gefunden");
    }
    
    console.log("📋 Projekt-ID:", projektId);
    
    // IDs sicher setzen (nur wenn Elemente existieren)
    const projektIdDisplay = document.getElementById('projektIdDisplay');
    if (projektIdDisplay) projektIdDisplay.textContent = projektId;
    
    const projektIdInput = document.getElementById('projektId');
    if (projektIdInput) projektIdInput.value = projektId;
    
    // 2. Projektdaten laden
    const projektData = await loadProjektData(projektId);
    if (!projektData) {
      throw new Error("Projektdaten konnten nicht geladen werden");
    }
    
    // 3. UI initialisieren
    displayProjektData(projektData);
    initEventListeners();
    
    // 4. KORRIGIERT: Sicher prüfen ob Elemente existieren
    const confirmationSection = document.getElementById('confirmationSection');
    if (confirmationSection) {
      confirmationSection.style.display = 'none';
    }
    
    const uploadSection = document.getElementById('uploadSection');
    if (uploadSection) {
      uploadSection.classList.add('active');
    }
    
    // Upload sofort aktivieren
    initUpload();
    
    // Loading ausblenden
    showLoading(false);
    
  } catch (error) {
    console.error("❌ Fehler bei der Initialisierung:", error);
    showLoading(false);
    showError("Fehler beim Laden der Projektdaten. Bitte versuchen Sie es erneut oder erstellen Sie eine neue Offerte.");
    
    // Debug: Auto-Redirect deaktiviert
    console.log("Auto-Redirect deaktiviert für Debug");
  }
}

// =============================================================================
// PROJEKTDATEN LADEN (KORRIGIERTE API-ROUTE)
// =============================================================================

// Projekt-ID aus URL extrahieren
function getProjektIdFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('projekt');
}

// Projektdaten laden (KORRIGIERTE ROUTE)
async function loadProjektData(projektId) {
  console.log("📊 Lade Projektdaten für ID:", projektId);
  
  try {
    // 1. ERSTE PRIORITÄT: Backend-API (KORRIGIERTE ROUTE)
    console.log("🌐 Lade Daten vom Backend...");
    try {
      const response = await fetch(`/projekt-daten/${projektId}`);  // ✅ KORRIGIERTE ROUTE
      
      if (response.ok) {
        const apiResult = await response.json();
        
        if (apiResult.success && apiResult.data) {
          console.log("✅ Projektdaten vom Backend geladen:", apiResult.data);
          currentProject = apiResult.data;
          
          // Auch in localStorage für lokale Referenz speichern
          localStorage.setItem(`projekt_${projektId}`, JSON.stringify(apiResult.data));
          
          return apiResult.data;
        } else {
          console.warn("⚠️ Backend API Antwort nicht erfolgreich:", apiResult);
        }
      } else {
        console.warn("⚠️ Backend API Response nicht OK:", response.status);
      }
    } catch (serverError) {
      console.warn("⚠️ Backend nicht erreichbar:", serverError);
    }
    
    // 2. ZWEITE PRIORITÄT: localStorage prüfen
    console.log("🔍 Prüfe localStorage...");
    const localData = localStorage.getItem(`projekt_${projektId}`);
    
    if (localData) {
      console.log("✅ Projektdaten aus localStorage gefunden!");
      try {
        const projektData = JSON.parse(localData);
        console.log("📊 Geladene Projektdaten:", projektData);
        
        // Validiere dass es echte Daten sind
        if (projektData.projektname && projektData.kundenmail) {
          console.log("✅ Echte Projektdaten aus localStorage geladen");
          currentProject = projektData;
          return projektData;
        } else {
          console.log("⚠️ localStorage enthält unvollständige Daten");
        }
      } catch (parseError) {
        console.error("❌ Fehler beim Parsen von localStorage Daten:", parseError);
      }
    } else {
      console.log("⚠️ Keine localStorage Daten gefunden");
    }
    
    // 3. FALLBACK: Fehlermeldung
    throw new Error("Projektdaten konnten nicht gefunden werden");
    
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
  
  // Header aktualisieren (sicher)
  const projektNameDisplay = document.getElementById('projektNameDisplay');
  if (projektNameDisplay) {
    projektNameDisplay.textContent = projektData.projektname || 'Unbenanntes Projekt';
  }
  
  // Projekt-Info Grid (sicher)
  const infoGrid = document.getElementById('projektInfoGrid');
  if (infoGrid) {
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
  }
  
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
  if (!servicesList) return;
  
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
  
  const totalPrice = document.getElementById('totalPrice');
  if (totalPrice) {
    totalPrice.textContent = `CHF ${total.toFixed(2)}`;
  }
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
  if (!dokumentenListe) return;
  
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
          <i class="fas fa-file-pdf me-1"></i>${dok}
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
              <i class="fas fa-file-pdf me-1"></i>${dok}
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
  // AGB Checkbox (sicher)
  const agbCheck = document.getElementById('agbCheck');
  const confirmBtn = document.getElementById('confirmOrderBtn');
  
  if (agbCheck && confirmBtn) {
    agbCheck.addEventListener('change', function() {
      confirmBtn.disabled = !this.checked || !hasUploadedFiles;
    });
    
    // Bestätigung Button
    confirmBtn.addEventListener('click', function() {
      confirmOrder();
    });
  }
  
  // Modal schließen (sicher)
  const closeModalBtn = document.getElementById('closeModalBtn');
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', function() {
      const modal = bootstrap.Modal.getInstance(document.getElementById('uploadSuccessModal'));
      if (modal) modal.hide();
      showSuccessMessage();
    });
  }
}

// =============================================================================
// UPLOAD FIRST WORKFLOW
// =============================================================================

// Upload initialisieren (UPLOAD FIRST)
// =============================================================================
// UPLOAD FIRST WORKFLOW - NUR UPLOAD-BEREICH KORRIGIERT
// =============================================================================

// Upload initialisieren (KORRIGIERT)
function initUpload() {
  console.log("📤 Upload initialisieren (Upload First Workflow)");
  
  const uploadBtn = document.getElementById('uploadBtn');
  const statusDiv = document.getElementById('status');
  
  // Prüfe ob Upload-Button existiert
  if (!uploadBtn) {
    console.error("❌ Upload-Button #uploadBtn nicht gefunden!");
    return;
  }
  
  console.log("✅ Upload-Button gefunden:", uploadBtn);
  
  // Bestätigungs-Bereich initial ausblenden
  hideConfirmationSection();
  
  // Prüfe ob Dropzone Element existiert
  const dropzoneElement = document.getElementById('nachweisDropzone');
  if (!dropzoneElement) {
    console.error("❌ Dropzone Element #nachweisDropzone nicht gefunden!");
    showError("Upload-Bereich nicht verfügbar. Bitte Seite neu laden.");
    return;
  }
  
  console.log("✅ Dropzone Element gefunden:", dropzoneElement);
  
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
      console.log("🚀 Dropzone initialisiert:", dzInstance);
      
      // Upload Button Status aktualisieren (außerhalb definiert)
      function updateUploadButton() {
        console.log("🔄 Update Upload-Button Status");
        
        if (!uploadBtn) {
          console.error("❌ Upload-Button nicht verfügbar für Update");
          return;
        }
        
        const hasFiles = dzInstance.getQueuedFiles().length > 0;
        const projektIdInput = document.getElementById('projektId');
        const projektId = projektIdInput ? projektIdInput.value : null;
        
        console.log("📊 Button-Status:", { hasFiles, projektId });
        
        uploadBtn.disabled = !hasFiles || !projektId;
        
        if (hasFiles && projektId) {
          const fileCount = dzInstance.getQueuedFiles().length;
          uploadBtn.innerHTML = `<i class="fas fa-upload me-2"></i>${fileCount} Datei(en) zu Azure hochladen`;
          console.log(`✅ Button aktiviert für ${fileCount} Dateien`);
        } else if (!projektId) {
          uploadBtn.innerHTML = `<i class="fas fa-exclamation-triangle me-2"></i>Keine gültige Projekt-ID`;
          console.log("⚠️ Button deaktiviert - keine Projekt-ID");
        } else {
          uploadBtn.innerHTML = '<i class="fas fa-upload me-2"></i>Dateien hinzufügen und hochladen';
          console.log("⚠️ Button deaktiviert - keine Dateien");
        }
      }
      
      // Prüfen ob Bestätigung gezeigt werden kann
      function checkIfCanShowConfirmation() {
        const uploadedFiles = dzInstance.getAcceptedFiles().length;
        console.log("🔍 Check Bestätigung:", { uploadedFiles, hasUploadedFiles });
        if (uploadedFiles > 0) {
          showConfirmationSection();
        } else {
          hideConfirmationSection();
        }
      }
      
      // WICHTIG: Upload Button Event DIREKT hier setzen
      console.log("🎯 Setze Upload-Button Event-Listener");
      uploadBtn.addEventListener("click", function(e) {
        e.preventDefault();
        console.log("🖱️ Upload-Button geklickt!");
        
        const queued = dzInstance.getQueuedFiles();
        console.log("📁 Dateien in Queue:", queued.length);
        
        if (queued.length === 0) {
          console.log("⚠️ Keine Dateien in Queue");
          showStatus("⚠️ Bitte mindestens eine Datei hinzufügen.", "warning");
          return;
        }
        
        const projektIdInput = document.getElementById('projektId');
        const projektId = projektIdInput ? projektIdInput.value : null;
        console.log("🆔 Projekt-ID:", projektId);
        
        if (!projektId) {
          console.log("❌ Keine Projekt-ID gefunden");
          showStatus("❌ Keine gültige Projekt-ID gefunden", "danger");
          return;
        }
        
        console.log("🚀 Starte Upload für", queued.length, "Dateien mit ID:", projektId);
        dzInstance.processQueue();
      });
      
      dzInstance.on("addedfile", function(file) {
        console.log("📄 Datei hinzugefügt:", file.name);

        // Warten bis DOM aktualisiert ist, dann Button erneut prüfen
        setTimeout(() => {
          updateUploadButton();
        }, 100);
      });

      
      // Datei entfernt
      dzInstance.on("removedfile", function(file) {
        console.log("🗑️ Datei entfernt:", file.name);
        updateUploadButton();
        checkIfCanShowConfirmation();
      });
      
      // Vor dem Senden
      dzInstance.on("sending", function(file, xhr, formData) {
        const projektIdInput = document.getElementById('projektId');
        const projektId = projektIdInput ? projektIdInput.value : null;
        formData.append("projektId", projektId);
        
        console.log("📤 Sende Datei:", file.name, "für Projekt:", projektId);
        showStatus(`⏳ Lade ${file.name} zu Azure Blob Storage hoch...`, "info");
        
        uploadBtn.disabled = true;
        uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Wird zu Azure hochgeladen...';
      });
      
      // Upload erfolgreich
      dzInstance.on("success", function(file, response) {
        console.log("✅ Upload erfolgreich:", file.name, response);
        
        let responseData = response;
        if (typeof response === 'string') {
          try {
            responseData = JSON.parse(response);
          } catch (e) {
            responseData = { success: true, message: response };
          }
        }
        
        if (responseData && responseData.success) {
          showStatus(`✅ ${file.name} erfolgreich zu Azure hochgeladen!`, "success");
          console.log("🎯 Azure Blob:", responseData.blobName);
        } else {
          showStatus(`⚠️ ${file.name} hochgeladen (unbekannter Status)`, "warning");
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
      
      // WICHTIG: Alle Uploads abgeschlossen = Bestätigung aktivieren
      dzInstance.on("queuecomplete", function() {
        console.log("🏁 Alle Uploads abgeschlossen");
        
        uploadBtn.disabled = false;
        uploadBtn.innerHTML = '<i class="fas fa-upload me-2"></i>Weitere Dateien hochladen';
        
        const successfulUploads = dzInstance.getAcceptedFiles().length;
        const failedUploads = dzInstance.getRejectedFiles().length;
        
        console.log(`📊 Upload-Statistik: ${successfulUploads} erfolgreich, ${failedUploads} fehlgeschlagen`);
        
        if (successfulUploads > 0) {
          hasUploadedFiles = true;
          showConfirmationSection(); // JETZT Bestätigung anzeigen
          
          // Status-Message
          showStatus(`🎉 ${successfulUploads} Datei(en) erfolgreich hochgeladen! Sie können jetzt die Offerte bestätigen.`, "success");
          
          // Projekt-Status auf "dokumentiert" setzen
          updateProjektStatusToDokumentiert();
        }
      });
      
      // Upload-Fortschritt
      dzInstance.on("uploadprogress", function(file, progress, bytesSent) {
        if (progress % 25 === 0) { // Nur alle 25% loggen
          console.log(`📊 Upload-Fortschritt für ${file.name}: ${Math.round(progress)}%`);
        }
      });
      
      // Initial Setup
      console.log("🔄 Initial Button-Update");
      updateUploadButton();
    }
  });
  
  console.log("✅ Upload-Initialisierung abgeschlossen");
}

// Bestätigungs-Bereich ausblenden
function hideConfirmationSection() {
  const confirmSection = document.querySelector('.confirm-section');
  if (confirmSection) {
    confirmSection.style.display = 'none';
  }
}

// Bestätigungs-Bereich anzeigen (nur wenn Dateien hochgeladen)
function showConfirmationSection() {
  if (hasUploadedFiles) {
    const confirmSection = document.querySelector('.confirm-section');
    if (confirmSection) {
      confirmSection.style.display = 'block';
      
      // Bestätigungs-Button Status aktualisieren
      const confirmBtn = document.getElementById('confirmOrderBtn');
      const agbCheck = document.getElementById('agbCheck');
      if (confirmBtn && agbCheck) {
        confirmBtn.disabled = !agbCheck.checked;
      }
      
      // Smooth scroll zur Bestätigung
      setTimeout(() => {
        confirmSection.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }, 1000);
    }
  }
}

// Bestätigung nach Upload ermöglichen
async function confirmOrder() {
  console.log("✅ Bestellung bestätigen (nach Upload)");
  
  try {
    // Prüfen ob Dateien hochgeladen wurden
    const uploadedFiles = uploadInstance ? uploadInstance.getAcceptedFiles().length : 0;
    
    if (uploadedFiles === 0 || !hasUploadedFiles) {
      showStatus("❌ Bitte laden Sie zuerst Dateien hoch, bevor Sie bestätigen.", "danger");
      return;
    }
    
    // Loading anzeigen
    showLoading(true, "Offerte wird bestätigt...");
    
    // Status im Backend aktualisieren
    if (currentProject) {
      try {
        const response = await fetch(`/projekt/${currentProject.projektId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            status: 'bestätigt',
            bestaetigtAm: new Date().toISOString(),
            dokumenteHochgeladen: uploadedFiles
          })
        });
        
        if (response.ok) {
          console.log("✅ Projektstatus auf 'bestätigt' aktualisiert");
        } else {
          console.warn("⚠️ Status-Update fehlgeschlagen");
        }
      } catch (statusError) {
        console.warn("⚠️ Status-Update Fehler:", statusError);
      }
      
      // Auch in localStorage aktualisieren
      currentProject.status = 'bestätigt';
      currentProject.bestaetigtAm = new Date().toISOString();
      localStorage.setItem(`projekt_${currentProject.projektId}`, JSON.stringify(currentProject));
    }
    
    // Simuliere kurze Verarbeitung
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Success anzeigen
    showSuccessMessage();
    
    // Loading ausblenden
    showLoading(false);
    
  } catch (error) {
    console.error("❌ Fehler bei der Bestätigung:", error);
    showLoading(false);
    showStatus("❌ Fehler bei der Bestätigung. Bitte versuchen Sie es erneut.", "danger");
  }
}

// Projekt-Status auf "dokumentiert" setzen
async function updateProjektStatusToDokumentiert() {
  if (!currentProject) return;
  
  try {
    const response = await fetch(`/projekt/${currentProject.projektId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: 'dokumentiert',
        dokumentiertAm: new Date().toISOString()
      })
    });
    
    if (response.ok) {
      console.log("✅ Projektstatus auf 'dokumentiert' aktualisiert");
      
      // Auch in localStorage aktualisieren
      currentProject.status = 'dokumentiert';
      currentProject.dokumentiertAm = new Date().toISOString();
      localStorage.setItem(`projekt_${currentProject.projektId}`, JSON.stringify(currentProject));
    } else {
      console.warn("⚠️ Status-Update auf 'dokumentiert' fehlgeschlagen");
    }
  } catch (error) {
    console.warn("⚠️ Status-Update Fehler:", error);
  }
}

// =============================================================================
// HILFSFUNKTIONEN
// =============================================================================

function showLoading(show, message = "Projektdaten werden geladen...") {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) {
    if (show) {
      overlay.style.display = 'flex';
      const messageElement = overlay.querySelector('h5');
      if (messageElement) {
        messageElement.textContent = message;
      }
    } else {
      overlay.style.display = 'none';
    }
  }
}

function showStatus(message, type) {
  const statusDiv = document.getElementById('status');
  if (!statusDiv) return;
  
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
  const uploadSection = document.getElementById('uploadSection');
  const successMessage = document.getElementById('successMessage');
  
  if (uploadSection) uploadSection.style.display = 'none';
  if (successMessage) successMessage.style.display = 'block';
  
  // Scroll to success message
  if (successMessage) {
    successMessage.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'center' 
    });
  }
}

// =============================================================================
// DEBUG FUNKTIONEN
// =============================================================================

// Debug-Funktionen für localStorage
window.debugProjektData = function() {
  console.log("🔍 Debug: LocalStorage Projekt-Daten");
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('projekt_')) {
      console.log(`${key}:`, JSON.parse(localStorage.getItem(key)));
    }
  }
};

window.clearProjektData = function() {
  console.log("🧹 Lösche alle Projekt-Daten aus localStorage");
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (key && key.startsWith('projekt_')) {
      localStorage.removeItem(key);
      console.log(`Gelöscht: ${key}`);
    }
  }
};

// Projekt-Uploads anzeigen (für Debug)
window.debugProjektUploads = async function(projektId) {
  projektId = projektId || document.getElementById('projektId')?.value;
  if (!projektId) {
    console.log("❌ Keine Projekt-ID angegeben");
    return;
  }
  
  try {
    const response = await fetch(`/projekt/${projektId}/uploads`);
    if (response.ok) {
      const data = await response.json();
      console.log("📁 Uploads für Projekt", projektId, ":", data);
    } else {
      console.log("❌ Uploads konnten nicht geladen werden:", response.status);
    }
  } catch (error) {
    console.log("❌ Fehler beim Laden der Uploads:", error);
  }
};

// =============================================================================
// GLOBALE EXPORTS
// =============================================================================

window.initUploadConfirmation = initUploadConfirmation;

console.log("✅ Upload-Bestätigung JavaScript geladen (Upload First Workflow - KORRIGIERT)");
console.log("🔧 Debug-Funktionen verfügbar: debugProjektData(), clearProjektData(), debugProjektUploads()");
console.log("☁️ Azure Blob Storage Upload aktiviert");