document.addEventListener('DOMContentLoaded', function() {
    // Initialize registration form
    initializeRegistrationForm();
    setupPersonTypeToggle();
    setupFormValidation();
    setupSubmitHandler();
});

function initializeRegistrationForm() {
    // Set default selections
    document.getElementById('privatperson').checked = true;
    togglePersonFields('privatperson');
    
    console.log('Registrierungsformular initialisiert');
}

function setupPersonTypeToggle() {
    const personTypeRadios = document.querySelectorAll('input[name="person_typ"]');
    const contactTitle = document.getElementById('contact-title');
    
    personTypeRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.checked) {
                togglePersonFields(this.value);
                updateContactTitle(this.value, contactTitle);
            }
        });
    });
}

function togglePersonFields(selectedType) {
    const privatpersonFields = document.getElementById('privatperson-fields');
    const unternehmenFields = document.getElementById('unternehmen-fields');
    
    if (selectedType === 'privatperson') {
        privatpersonFields.style.display = 'block';
        unternehmenFields.style.display = 'none';
        
        // Set required attributes
        setFieldsRequired('#privatperson-fields input', true);
        setFieldsRequired('#unternehmen-fields input', false);
        
    } else if (selectedType === 'unternehmen') {
        privatpersonFields.style.display = 'none';
        unternehmenFields.style.display = 'block';
        
        // Set required attributes
        setFieldsRequired('#privatperson-fields input', false);
        setFieldsRequired('#unternehmen-fields input', true);
    }
}

function updateContactTitle(type, titleElement) {
    if (type === 'privatperson') {
        titleElement.textContent = 'Persönliche Daten';
    } else {
        titleElement.textContent = 'Unternehmensdaten';
    }
}

function setFieldsRequired(selector, required) {
    const fields = document.querySelectorAll(selector);
    fields.forEach(field => {
        if (required) {
            field.setAttribute('required', '');
        } else {
            field.removeAttribute('required');
            // Clear validation classes
            field.classList.remove('is-valid', 'is-invalid');
            // Clear values when switching
            field.value = '';
        }
    });
}

function setupFormValidation() {
    const form = document.getElementById('befugteRegistrierungForm');
    const inputs = form.querySelectorAll('input[required]');
    
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            validateField(this);
        });
        
        input.addEventListener('input', function() {
            if (this.classList.contains('is-invalid')) {
                validateField(this);
            }
        });
    });
    
    // Special validation for password confirmation
    const passwordConfirm = document.getElementById('passwort_confirm');
    passwordConfirm.addEventListener('input', function() {
        validatePasswordMatch();
    });
    
    document.getElementById('passwort').addEventListener('input', function() {
        if (passwordConfirm.value) {
            validatePasswordMatch();
        }
    });
}

function validateField(field) {
    const value = field.value.trim();
    let isValid = true;
    let errorMessage = '';
    
    // Basic required validation
    if (field.hasAttribute('required') && !value) {
        isValid = false;
        errorMessage = 'Dieses Feld ist erforderlich';
    }
    
    // Email validation
    else if (field.type === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            isValid = false;
            errorMessage = 'Bitte geben Sie eine gültige E-Mail-Adresse ein';
        }
    }
    
    // Phone validation
    else if (field.type === 'tel' && value) {
        const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
        if (!phoneRegex.test(value)) {
            isValid = false;
            errorMessage = 'Bitte geben Sie eine gültige Telefonnummer ein';
        }
    }
    
    // PLZ validation
    else if (field.id === 'plz' && value) {
        if (!/^\d{4}$/.test(value)) {
            isValid = false;
            errorMessage = 'PLZ muss 4 Ziffern haben';
        }
    }
    
    // Password validation
    else if (field.id === 'passwort' && value) {
        if (value.length < 6) {
            isValid = false;
            errorMessage = 'Passwort muss mindestens 6 Zeichen haben';
        }
    }
    
    updateFieldValidation(field, isValid, errorMessage);
    return isValid;
}

function validatePasswordMatch() {
    const password = document.getElementById('passwort').value;
    const passwordConfirm = document.getElementById('passwort_confirm');
    const confirmValue = passwordConfirm.value;
    
    let isValid = true;
    let errorMessage = '';
    
    if (confirmValue && password !== confirmValue) {
        isValid = false;
        errorMessage = 'Passwörter stimmen nicht überein';
    }
    
    updateFieldValidation(passwordConfirm, isValid, errorMessage);
    return isValid;
}

function updateFieldValidation(field, isValid, errorMessage) {
    const feedbackElement = field.parentNode.querySelector('.invalid-feedback') || 
                           field.parentNode.querySelector('.valid-feedback');
    
    // Remove existing feedback
    if (feedbackElement) {
        feedbackElement.remove();
    }
    
    // Remove existing classes
    field.classList.remove('is-valid', 'is-invalid');
    
    if (field.value.trim()) {
        if (isValid) {
            field.classList.add('is-valid');
            // Add success feedback
            const successFeedback = document.createElement('div');
            successFeedback.className = 'valid-feedback';
            successFeedback.textContent = '✓ Korrekt';
            field.parentNode.appendChild(successFeedback);
        } else {
            field.classList.add('is-invalid');
            // Add error feedback
            const errorFeedback = document.createElement('div');
            errorFeedback.className = 'invalid-feedback';
            errorFeedback.textContent = errorMessage;
            field.parentNode.appendChild(errorFeedback);
        }
    }
}

