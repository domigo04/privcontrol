// Muss ganz oben stehen
Dropzone.autoDiscover = false;

function getProjektId() {
    // Erst hidden input prüfen
    const hiddenInput = document.getElementById('projektId');
    if (hiddenInput && hiddenInput.value) {
        console.log("✅ Projekt-ID aus Hidden Input:", hiddenInput.value);
        return hiddenInput.value;
    }
    
    // Dann URL Parameter prüfen
    const urlParam = new URLSearchParams(window.location.search).get("projekt");
    if (urlParam) {
        console.log("✅ Projekt-ID aus URL:", urlParam);
        // Auch in Hidden Input setzen
        if (hiddenInput) {
            hiddenInput.value = urlParam;
        }
        return urlParam;
    }
    
    console.log("❌ Keine Projekt-ID gefunden");
    return "";
}

function debugUploadZustand(dz) {
    console.log("\n========== DEBUG UPLOAD ==========");
    console.log("Projekt-ID:", getProjektId());
    console.log("Dateien in Warteschlange:", dz.getQueuedFiles().map(f => f.name));
    console.log("Upload-Button deaktiviert:", document.getElementById("uploadBtn")?.disabled);
    console.log("Hidden Input Value:", document.getElementById('projektId')?.value);
    console.log("URL Parameter:", new URLSearchParams(window.location.search).get("projekt"));
    console.log("===================================\n");
}

// 🔐 Zugangsschutz - Prüft ob gültige Projekt-ID vorhanden
function checkProjektZugang() {
    const projektId = getProjektId();
    
    if (!projektId) {
        console.log("❌ Kein Zugang - keine Projekt-ID");
        showNoAccessModal();
        return false;
    }
    
    console.log("✅ Zugang gewährt für Projekt:", projektId);
    return true;
}

function showNoAccessModal() {
    const modal = document.getElementById('noAccessModal');
    if (modal) {
        const modalInstance = new bootstrap.Modal(modal);
        modalInstance.show();
    }
}

// 📊 Projekt-Daten laden
async function ladeProjektDaten(projektId) {
    console.log("📊 Lade Projekt-Daten für ID:", projektId);
    
    try {
        showLoading("Projektdaten werden geladen...");
        
        const response = await fetch(`/projekt-daten/${projektId}`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const projektDaten = await response.json();
        console.log("✅ Projekt-Daten geladen:", projektDaten);
        
        hideLoading();
        zeigeProjektDaten(projektDaten);
        generiereBenoetigteDokumente(projektDaten);
        
        return projektDaten;
        
    } catch (error) {
        console.error("❌ Fehler beim Laden der Projekt-Daten:", error);
        hideLoading();
        showStatus("❌ Projekt-Daten konnten nicht geladen werden", "danger");
        
        // Nach 3 Sekunden zur Offerte-Erstellung weiterleiten
        setTimeout(() => {
            window.location.href = '/offerte-erstellen.html';
        }, 3000);
        
        return null;
    }
}

// 📋 Projekt-Daten anzeigen
function zeigeProjektDaten(daten) {
    console.log("📋 Zeige Projekt-Daten an");
    
    // Projekt-Name im Header
    const projektNameDisplay = document.getElementById('projektNameDisplay');
    const projektStatusDisplay = document.getElementById('projektStatusDisplay');
    
    if (projektNameDisplay) {
        projektNameDisplay.textContent = daten.projektname || 'Unbenanntes Projekt';
    }
    
    if (projektStatusDisplay) {
        projektStatusDisplay.textContent = 'Bereit für Upload';
    }
    
    // Projekt-Info Bereich füllen
    const infoFelder = {
        'displayProjektId': daten.projektId,
        'displayProjektname': daten.projektname,
        'displayGemeinde': daten.gemeinde,
        'displayWunschtermin': daten.wunschtermin || 'Nicht angegeben',
        'displayArtDesGebaeudes': daten.art_des_gebaeudes || 'Nicht angegeben',
        'displayKundenmail': daten.kundenmail
    };
    
    Object.entries(infoFelder).forEach(([elementId, wert]) => {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = wert || 'Nicht angegeben';
        }
    });
    
    // Info-Bereich anzeigen
    const projektInfoBereich = document.getElementById('projektInfoBereich');
    if (projektInfoBereich) {
        projektInfoBereich.style.display = 'block';
    }
}

