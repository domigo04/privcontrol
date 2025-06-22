// Anbieter Login JavaScript
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔐 Anbieter-Login geladen');

    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('passwort');
    const rememberCheckbox = document.getElementById('remember');
    const alertContainer = document.getElementById('alertContainer');

    // Check for saved credentials
    checkSavedCredentials();

    // Form Submit
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Enter key on password field
    if (passwordInput) {
        passwordInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handleLogin(e);
            }
        });
    }

    function checkSavedCredentials() {
        const savedEmail = localStorage.getItem('anbieterEmail');
        if (savedEmail && emailInput) {
            emailInput.value = savedEmail;
            if (rememberCheckbox) {
                rememberCheckbox.checked = true;
            }
        }

        // Check if redirected from registration
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('registered') === 'true') {
            showAlert('Registrierung erfolgreich! Bitte melden Sie sich an.', 'success');
        }

        // Check if session expired
        if (urlParams.get('sessionExpired') === 'true') {
            showAlert('Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.', 'warning');
        }
    }

    async function handleLogin(event) {
        event.preventDefault();

        // Clear previous alerts
        clearAlerts();

        // Validate inputs
        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (!email || !password) {
            showAlert('Bitte geben Sie E-Mail und Passwort ein.', 'warning');
            return;
        }

        // Loading state
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Anmelden...';

        try {
            const response = await fetch('/api/anbieter/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: email,
                    passwort: password
                })
            });

            const result = await response.json();

            if (result.success) {
                // Save credentials if requested
                if (rememberCheckbox.checked) {
                    localStorage.setItem('anbieterEmail', email);
                } else {
                    localStorage.removeItem('anbieterEmail');
                }

                // Save session token
                sessionStorage.setItem('anbieterToken', result.sessionToken);
                sessionStorage.setItem('anbieterData', JSON.stringify(result.user));

                // Show success message
                showAlert('Anmeldung erfolgreich! Sie werden weitergeleitet...', 'success');

                // Redirect to dashboard
                setTimeout(() => {
                    window.location.href = '/anbieter-dashboard.html';
                }, 1000);

            } else {
                // Handle specific error cases
                if (response.status === 403) {
                    showAlert('Ihr Account ist noch nicht aktiviert oder wurde gesperrt. Bitte kontaktieren Sie den Support.', 'danger');
                } else if (response.status === 401) {
                    showAlert('Ungültige E-Mail-Adresse oder Passwort.', 'danger');
                    passwordInput.value = '';
                    passwordInput.focus();
                } else {
                    showAlert(result.message || 'Anmeldung fehlgeschlagen.', 'danger');
                }
            }

        } catch (error) {
            console.error('Login-Fehler:', error);
            showAlert('Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.', 'danger');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    }

    function showAlert(message, type = 'danger') {
        const alert = document.createElement('div');
        alert.className = `alert alert-${type} alert-dismissible fade show`;
        alert.setAttribute('role', 'alert');
        alert.innerHTML = `
            <i class="fas fa-${getAlertIcon(type)} me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;

        if (alertContainer) {
            alertContainer.appendChild(alert);
        } else {
            loginForm.insertBefore(alert, loginForm.firstChild);
        }

        // Auto-dismiss after 10 seconds
        setTimeout(() => {
            alert.classList.remove('show');
            setTimeout(() => alert.remove(), 150);
        }, 10000);
    }

    function clearAlerts() {
        const alerts = document.querySelectorAll('.alert');
        alerts.forEach(alert => alert.remove());
    }

    function getAlertIcon(type) {
        const icons = {
            success: 'check-circle',
            danger: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    // Password visibility toggle
    const togglePassword = document.getElementById('togglePassword');
    if (togglePassword) {
        togglePassword.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            // Toggle icon
            const icon = this.querySelector('i');
            icon.classList.toggle('fa-eye');
            icon.classList.toggle('fa-eye-slash');
        });
    }

    // Forgot password modal
    const forgotPasswordLink = document.getElementById('forgotPasswordLink');
    const forgotPasswordModal = new bootstrap.Modal(document.getElementById('forgotPasswordModal'));
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');

    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', function(e) {
            e.preventDefault();
            forgotPasswordModal.show();
        });
    }

    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const email = document.getElementById('resetEmail').value;
            const resetBtn = this.querySelector('button[type="submit"]');
            const originalText = resetBtn.innerHTML;

            resetBtn.disabled = true;
            resetBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Wird gesendet...';

            try {
                const response = await fetch('/api/anbieter/passwort-reset', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email })
                });

                const result = await response.json();

                if (result.success) {
                    forgotPasswordModal.hide();
                    showAlert('Eine E-Mail mit Anweisungen zum Zurücksetzen Ihres Passworts wurde gesendet.', 'success');
                    forgotPasswordForm.reset();
                } else {
                    showModalAlert(result.message || 'E-Mail konnte nicht gesendet werden.', 'danger');
                }

            } catch (error) {
                console.error('Passwort-Reset Fehler:', error);
                showModalAlert('Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.', 'danger');
            } finally {
                resetBtn.disabled = false;
                resetBtn.innerHTML = originalText;
            }
        });
    }

    function showModalAlert(message, type) {
        const modalBody = document.querySelector('#forgotPasswordModal .modal-body');
        const existingAlert = modalBody.querySelector('.alert');
        
        if (existingAlert) {
            existingAlert.remove();
        }

        const alert = document.createElement('div');
        alert.className = `alert alert-${type} alert-dismissible fade show mt-3`;
        alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        modalBody.appendChild(alert);
    }
});