function setupSubmitHandler() {
    const form = document.getElementById('befugteRegistrierungForm');
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (validateForm()) {
            await handleRegistration();
        }
    });
}

function validateForm() {
    const form = document.getElementById('befugteRegistrierungForm');
    let isFormValid = true;
    
    // Validate all required fields
    const requiredFields = form.querySelectorAll('input[required]');
    requiredFields.forEach(field => {
        if (!validateField(field)) {
            isFormValid = false;
        }
    });
    
    // Validate password match
    if (!validatePasswordMatch()) {
        isFormValid = false;
    }
    
    // Validate at least one competence selected
    const befugnisse = form.querySelectorAll('input[name="befugnisse[]"]:checked');
    if (befugnisse.length === 0) {
        showError('Bitte wählen Sie mindestens eine Befugnis aus!');
        isFormValid = false;
        
        // Scroll to competences section
        document.querySelector('.competences-grid').scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });
    }
    
    // Validate checkboxes (AGB, Datenschutz)
    const agb = document.getElementById('agb');
    const datenschutz = document.getElementById('datenschutz');
    
    if (!agb.checked) {
        showError('Bitte akzeptieren Sie die Allgemeinen Geschäftsbedingungen');
        isFormValid = false;
    }
    
    if (!datenschutz.checked) {
        showError('Bitte akzeptieren Sie die Datenschutzerklärung');
        isFormValid = false;
    }
    
    return isFormValid;
}

async function handleRegistration() {
    const form = document.getElementById('befugteRegistrierungForm');
    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonContent = submitButton.innerHTML;
    
    // Show loading state
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registrierung läuft...';
    
    try {
        // Collect form data
        const registrationData = collectFormData();
        
        console.log('Registrierungsdaten:', registrationData);
        
        // Simulate API call
        await simulateRegistration(registrationData);
        
        // Success
        showSuccess('Registrierung erfolgreich! Sie erhalten eine Bestätigungs-E-Mail.');
        
        // Redirect after delay
        setTimeout(() => {
            window.location.href = 'anbieter-login.html';
        }, 2000);
        
    } catch (error) {
        console.error('Registrierungsfehler:', error);
        showError('Fehler bei der Registrierung: ' + error.message);
        
        // Reset button
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonContent;
    }
}

function collectFormData() {
    const form = document.getElementById('befugteRegistrierungForm');
    const formData = new FormData(form);
    const data = {};
    
    // Collect basic form data
    for (let [key, value] of formData.entries()) {
        if (key === 'befugnisse[]') {
            if (!data.befugnisse) data.befugnisse = [];
            data.befugnisse.push(value);
        } else {
            data[key] = value;
        }
    }
    
    // Add selected person type details
    const personType = document.querySelector('input[name="person_typ"]:checked').value;
    data.person_typ = personType;
    
    // Add timestamp
    data.registriert_am = new Date().toISOString();
    
    // Add status
    data.status = 'pending_verification';
    
    return data;
}

async function simulateRegistration(data) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simulate potential errors
    if (data.email === 'test@error.com') {
        throw new Error('E-Mail bereits registriert');
    }
    
    // In real implementation, send to backend
    /*
    const response = await fetch('/api/register-befugte-person', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    });
    
    if (!response.ok) {
        throw new Error('Registrierung fehlgeschlagen');
    }
    
    return await response.json();
    */
    
    return { success: true, message: 'Registrierung erfolgreich' };
}

function showError(message) {
    showNotification(message, 'error');
}

function showSuccess(message) {
    showNotification(message, 'success');
}

function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    // Create notification
    const notification = document.createElement('div');
    notification.className = `notification alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show`;
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        z-index: 1050;
        min-width: 300px;
        max-width: 500px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
    `;
    
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <i class="fas fa-${type === 'error' ? 'exclamation-circle' : type === 'success' ? 'check-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// Utility functions
function formatPhoneNumber(input) {
    // Simple phone formatting for Swiss numbers
    let value = input.value.replace(/\D/g, '');
    if (value.startsWith('41')) {
        value = '+' + value;
    } else if (value.startsWith('0')) {
        value = '+41' + value.substring(1);
    }
    return value;
}

// Auto-format phone number on input
document.addEventListener('DOMContentLoaded', function() {
    const phoneInput = document.getElementById('telefon');
    if (phoneInput) {
        phoneInput.addEventListener('blur', function() {
            this.value = formatPhoneNumber(this);
        });
    }
});

// PLZ validation and auto-format
document.addEventListener('DOMContentLoaded', function() {
    const plzInput = document.getElementById('plz');
    if (plzInput) {
        plzInput.addEventListener('input', function() {
            // Only allow numbers
            this.value = this.value.replace(/\D/g, '');
            
            // Limit to 4 digits
            if (this.value.length > 4) {
                this.value = this.value.substring(0, 4);
            }
        });
    }
});