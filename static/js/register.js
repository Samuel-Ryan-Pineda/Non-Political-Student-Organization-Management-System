document.addEventListener("DOMContentLoaded", function () {
    const registerForm = document.getElementById("register-form");
    const loadingOverlay = document.getElementById("loading-overlay");
    const notification = document.getElementById("notification");
    const registerContainer = document.querySelector(".register-container");

    // Function to show notification
    function showNotification(message, type) {
        notification.textContent = message;
        notification.className = type;
        notification.style.display = "block";
        notification.style.opacity = "1";

        setTimeout(() => {
            notification.style.opacity = "0";
            setTimeout(() => {
                notification.style.display = "none";
            }, 300);
        }, 3000);
    }

    // Handle page transitions with fade-out
    const allLinks = document.querySelectorAll('a:not([target="_blank"])');
    allLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // Only handle links to other pages, not anchor links
            if (this.getAttribute('href') !== '#' && !this.getAttribute('href').startsWith('#')) {
                e.preventDefault();
                registerContainer.classList.add('fade-out');

                // Navigate to the new page after animation completes
                setTimeout(() => {
                    window.location = this.getAttribute('href');
                }, 500); // Match this with your fadeOut animation duration
            }
        });
    });

    document.getElementById("confirm-password").addEventListener("input", function () {
        const password = document.getElementById("register-password").value;
        if (password !== this.value) {
            this.setCustomValidity("Passwords do not match");
        } else {
            this.setCustomValidity("");
        }
    });

    registerForm.addEventListener("submit", function (event) {
        event.preventDefault();
        
        // Check form validity before proceeding
        if (!registerForm.checkValidity()) {
            registerForm.reportValidity();
            return;
        }

        // Delay before showing loading overlay
        const loadingTimer = setTimeout(() => {
            loadingOverlay.style.display = "flex";
        }, 10);

        fetch("/register", {
            method: "POST",
            body: new FormData(registerForm),
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
        })
        .then(response => response.json())
        .then(data => {
            // Clear the loading timer to prevent showing loading if response is quick
            clearTimeout(loadingTimer);
            // Hide loading overlay
            loadingOverlay.style.display = "none";

            if (data.status === "success") {
                showNotification(data.message, "success-message");
                // Redirect to verification page on successful registration
                setTimeout(() => {
                    window.location.href = "/verify_email_page";
                }, 1000);
            } else {
                // Add shake animation to all input fields
                const inputFields = registerForm.querySelectorAll('input');
                inputFields.forEach(field => {
                    field.classList.add('shake');
                    
                    // Remove shake animation after it completes
                    setTimeout(() => {
                        field.classList.remove('shake');
                    }, 500);
                });

                showNotification(data.message, "error-message");
            }
        })
    });
});