// 📄 Benötigte Dokumente generieren
function generiereBenoetigteDokumente(projektDaten) {
    console.log("📄 Generiere benötigte Dokumente");
    
    // Dokumente-Mapping basierend auf Gewerken
    const dokumenteMap = {
        "Heizung": [
            "Heizungsschema",
            "Projektbeschrieb Heizung",
            "Baubeschrieb Heizung",
            "Energierechnung Heizung"
        ],
        "Lüftung": [
            "Lüftungsschema",
            "Kellerplan",
            "UG-Plan",
            "Projektbeschrieb Lüftung"
        ],
        "Klima": [
            "Kälteschema",
            "Energierechnung Klima",
            "Projektbeschrieb Klima"
        ],
        "Wärmedämmung": [
            "Baubeschrieb Wärmedämmung",
            "U-Wert-Berechnung",
            "Fassadenplan",
            "Detailpläne Dämmung"
        ]
    };
    
    // Standard-Dokumente die immer benötigt werden
    const standardDokumente = [
        "Situationsplan",
        "Grundrisse",
        "Baubewilligung",
        "Technische Spezifikationen"
    ];
    
    const dokumentenListe = document.getElementById('dokumentenListe');
    const dokumenteBereich = document.getElementById('dokumenteBereich');
    
    if (!dokumentenListe || !dokumenteBereich) return;
    
    let html = '';
    
    // Standard-Dokumente hinzufügen
    html += `
        <div class="document-category">
            <h5><i class="fas fa-file-alt me-2"></i>Standard-Unterlagen</h5>
            <div class="document-items">
    `;
    
    standardDokumente.forEach(dok => {
        html += `
            <div class="document-item">
                <i class="fas fa-file-pdf text-danger me-2"></i>
                <span>${dok}</span>
                <span class="badge bg-secondary">Erforderlich</span>
            </div>
        `;
    });
    
    html += `</div></div>`;
    
    // Gewerk-spezifische Dokumente (falls vorhanden)
    // Hier könntest du die ausgewählten Gewerke aus projektDaten.gewerke lesen
    // Für jetzt zeigen wir Heizung als Beispiel
    Object.entries(dokumenteMap).forEach(([gewerk, dokumente]) => {
        html += `
            <div class="document-category">
                <h5><i class="fas fa-tools me-2"></i>${gewerk}</h5>
                <div class="document-items">
        `;
        
        dokumente.forEach(dok => {
            html += `
                <div class="document-item">
                    <i class="fas fa-file-pdf text-warning me-2"></i>
                    <span>${dok}</span>
                    <span class="badge bg-info">Gewerk-spezifisch</span>
                </div>
            `;
        });
        
        html += `</div></div>`;
    });
    
    dokumentenListe.innerHTML = html;
    dokumenteBereich.style.display = 'block';
}

// 🔄 Loading-Funktionen
function showLoading(message = "Wird geladen...") {
    const loading = document.getElementById('loading');
    if (loading) {
        const loadingText = loading.querySelector('p');
        if (loadingText) {
            loadingText.textContent = message;
        }
        loading.style.display = 'flex';
    }
}

function hideLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.style.display = 'none';
    }
}

