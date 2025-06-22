// Anbieter Registrierung JavaScript
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Anbieter-Registrierung geladen');

    // Form Elements
    const form = document.getElementById('registrierungsForm');
    const typRadios = document.querySelectorAll('input[name="typ"]');
    const firmaFields = document.getElementById('firmaFields');
    const privatFields = document.getElementById('privatFields');
    const plzInput = document.getElementById('plz');
    const ortInput = document.getElementById('ort');
    const kantonSelect = document.getElementById('kanton');
    
    // Progress Steps
    const steps = document.querySelectorAll('.step');
    const progressSteps = document.querySelectorAll('.progress-step');
    let currentStep = 1;

    // Befugnisse Checkboxen
    const befugnisseContainer = document.getElementById('befugnisseContainer');
    
    // Initialize
    init();

    function init() {
        setupEventListeners();
        renderBefugnisse();
        updateFormFields();
        showStep(1);
    }

    function setupEventListeners() {
        // Typ Radio Buttons
        typRadios.forEach(radio => {
            radio.addEventListener('change', updateFormFields);
        });

        // PLZ Autocomplete
        if (plzInput) {
            plzInput.addEventListener('input', debounce(handlePLZInput, 500));
        }

        // Navigation Buttons
        document.querySelectorAll('.btn-next').forEach(btn => {
            btn.addEventListener('click', handleNext);
        });

        document.querySelectorAll('.btn-prev').forEach(btn => {
            btn.addEventListener('click', handlePrev);
        });

        // Form Submit
        if (form) {
            form.addEventListener('submit', handleSubmit);
        }

        // Password Validation
        const passwordInput = document.getElementById('passwort');
        const passwordConfirmInput = document.getElementById('passwortBestaetigung');
        
        if (passwordInput && passwordConfirmInput) {
            passwordConfirmInput.addEventListener('input', validatePasswords);
        }
    }

    function updateFormFields() {
        const selectedType = document.querySelector('input[name="typ"]:checked')?.value;
        
        if (selectedType === 'unternehmen') {
            firmaFields.style.display = 'block';
            privatFields.style.display = 'none';
            
            // Pflichtfelder anpassen
            document.getElementById('firma').required = true;
            document.getElementById('vorname').required = false;
            document.getElementById('nachname').required = false;
        } else {
            firmaFields.style.display = 'none';
            privatFields.style.display = 'block';
            
            // Pflichtfelder anpassen
            document.getElementById('firma').required = false;
            document.getElementById('vorname').required = true;
            document.getElementById('nachname').required = true;
        }
    }

    function renderBefugnisse() {
        const befugnisse = [
            { code: 'EN-101', name: 'Energienachweis Wohngebäude', kategorie: 'allgemein' },
            { code: 'EN-102', name: 'Energienachweis Zweckbauten', kategorie: 'allgemein' },
            { code: 'EN-103', name: 'Heizungsanlagen', kategorie: 'heizung' },
            { code: 'EN-104', name: 'Lüftungs- und Klimaanlagen', kategorie: 'lueftung' },
            { code: 'EN-105', name: 'Kälteanlagen', kategorie: 'kaelte' },
            { code: 'EN-106', name: 'Sanitäranlagen', kategorie: 'sanitaer' },
            { code: 'EN-107', name: 'Elektroanlagen', kategorie: 'elektro' },
            { code: 'EN-108', name: 'Gebäudehülle', kategorie: 'gebaeude' },
            { code: 'EN-109', name: 'Beleuchtung', kategorie: 'elektro' }
        ];

        // Gruppiere nach Kategorie
        const grouped = befugnisse.reduce((acc, b) => {
            if (!acc[b.kategorie]) acc[b.kategorie] = [];
            acc[b.kategorie].push(b);
            return acc;
        }, {});

        let html = '';
        
        for (const [kategorie, items] of Object.entries(grouped)) {
            html += `
                <div class="befugnis-gruppe mb-4">
                    <h5 class="text-capitalize mb-3">${kategorie.replace('_', ' ')}</h5>
                    <div class="row">
            `;
            
            items.forEach(befugnis => {
                html += `
                    <div class="col-md-6 mb-2">
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" 
                                   name="befugnisse" 
                                   value="${befugnis.code}" 
                                   id="befugnis_${befugnis.code}">
                            <label class="form-check-label" for="befugnis_${befugnis.code}">
                                <strong>${befugnis.code}</strong> - ${befugnis.name}
                            </label>
                        </div>
                    </div>
                `;
            });
            
            html += `
                    </div>
                </div>
            `;
        }

        if (befugnisseContainer) {
            befugnisseContainer.innerHTML = html;
        }
    }

    async function handlePLZInput(event) {
        const plz = event.target.value;
        
        if (plz.length >= 4) {
            try {
                // Schweizer PLZ API oder lokale Datenbank
                const response = await fetch(`/api/plz/${plz}`);
                if (response.ok) {
                    const data = await response.json();
                    if (ortInput) ortInput.value = data.ort;
                    if (kantonSelect) kantonSelect.value = data.kanton;
                }
            } catch (error) {
                console.error('PLZ-Lookup Fehler:', error);
            }
        }
    }

    function showStep(stepNumber) {
        steps.forEach((step, index) => {
            step.style.display = index + 1 === stepNumber ? 'block' : 'none';
        });

        progressSteps.forEach((step, index) => {
            if (index + 1 < stepNumber) {
                step.classList.add('completed');
                step.classList.remove('active');
            } else if (index + 1 === stepNumber) {
                step.classList.add('active');
                step.classList.remove('completed');
            } else {
                step.classList.remove('active', 'completed');
            }
        });

        currentStep = stepNumber;
        
        // Scroll to top
        window.scrollTo(0, 0);
    }

    function handleNext() {
        if (validateStep(currentStep)) {
            showStep(currentStep + 1);
        }
    }

    function handlePrev() {
        showStep(currentStep - 1);
    }

    function validateStep(stepNumber) {
        const currentStepElement = document.querySelector(`.step-${stepNumber}`);
        const requiredFields = currentStepElement.querySelectorAll('[required]');
        let isValid = true;

        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                field.classList.add('is-invalid');
                isValid = false;
            } else {
                field.classList.remove('is-invalid');
            }
        });

        // Spezielle Validierungen
        if (stepNumber === 1) {
            // Email Validierung
            const emailField = document.getElementById('email');
            if (emailField && !validateEmail(emailField.value)) {
                emailField.classList.add('is-invalid');
                isValid = false;
            }
        }

        if (stepNumber === 2) {
            // Mindestens eine Befugnis
            const checkedBefugnisse = document.querySelectorAll('input[name="befugnisse"]:checked');
            if (checkedBefugnisse.length === 0) {
                showAlert('Bitte wählen Sie mindestens eine Befugnis aus.', 'warning');
                isValid = false;
            }
        }

        if (!isValid) {
            showAlert('Bitte füllen Sie alle Pflichtfelder aus.', 'warning');
        }

        return isValid;
    }

    function validatePasswords() {
        const password = document.getElementById('passwort').value;
        const confirmation = document.getElementById('passwortBestaetigung').value;
        const confirmField = document.getElementById('passwortBestaetigung');
        
        if (confirmation && password !== confirmation) {
            confirmField.classList.add('is-invalid');
            confirmField.nextElementSibling.textContent = 'Passwörter stimmen nicht überein';
        } else {
            confirmField.classList.remove('is-invalid');
        }
    }

    async function handleSubmit(event) {
        event.preventDefault();

        if (!validateStep(currentStep)) {
            return;
        }

        // Passwort Bestätigung prüfen
        const password = document.getElementById('passwort').value;
        const confirmation = document.getElementById('passwortBestaetigung').value;
        
        if (password !== confirmation) {
            showAlert('Die Passwörter stimmen nicht überein.', 'danger');
            return;
        }

        // AGB Prüfung
        const agbAccepted = document.getElementById('agbAkzeptiert').checked;
        if (!agbAccepted) {
            showAlert('Bitte akzeptieren Sie die AGB und Datenschutzerklärung.', 'warning');
            return;
        }

        // Formulardaten sammeln
        const formData = new FormData(form);
        const data = {
            typ: formData.get('typ'),
            anrede: formData.get('anrede'),
            vorname: formData.get('vorname'),
            nachname: formData.get('nachname'),
            firma: formData.get('firma'),
            email: formData.get('email'),
            telefon: formData.get('telefon'),
            mobiltelefon: formData.get('mobiltelefon'),
            strasse: formData.get('strasse'),
            hausnummer: formData.get('hausnummer'),
            plz: formData.get('plz'),
            ort: formData.get('ort'),
            kanton: formData.get('kanton'),
            uid_nummer: formData.get('uid_nummer'),
            mwst_nummer: formData.get('mwst_nummer'),
            firmenbeschreibung: formData.get('firmenbeschreibung'),
            webseite: formData.get('webseite'),
            passwort: formData.get('passwort'),
            befugnisse: formData.getAll('befugnisse'),
            agb_akzeptiert: agbAccepted
        };

        // Loading State
        const submitBtn = event.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Wird registriert...';

        try {
            const response = await fetch('/api/anbieter/registrierung', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.success) {
                // Erfolg
                showSuccess();
            } else {
                showAlert(result.message || 'Registrierung fehlgeschlagen', 'danger');
            }

        } catch (error) {
            console.error('Registrierungsfehler:', error);
            showAlert('Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.', 'danger');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    }

    function showSuccess() {
        // Verstecke Form
        form.style.display = 'none';
        
        // Zeige Erfolg
        const successMessage = `
            <div class="text-center py-5">
                <i class="fas fa-check-circle text-success" style="font-size: 72px;"></i>
                <h2 class="mt-4 mb-3">Registrierung erfolgreich!</h2>
                <p class="lead">Vielen Dank für Ihre Registrierung.</p>
                <p>Wir haben Ihnen eine Bestätigungs-E-Mail gesendet. Bitte prüfen Sie Ihren Posteingang.</p>
                <p class="text-muted">Nach der Prüfung Ihrer Angaben werden wir Ihren Account aktivieren.</p>
                <div class="mt-4">
                    <a href="/anbieter-login.html" class="btn btn-primary">
                        <i class="fas fa-sign-in-alt me-2"></i>Zum Login
                    </a>
                    <a href="/" class="btn btn-outline-secondary ms-2">
                        <i class="fas fa-home me-2"></i>Zur Startseite
                    </a>
                </div>
            </div>
        `;
        
        document.querySelector('.card-body').innerHTML = successMessage;
    }

    function showAlert(message, type = 'danger') {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        // Insert at beginning of current step
        const currentStepElement = document.querySelector(`.step-${currentStep}`);
        currentStepElement.insertBefore(alertDiv, currentStepElement.firstChild);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            alertDiv.remove();
        }, 5000);
    }

    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
});