// Admin Dashboard JavaScript
document.addEventListener('DOMContentLoaded', function() {
    console.log('👨‍💼 Admin Dashboard geladen');

    // Check authentication
    const token = sessionStorage.getItem('anbieterToken');
    if (!token) {
        window.location.href = '/anbieter-login.html';
        return;
    }

    // Global variables
    let currentSection = 'overview';
    let providersData = [];
    let chartInstance = null;

    // Initialize
    init();

    async function init() {
        setupNavigation();
        await checkAdminAuth();
        await loadOverview();
        setupEventListeners();
    }

    // Check if user is admin
    async function checkAdminAuth() {
        try {
            const response = await fetch('/api/admin/filter-options', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                alert('Keine Admin-Berechtigung!');
                window.location.href = '/anbieter-dashboard.html';
                return;
            }
        } catch (error) {
            console.error('Auth-Check Fehler:', error);
            window.location.href = '/anbieter-login.html';
        }
    }

    // Navigation setup
    function setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.getAttribute('data-section');
                switchSection(section);
            });
        });
    }

    function switchSection(section) {
        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[data-section="${section}"]`).classList.add('active');

        // Hide all sections
        document.querySelectorAll('.admin-section').forEach(sec => {
            sec.classList.remove('active');
        });

        // Show selected section
        document.getElementById(`${section}-section`).classList.add('active');
        currentSection = section;

        // Load section data
        switch(section) {
            case 'overview':
                loadOverview();
                break;
            case 'befugte-personen':
                loadProviders();
                break;
            case 'auftraege':
                loadOrders();
                break;
            case 'projekte':
                loadProjects();
                break;
            case 'einstellungen':
                loadSettings();
                break;
        }
    }

    // Load overview statistics
    async function loadOverview() {
        try {
            const response = await fetch('/api/admin/statistiken', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Statistiken konnten nicht geladen werden');

            const data = await response.json();
            
            if (data.success) {
                updateStatistics(data.statistiken);
                updateChart(data.statistiken);
                updateActionsList(data.statistiken);
            }

        } catch (error) {
            console.error('Statistiken-Fehler:', error);
        }
    }

    function updateStatistics(stats) {
        document.getElementById('totalProviders').textContent = stats.gesamt.total_anbieter;
        document.getElementById('activeProviders').textContent = stats.gesamt.aktive_anbieter;
        document.getElementById('pendingProviders').textContent = stats.gesamt.pending_anbieter;
        document.getElementById('totalOrders').textContent = stats.projekte.total_projekte;
    }

    function updateChart(stats) {
        const ctx = document.getElementById('registrationChart').getContext('2d');
        
        if (chartInstance) {
            chartInstance.destroy();
        }

        // Dummy data für die letzten 30 Tage
        const labels = [];
        const data = [];
        for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            labels.push(date.toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit' }));
            data.push(Math.floor(Math.random() * 5) + 1);
        }

        chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Neue Registrierungen',
                    data: data,
                    borderColor: '#1a5490',
                    backgroundColor: 'rgba(26, 84, 144, 0.1)',
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    function updateActionsList(stats) {
        const actionsList = document.getElementById('actionsList');
        let html = '';

        if (stats.gesamt.pending_anbieter > 0) {
            html += `
                <div class="action-item">
                    <i class="fas fa-user-clock text-warning"></i>
                    <span>${stats.gesamt.pending_anbieter} Anbieter warten auf Freischaltung</span>
                    <button class="btn btn-sm btn-primary" onclick="switchToProviders('pending')">
                        Anzeigen
                    </button>
                </div>
            `;
        }

        if (stats.gesamt.heute_registriert > 0) {
            html += `
                <div class="action-item">
                    <i class="fas fa-user-plus text-success"></i>
                    <span>${stats.gesamt.heute_registriert} neue Registrierungen heute</span>
                </div>
            `;
        }

        if (html === '') {
            html = '<p class="text-muted text-center">Keine Aktionen erforderlich</p>';
        }

        actionsList.innerHTML = html;
    }

    // Load providers
    async function loadProviders(status = '') {
        try {
            const url = new URL('/api/admin/anbieter', window.location.origin);
            if (status) url.searchParams.append('status', status);

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Anbieter konnten nicht geladen werden');

            const data = await response.json();
            
            if (data.success) {
                providersData = data.data;
                displayProviders(data.data);
            }

        } catch (error) {
            console.error('Anbieter-Fehler:', error);
        }
    }

    function displayProviders(providers) {
        const tbody = document.getElementById('providersTableBody');
        
        if (!providers || providers.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center text-muted py-4">
                        Keine Anbieter gefunden
                    </td>
                </tr>
            `;
            return;
        }

        let html = '';
        providers.forEach(provider => {
            const name = provider.firma || `${provider.vorname} ${provider.nachname}`;
            const statusBadge = getStatusBadge(provider.status);
            const registriertAm = new Date(provider.registriert_am).toLocaleDateString('de-CH');
            
            html += `
                <tr>
                    <td>${provider.id}</td>
                    <td>
                        <strong>${name}</strong>
                        ${provider.typ === 'unternehmen' ? '<br><small class="text-muted">Unternehmen</small>' : ''}
                    </td>
                    <td>${provider.typ === 'unternehmen' ? 'Firma' : 'Privat'}</td>
                    <td>
                        <a href="mailto:${provider.email}">${provider.email}</a>
                        ${provider.email_verifiziert ? 
                            '<i class="fas fa-check-circle text-success ms-1" title="Verifiziert"></i>' : 
                            '<i class="fas fa-exclamation-circle text-warning ms-1" title="Nicht verifiziert"></i>'
                        }
                    </td>
                    <td>${provider.plz} ${provider.ort}<br><small>${provider.kanton}</small></td>
                    <td>
                        <small>${provider.befugnisse || 'Keine'}</small>
                    </td>
                    <td>${statusBadge}</td>
                    <td>${registriertAm}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary" onclick="showProviderDetails(${provider.id})">
                            <i class="fas fa-eye"></i>
                        </button>
                    </td>
                </tr>
            `;
        });

        tbody.innerHTML = html;
    }

    function getStatusBadge(status) {
        const badges = {
            'pending': '<span class="badge bg-warning">Wartend</span>',
            'active': '<span class="badge bg-success">Aktiv</span>',
            'suspended': '<span class="badge bg-danger">Gesperrt</span>',
            'deleted': '<span class="badge bg-secondary">Gelöscht</span>'
        };
        return badges[status] || status;
    }

    // Show provider details
    window.showProviderDetails = async function(providerId) {
        try {
            const response = await fetch(`/api/admin/anbieter/${providerId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Details konnten nicht geladen werden');

            const data = await response.json();
            
            if (data.success) {
                displayProviderModal(data);
            }

        } catch (error) {
            console.error('Details-Fehler:', error);
            alert('Details konnten nicht geladen werden');
        }
    }

    function displayProviderModal(data) {
        const provider = data.anbieter;
        const modal = new bootstrap.Modal(document.getElementById('providerModal'));
        
        // Store current provider ID for actions
        window.currentProviderId = provider.id;

        // Build modal content
        let modalBody = `
            <div class="row">
                <div class="col-md-6">
                    <h6>Kontaktdaten</h6>
                    <p>
                        <strong>${provider.firma || `${provider.vorname} ${provider.nachname}`}</strong><br>
                        ${provider.strasse} ${provider.hausnummer}<br>
                        ${provider.plz} ${provider.ort}, ${provider.kanton}<br>
                        <a href="mailto:${provider.email}">${provider.email}</a><br>
                        ${provider.telefon || ''} ${provider.mobiltelefon || ''}
                    </p>
                </div>
                <div class="col-md-6">
                    <h6>Account-Informationen</h6>
                    <p>
                        <strong>Status:</strong> ${getStatusBadge(provider.status)}<br>
                        <strong>Typ:</strong> ${provider.typ}<br>
                        <strong>Registriert:</strong> ${new Date(provider.registriert_am).toLocaleString('de-CH')}<br>
                        <strong>Letzte Anmeldung:</strong> ${provider.letzte_anmeldung ? new Date(provider.letzte_anmeldung).toLocaleString('de-CH') : 'Nie'}<br>
                        <strong>Abo:</strong> ${provider.abo_typ || 'Keins'}
                    </p>
                </div>
            </div>

            <hr>

            <h6>Befugnisse</h6>
            <div class="mb-3">
                ${data.befugnisse.length > 0 ? 
                    data.befugnisse.map(b => `
                        <span class="badge bg-secondary me-2 mb-2">
                            ${b.name}
                            ${b.verifiziert ? '<i class="fas fa-check ms-1"></i>' : ''}
                        </span>
                    `).join('') :
                    '<p class="text-muted">Keine Befugnisse eingetragen</p>'
                }
            </div>

            <h6>Bewertungen</h6>
            <p>
                ${provider.bewertung_durchschnitt > 0 ?
                    `${provider.bewertung_durchschnitt.toFixed(1)} ⭐ (${provider.bewertung_anzahl} Bewertungen)` :
                    'Noch keine Bewertungen'
                }
            </p>

            <h6>Projekte</h6>
            <p>${data.projekte.length} Projekte insgesamt</p>
        `;

        // Additional details for companies
        if (provider.typ === 'unternehmen' && (provider.uid_nummer || provider.mwst_nummer)) {
            modalBody += `
                <hr>
                <h6>Firmeninformationen</h6>
                <p>
                    ${provider.uid_nummer ? `<strong>UID:</strong> ${provider.uid_nummer}<br>` : ''}
                    ${provider.mwst_nummer ? `<strong>MwSt:</strong> ${provider.mwst_nummer}<br>` : ''}
                </p>
            `;
        }

        document.getElementById('providerModalBody').innerHTML = modalBody;

        // Show/hide action buttons based on status
        const activateBtn = document.getElementById('activateBtn');
        const suspendBtn = document.getElementById('suspendBtn');
        const deleteBtn = document.getElementById('deleteBtn');

        activateBtn.style.display = provider.status === 'pending' || provider.status === 'suspended' ? 'inline-block' : 'none';
        suspendBtn.style.display = provider.status === 'active' ? 'inline-block' : 'none';
        deleteBtn.style.display = provider.status !== 'deleted' ? 'inline-block' : 'none';

        modal.show();
    }

    // Setup event listeners
    function setupEventListeners() {
        // Refresh button
        document.getElementById('refreshBtn')?.addEventListener('click', () => {
            loadProviders();
        });

        // Status filter
        document.getElementById('statusFilter')?.addEventListener('change', (e) => {
            loadProviders(e.target.value);
        });

        // Modal action buttons
        document.getElementById('activateBtn')?.addEventListener('click', () => {
            changeProviderStatus('active');
        });

        document.getElementById('suspendBtn')?.addEventListener('click', () => {
            changeProviderStatus('suspended');
        });

        document.getElementById('deleteBtn')?.addEventListener('click', () => {
            if (confirm('Möchten Sie diesen Anbieter wirklich löschen?')) {
                changeProviderStatus('deleted');
            }
        });
    }

    // Change provider status
    async function changeProviderStatus(newStatus) {
        const providerId = window.currentProviderId;
        if (!providerId) return;

        try {
            const response = await fetch(`/api/admin/anbieter/${providerId}/status`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (!response.ok) throw new Error('Status konnte nicht geändert werden');

            const result = await response.json();
            
            if (result.success) {
                // Close modal
                bootstrap.Modal.getInstance(document.getElementById('providerModal')).hide();
                
                // Reload providers
                loadProviders();
                
                // Show success message
                showAlert('Status erfolgreich geändert', 'success');
            }

        } catch (error) {
            console.error('Status-Änderung Fehler:', error);
            showAlert('Fehler beim Ändern des Status', 'danger');
        }
    }

    // Placeholder functions for other sections
    async function loadOrders() {
        console.log('Loading orders...');
    }

    async function loadProjects() {
        console.log('Loading projects...');
    }

    async function loadSettings() {
        console.log('Loading settings...');
    }

    // Helper functions
    function showAlert(message, type = 'info') {
        const alertHtml = `
            <div class="alert alert-${type} alert-dismissible fade show position-fixed top-0 end-0 m-3" style="z-index: 1050">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', alertHtml);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            document.querySelector('.alert')?.remove();
        }, 5000);
    }

    // Export function to switch to providers with filter
    window.switchToProviders = function(status) {
        switchSection('befugte-personen');
        document.getElementById('statusFilter').value = status;
        loadProviders(status);
    }
});