// Marketplace JavaScript - Anbieter-Auswahl für Kunden
document.addEventListener('DOMContentLoaded', function() {
    console.log('🛍️ Marketplace geladen');

    // Get project ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const projektId = urlParams.get('projekt');

    if (!projektId) {
        showError('Keine Projekt-ID gefunden. Bitte verwenden Sie den Link aus Ihrer E-Mail.');
        return;
    }

    // Global variables
    let projektDaten = null;
    let anbieterListe = [];
    let selectedAnbieter = null;
    let filterSettings = {
        minBewertung: 0,
        maxEntfernung: 100,
        sortierung: 'empfohlen'
    };

    // Initialize
    init();

    async function init() {
        await loadMarketplaceData();
        setupEventListeners();
        setupFilters();
    }

    async function loadMarketplaceData() {
        try {
            showLoader();

            const response = await fetch(`/api/marketplace/anbieter/${projektId}`);
            
            if (!response.ok) {
                if (response.status === 404) {
                    showError('Projekt nicht gefunden. Bitte überprüfen Sie Ihren Link.');
                    return;
                }
                throw new Error('Daten konnten nicht geladen werden');
            }

            const data = await response.json();
            
            if (data.success) {
                projektDaten = data.projekt;
                anbieterListe = data.anbieter;
                
                displayProjektInfo();
                displayAnbieter();
            }

        } catch (error) {
            console.error('Marketplace-Fehler:', error);
            showError('Die Anbieter konnten nicht geladen werden. Bitte versuchen Sie es später erneut.');
        } finally {
            hideLoader();
        }
    }

    function displayProjektInfo() {
        const projektInfoElement = document.getElementById('projektInfo');
        if (!projektInfoElement) return;

        projektInfoElement.innerHTML = `
            <div class="alert alert-info">
                <h5 class="alert-heading mb-2">
                    <i class="fas fa-building me-2"></i>${projektDaten.name}
                </h5>
                <p class="mb-1">
                    <i class="fas fa-map-marker-alt me-2"></i>
                    <strong>Standort:</strong> ${projektDaten.plz} ${projektDaten.ort}
                </p>
                <p class="mb-0">
                    <i class="fas fa-tools me-2"></i>
                    <strong>Benötigte Befugnisse:</strong> 
                    ${projektDaten.benoetigteBefugnisse.join(', ')}
                </p>
            </div>
        `;
    }

    function displayAnbieter() {
        const container = document.getElementById('anbieterContainer');
        if (!container) return;

        if (anbieterListe.length === 0) {
            container.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-warning text-center">
                        <i class="fas fa-exclamation-triangle fa-3x mb-3"></i>
                        <h4>Keine passenden Anbieter gefunden</h4>
                        <p>Für Ihr Projekt sind aktuell keine qualifizierten Anbieter in Ihrer Region verfügbar.</p>
                        <p>Bitte kontaktieren Sie uns direkt für weitere Unterstützung.</p>
                        <a href="/contact.html" class="btn btn-primary mt-3">
                            <i class="fas fa-phone me-2"></i>Kontakt aufnehmen
                        </a>
                    </div>
                </div>
            `;
            return;
        }

        // Apply filters and sorting
        let filteredAnbieter = filterAnbieter(anbieterListe);
        filteredAnbieter = sortAnbieter(filteredAnbieter);

        // Update result count
        updateResultCount(filteredAnbieter.length, anbieterListe.length);

        // Display anbieter cards
        let html = '';
        filteredAnbieter.forEach(anbieter => {
            html += createAnbieterCard(anbieter);
        });

        container.innerHTML = html;

        // Add event listeners to cards
        setupCardEventListeners();
    }

    function createAnbieterCard(anbieter) {
        const isSelected = anbieter.hatAnfrage && anbieter.anfrageStatus === 'kunde_ausgewaehlt';
        const bewertungHtml = createBewertungSterne(anbieter.bewertung_durchschnitt);
        const entfernungText = anbieter.entfernung_km ? 
            `${Math.round(anbieter.entfernung_km)} km entfernt` : 
            'Entfernung unbekannt';

        return `
            <div class="col-md-6 col-lg-4 mb-4">
                <div class="card anbieter-card h-100 ${isSelected ? 'selected' : ''}" 
                     data-anbieter-id="${anbieter.id}">
                    ${isSelected ? '<div class="selected-badge">Bereits ausgewählt</div>' : ''}
                    
                    <div class="card-body">
                        <div class="d-flex align-items-start mb-3">
                            ${anbieter.profilbild_url ? 
                                `<img src="${anbieter.profilbild_url}" class="anbieter-avatar me-3" alt="Profilbild">` :
                                `<div class="anbieter-avatar-placeholder me-3">
                                    <i class="fas fa-user"></i>
                                </div>`
                            }
                            <div class="flex-grow-1">
                                <h5 class="card-title mb-1">
                                    ${anbieter.firma || `${anbieter.vorname} ${anbieter.nachname}`}
                                </h5>
                                <div class="text-muted small">
                                    <i class="fas fa-map-marker-alt me-1"></i>
                                    ${anbieter.ort}, ${anbieter.kanton}
                                </div>
                            </div>
                        </div>

                        <div class="mb-3">
                            <div class="d-flex align-items-center mb-2">
                                <div class="bewertung me-2">
                                    ${bewertungHtml}
                                </div>
                                <small class="text-muted">
                                    ${anbieter.bewertung_durchschnitt.toFixed(1)} 
                                    (${anbieter.bewertung_anzahl} Bewertungen)
                                </small>
                            </div>
                            
                            <div class="small text-muted mb-2">
                                <i class="fas fa-route me-1"></i>
                                ${entfernungText}
                            </div>

                            ${anbieter.erfahrungsjahre ? 
                                `<div class="small text-muted">
                                    <i class="fas fa-briefcase me-1"></i>
                                    ${anbieter.erfahrungsjahre} Jahre Erfahrung
                                </div>` : ''
                            }
                        </div>

                        ${anbieter.kurzbeschreibung ? 
                            `<p class="card-text small mb-3">${anbieter.kurzbeschreibung}</p>` : ''
                        }

                        <div class="befugnisse-tags mb-3">
                            ${anbieter.befugnisse_namen.split(',').map(b => 
                                `<span class="badge bg-secondary me-1 mb-1">${b.trim()}</span>`
                            ).join('')}
                        </div>

                        <div class="d-grid gap-2">
                            <button class="btn btn-primary btn-details" 
                                    data-anbieter-id="${anbieter.id}">
                                <i class="fas fa-info-circle me-2"></i>Details anzeigen
                            </button>
                            ${!isSelected ? 
                                `<button class="btn btn-success btn-select" 
                                         data-anbieter-id="${anbieter.id}">
                                    <i class="fas fa-check me-2"></i>Anbieter auswählen
                                </button>` : 
                                `<button class="btn btn-secondary" disabled>
                                    <i class="fas fa-check me-2"></i>Bereits ausgewählt
                                </button>`
                            }
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    function createBewertungSterne(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        let html = '';

        for (let i = 1; i <= 5; i++) {
            if (i <= fullStars) {
                html += '<i class="fas fa-star text-warning"></i>';
            } else if (i === fullStars + 1 && hasHalfStar) {
                html += '<i class="fas fa-star-half-alt text-warning"></i>';
            } else {
                html += '<i class="far fa-star text-warning"></i>';
            }
        }

        return html;
    }

    function filterAnbieter(anbieter) {
        return anbieter.filter(a => {
            // Bewertungsfilter
            if (a.bewertung_durchschnitt < filterSettings.minBewertung) {
                return false;
            }

            // Entfernungsfilter
            if (a.entfernung_km && a.entfernung_km > filterSettings.maxEntfernung) {
                return false;
            }

            return true;
        });
    }

    function sortAnbieter(anbieter) {
        const sortFunctions = {
            'empfohlen': (a, b) => {
                // Kombinierte Sortierung: Bewertung und Entfernung
                const scoreA = a.bewertung_durchschnitt * 10 - (a.entfernung_km || 50) * 0.1;
                const scoreB = b.bewertung_durchschnitt * 10 - (b.entfernung_km || 50) * 0.1;
                return scoreB - scoreA;
            },
            'bewertung': (a, b) => b.bewertung_durchschnitt - a.bewertung_durchschnitt,
            'entfernung': (a, b) => (a.entfernung_km || 999) - (b.entfernung_km || 999),
            'erfahrung': (a, b) => (b.erfahrungsjahre || 0) - (a.erfahrungsjahre || 0)
        };

        const sortFunction = sortFunctions[filterSettings.sortierung] || sortFunctions.empfohlen;
        return [...anbieter].sort(sortFunction);
    }

    function updateResultCount(shown, total) {
        const countElement = document.getElementById('resultCount');
        if (countElement) {
            if (shown === total) {
                countElement.textContent = `${total} Anbieter gefunden`;
            } else {
                countElement.textContent = `${shown} von ${total} Anbietern angezeigt`;
            }
        }
    }

    function setupEventListeners() {
        // Sort dropdown
        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                filterSettings.sortierung = e.target.value;
                displayAnbieter();
            });
        }

        // Filter reset button
        const resetFiltersBtn = document.getElementById('resetFilters');
        if (resetFiltersBtn) {
            resetFiltersBtn.addEventListener('click', resetFilters);
        }
    }

    function setupFilters() {
        // Bewertung filter
        const bewertungSlider = document.getElementById('bewertungFilter');
        if (bewertungSlider) {
            bewertungSlider.addEventListener('input', (e) => {
                filterSettings.minBewertung = parseFloat(e.target.value);
                document.getElementById('bewertungValue').textContent = e.target.value;
                displayAnbieter();
            });
        }

        // Entfernung filter
        const entfernungSlider = document.getElementById('entfernungFilter');
        if (entfernungSlider) {
            entfernungSlider.addEventListener('input', (e) => {
                filterSettings.maxEntfernung = parseInt(e.target.value);
                document.getElementById('entfernungValue').textContent = e.target.value + ' km';
                displayAnbieter();
            });
        }
    }

    function setupCardEventListeners() {
        // Details buttons
        document.querySelectorAll('.btn-details').forEach(btn => {
            btn.addEventListener('click', async function() {
                const anbieterId = this.getAttribute('data-anbieter-id');
                await showAnbieterDetails(anbieterId);
            });
        });

        // Select buttons
        document.querySelectorAll('.btn-select').forEach(btn => {
            btn.addEventListener('click', function() {
                const anbieterId = this.getAttribute('data-anbieter-id');
                const anbieter = anbieterListe.find(a => a.id == anbieterId);
                showAuswahlModal(anbieter);
            });
        });
    }

    async function showAnbieterDetails(anbieterId) {
        try {
            showLoader();

            const response = await fetch(`/api/marketplace/anbieter-details/${anbieterId}`);
            
            if (!response.ok) {
                throw new Error('Anbieter-Details konnten nicht geladen werden');
            }

            const result = await response.json();
            
            if (result.success) {
                displayAnbieterModal(result.anbieter);
            }

        } catch (error) {
            console.error('Details-Fehler:', error);
            showError('Anbieter-Details konnten nicht geladen werden.');
        } finally {
            hideLoader();
        }
    }

    function displayAnbieterModal(anbieter) {
        const modal = new bootstrap.Modal(document.getElementById('anbieterDetailsModal'));
        
        // Fill modal with data
        document.getElementById('modalAnbieterName').textContent = 
            anbieter.firma || `${anbieter.vorname} ${anbieter.nachname}`;
        
        document.getElementById('modalAnbieterOrt').textContent = 
            `${anbieter.ort}, ${anbieter.kanton}`;
        
        // Bewertung
        document.getElementById('modalBewertungSterne').innerHTML = 
            createBewertungSterne(anbieter.bewertung_durchschnitt);
        document.getElementById('modalBewertungText').textContent = 
            `${anbieter.bewertung_durchschnitt.toFixed(1)} (${anbieter.bewertung_anzahl} Bewertungen)`;
        
        // Beschreibung
        document.getElementById('modalBeschreibung').textContent = 
            anbieter.firmenbeschreibung || anbieter.kurzbeschreibung || 'Keine Beschreibung verfügbar';
        
        // Befugnisse
        const befugnisseHtml = anbieter.befugnisse.map(b => `
            <li class="list-group-item d-flex justify-content-between align-items-center">
                <span>${b.name}</span>
                <span class="badge bg-primary rounded-pill">${b.kategorie}</span>
            </li>
        `).join('');
        document.getElementById('modalBefugnisse').innerHTML = befugnisseHtml;
        
        // Bewertungen
        if (anbieter.bewertungen && anbieter.bewertungen.length > 0) {
            const bewertungenHtml = anbieter.bewertungen.map(b => `
                <div class="border-bottom pb-3 mb-3">
                    <div class="d-flex justify-content-between mb-2">
                        <div>${createBewertungSterne(b.sterne)}</div>
                        <small class="text-muted">${formatDate(b.erstellt_am)}</small>
                    </div>
                    <p class="mb-0">${b.kommentar || 'Keine Kommentar'}</p>
                </div>
            `).join('');
            document.getElementById('modalBewertungen').innerHTML = bewertungenHtml;
        } else {
            document.getElementById('modalBewertungen').innerHTML = 
                '<p class="text-muted">Noch keine Bewertungen vorhanden</p>';
        }
        
        // Website link
        if (anbieter.webseite) {
            document.getElementById('modalWebseite').innerHTML = 
                `<a href="${anbieter.webseite}" target="_blank" class="btn btn-outline-primary">
                    <i class="fas fa-external-link-alt me-2"></i>Website besuchen
                </a>`;
        }

        modal.show();
    }

    function showAuswahlModal(anbieter) {
        selectedAnbieter = anbieter;
        
        const modal = new bootstrap.Modal(document.getElementById('auswahlModal'));
        
        // Fill modal with selected anbieter info
        document.getElementById('auswahlAnbieterName').textContent = 
            anbieter.firma || `${anbieter.vorname} ${anbieter.nachname}`;
        
        // Reset form
        document.getElementById('auswahlForm').reset();
        
        modal.show();
    }

    function setupAuswahlForm() {
        const form = document.getElementById('auswahlForm');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await handleAnbieterAuswahl(new FormData(form));
        });
    }

    async function handleAnbieterAuswahl(formData) {
        if (!selectedAnbieter) return;

        const submitBtn = document.querySelector('#auswahlForm button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Wird übermittelt...';

        try {
            const data = {
                projektId: projektId,
                anbieterId: selectedAnbieter.id,
                kundenEmail: formData.get('kundenEmail'),
                kundenTelefon: formData.get('kundenTelefon'),
                terminwunsch: formData.get('terminwunsch'),
                nachricht: formData.get('nachricht')
            };

            const response = await fetch('/api/marketplace/auswahl', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.success) {
                // Hide modal
                bootstrap.Modal.getInstance(document.getElementById('auswahlModal')).hide();
                
                // Show success
                showSuccessScreen();
            } else {
                showError(result.message || 'Die Auswahl konnte nicht gespeichert werden.');
            }

        } catch (error) {
            console.error('Auswahl-Fehler:', error);
            showError('Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    }

    function showSuccessScreen() {
        const mainContainer = document.querySelector('.container');
        mainContainer.innerHTML = `
            <div class="row justify-content-center">
                <div class="col-md-8 col-lg-6">
                    <div class="card shadow-lg border-0">
                        <div class="card-body text-center py-5">
                            <i class="fas fa-check-circle text-success mb-4" style="font-size: 72px;"></i>
                            <h2 class="mb-4">Anbieter erfolgreich ausgewählt!</h2>
                            <p class="lead mb-4">
                                Vielen Dank für Ihre Auswahl. Der Anbieter wurde benachrichtigt und wird sich in Kürze bei Ihnen melden.
                            </p>
                            
                            <div class="alert alert-info text-start">
                                <h5 class="alert-heading">
                                    <i class="fas fa-info-circle me-2"></i>Nächste Schritte:
                                </h5>
                                <ul class="mb-0">
                                    <li>Der Anbieter erhält Ihre Kontaktdaten und Nachricht</li>
                                    <li>Sie erhalten eine Bestätigungs-E-Mail</li>
                                    <li>Der Anbieter wird sich innerhalb von 24-48 Stunden bei Ihnen melden</li>
                                    <li>Besprechen Sie die Details direkt mit dem Anbieter</li>
                                </ul>
                            </div>

                            <div class="mt-4">
                                <a href="/" class="btn btn-primary">
                                    <i class="fas fa-home me-2"></i>Zur Startseite
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    function resetFilters() {
        filterSettings = {
            minBewertung: 0,
            maxEntfernung: 100,
            sortierung: 'empfohlen'
        };

        // Reset UI
        document.getElementById('bewertungFilter').value = 0;
        document.getElementById('bewertungValue').textContent = '0';
        document.getElementById('entfernungFilter').value = 100;
        document.getElementById('entfernungValue').textContent = '100 km';
        document.getElementById('sortSelect').value = 'empfohlen';

        displayAnbieter();
    }

    // Utility functions
    function showLoader() {
        const loader = document.getElementById('loader');
        if (loader) {
            loader.style.display = 'flex';
        }
    }

    function hideLoader() {
        const loader = document.getElementById('loader');
        if (loader) {
            loader.style.display = 'none';
        }
    }

    function showError(message) {
        const container = document.getElementById('anbieterContainer') || 
                         document.querySelector('.container');
        
        if (container) {
            container.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-danger text-center">
                        <i class="fas fa-exclamation-circle fa-3x mb-3"></i>
                        <h4>Fehler</h4>
                        <p>${message}</p>
                        <a href="/" class="btn btn-primary mt-3">
                            <i class="fas fa-home me-2"></i>Zur Startseite
                        </a>
                    </div>
                </div>
            `;
        }
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('de-CH', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    // Initialize form
    setupAuswahlForm();
});