function initUploadLogik() {
    console.log("📦 Upload-Logik initialisieren...");
    
    // 🔐 Erst Zugang prüfen
    if (!checkProjektZugang()) {
        return;
    }
    
    const statusBox = document.getElementById('status');
    const modal = document.getElementById('uploadSuccessModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const projektIdField = document.getElementById('projektId');
    const uploadBtn = document.getElementById('uploadBtn');

    // Prüfe ob alle Elemente vorhanden sind
    if (!statusBox || !uploadBtn || !projektIdField) {
        console.error("❌ Wichtige HTML-Elemente fehlen!");
        console.log("StatusBox:", !!statusBox, "UploadBtn:", !!uploadBtn, "ProjektIdField:", !!projektIdField);
        return;
    }

    // 📊 Projekt-Daten laden
    const projektId = getProjektId();
    if (projektId) {
        ladeProjektDaten(projektId);
    }

    const dz = new Dropzone("#nachweisDropzone", {
        url: "/upload",
        method: "post",
        paramName: "datei",
        maxFiles: 10,
        maxFilesize: 10, // MB
        acceptedFiles: ".pdf,.docx,.xlsx,.zip,.jpg,.jpeg,.png",
        autoProcessQueue: false,
        addRemoveLinks: true,
        dictDefaultMessage: "📤 Datei hierher ziehen oder klicken zum Hochladen",
        dictRemoveFile: "Datei entfernen",
        dictMaxFilesExceeded: "Zu viele Dateien",
        dictFileTooBig: "Datei zu groß (max. 10MB)",
        dictInvalidFileType: "Ungültiger Dateityp",
        init: function () {
            const dzInstance = this;
            console.log("✅ Dropzone bereit");

            // Upload Button Event
            uploadBtn.addEventListener("click", function(e) {
                e.preventDefault();
                console.log("🔄 Upload Button geklickt");
                
                const queued = dzInstance.getQueuedFiles();
                debugUploadZustand(dzInstance);

                if (queued.length === 0) {
                    showStatus("⚠️ Bitte mindestens eine Datei hinzufügen.", "warning");
                    return;
                }

                const projektId = getProjektId();
                
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
                debugUploadZustand(dzInstance);
            });

            // Datei entfernt
            dzInstance.on("removedfile", function(file) {
                console.log("🗑️ Datei entfernt:", file.name);
                updateUploadButton();
            });

            // Vor dem Senden
            dzInstance.on("sending", function(file, xhr, formData) {
                const projektId = getProjektId();
                
                console.log("📤 Sende Datei:", file.name, "für Projekt:", projektId);
                
                formData.append("projektId", projektId);
                showStatus(`⏳ Lade ${file.name} hoch...`, "info");
                
                // Upload Button während Upload deaktivieren
                uploadBtn.disabled = true;
                uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i><span>Wird hochgeladen...</span>';
            });

            // Upload erfolgreich
            dzInstance.on("success", function(file, response) {
                console.log("✅ Upload erfolgreich:", file.name, response);
                
                // Prüfe ob Response JSON ist
                let responseData = response;
                if (typeof response === 'string') {
                    try {
                        responseData = JSON.parse(response);
                    } catch (e) {
                        console.warn("Response ist kein JSON:", response);
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
                console.error("❌ XHR Status:", xhr?.status);
                console.error("❌ XHR Response:", xhr?.responseText);
                
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
                uploadBtn.innerHTML = '<i class="fas fa-upload me-2"></i><span>Upload starten</span>';
                
                // Modal anzeigen wenn erfolgreich
                const successfulUploads = dzInstance.getAcceptedFiles().length;
                if (successfulUploads > 0 && modal) {
                    modal.style.display = 'flex';
                }
            });

            // Upload-Fortschritt
            dzInstance.on("uploadprogress", function(file, progress, bytesSent) {
                if (progress % 20 === 0) { // Nur alle 20% loggen
                    console.log(`📊 Upload-Fortschritt für ${file.name}: ${Math.round(progress)}%`);
                }
            });
        }
    });

    // Hilfsfunktionen
    function showStatus(message, type) {
        if (!statusBox) return;
        
        // Bootstrap Alert Klassen
        const alertClass = type === 'warning' ? 'alert-warning' : 
                          type === 'info' ? 'alert-info' :
                          type === 'success' ? 'alert-success' : 'alert-danger';
        
        statusBox.className = `alert ${alertClass}`;
        statusBox.textContent = message;
        statusBox.classList.remove("d-none");
        
        console.log(`📢 Status (${type}):`, message);
        
        // Success/Info Messages nach 5 Sekunden ausblenden
        if (type === 'success' || type === 'info') {
            setTimeout(() => {
                statusBox.classList.add("d-none");
            }, 5000);
        }
    }

    function updateUploadButton() {
        if (!uploadBtn) return;
        
        const hasFiles = dz.getQueuedFiles().length > 0;
        const projektId = getProjektId();
        
        // Button nur aktivieren wenn Dateien UND gültige Projekt-ID vorhanden
        uploadBtn.disabled = !hasFiles || !projektId;
        
        // Button Text aktualisieren
        if (hasFiles && projektId) {
            const fileCount = dz.getQueuedFiles().length;
            uploadBtn.innerHTML = `<i class="fas fa-upload me-2"></i><span>${fileCount} Datei(en) hochladen</span>`;
        } else if (!projektId) {
            uploadBtn.innerHTML = `<i class="fas fa-exclamation-triangle me-2"></i><span>Keine gültige Projekt-ID</span>`;
        } else {
            uploadBtn.innerHTML = `<i class="fas fa-upload me-2"></i><span>Upload starten</span>`;
        }
        
        console.log("🔄 Upload-Button Update:", {
            disabled: uploadBtn.disabled,
            hasFiles: hasFiles,
            hasProjektId: !!projektId,
            fileCount: dz.getQueuedFiles().length
        });
    }

    // Modal schließen
    if (closeModalBtn && modal) {
        closeModalBtn.addEventListener('click', function() {
            modal.style.display = 'none';
        });
    }

    // Modal bei Klick außerhalb schließen
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }

    // Initial Setup
    updateUploadButton();
    
    console.log("🎯 Upload-Logik vollständig initialisiert");
}

// Export für andere Module (falls benötigt)
window.initUploadLogik = initUploadLogik;
window.ladeProjektDaten = ladeProjektDaten;
window.checkProjektZugang = checkProjektZugang;