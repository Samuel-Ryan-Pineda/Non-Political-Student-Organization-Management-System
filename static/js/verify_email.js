document.addEventListener("DOMContentLoaded", function () {
    const verificationForm = document.getElementById("verification-form");
    const verificationInput = document.getElementById("verification-code");
    const loadingOverlay = document.getElementById("loading-overlay");
    const notification = document.getElementById("notification");
    const verificationContainer = document.querySelector(".verification-container");
    const resendButton = document.getElementById("resend-button");
    const closeButton = document.getElementById("close-button");
    const countdownDisplay = document.getElementById("countdown");

    let countdownInterval;
    let remainingTime = 60; // 60 seconds cooldown

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

    // Function to start countdown timer
    function startCountdown() {
        clearInterval(countdownInterval);
        remainingTime = 60;
        updateCountdownDisplay();
        resendButton.disabled = true;
        
        countdownInterval = setInterval(() => {
            remainingTime--;
            updateCountdownDisplay();
            
            if (remainingTime <= 0) {
                clearInterval(countdownInterval);
                resendButton.disabled = false;
                countdownDisplay.textContent = "";
            }
        }, 1000);
    }

    // Function to update countdown display
    function updateCountdownDisplay() {
        if (remainingTime > 0) {
            countdownDisplay.textContent = `(wait ${remainingTime}s)`;
        } else {
            countdownDisplay.textContent = "";
        }
    }

    // Start countdown when page loads
    startCountdown();

    // Handle resend verification code
    resendButton.addEventListener("click", function() {
        if (resendButton.disabled) return;
        
        // Show loading overlay immediately
        loadingOverlay.style.display = "flex";
        
        fetch("/resend_verification", {
            method: "POST",
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
        })
        .then(response => response.json())
        .then(data => {
            loadingOverlay.style.display = "none";
            
            if (data.status === "success") {
                showNotification(data.message, "success-message");
                startCountdown();
            } else {
                showNotification(data.message, "error-message");
                if (data.remaining_time) {
                    remainingTime = data.remaining_time;
                    startCountdown();
                }
            }
        })
        .catch(error => {
            loadingOverlay.style.display = "none";
            showNotification("Failed to resend verification code", "error-message");
        });
    });

    // Handle close button
    closeButton.addEventListener("click", function() {
        verificationContainer.classList.add('fade-out');
        
        setTimeout(() => {
            window.location.href = "/exit_verification";
        }, 500);
    });

    // Handle page transitions with fade-out
    const allLinks = document.querySelectorAll('a:not([target="_blank"])');
    allLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            if (this.getAttribute('href') !== '#' && !this.getAttribute('href').startsWith('#')) {
                e.preventDefault();
                verificationContainer.classList.add('fade-out');

                setTimeout(() => {
                    window.location = this.getAttribute('href');
                }, 500);
            }
        });
    });

    verificationForm.addEventListener("submit", function (event) {
        event.preventDefault();
        
        if (!verificationInput.checkValidity()) {
            verificationInput.reportValidity();
            return;
        }

        const loadingTimer = setTimeout(() => {
            loadingOverlay.style.display = "flex";
        }, 500);

        fetch("/verify_email", {
            method: "POST",
            body: new FormData(verificationForm),
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
        })
        .then(response => response.json())
        .then(data => {
            clearTimeout(loadingTimer);
            loadingOverlay.style.display = "none";

            if (data.status === "success") {
                showNotification(data.message, "success-message");
                
                setTimeout(() => {
                    window.location.href = "/login";
                }, 1000);
            } else {
                verificationInput.classList.add('shake');
                verificationInput.value = '';
                
                setTimeout(() => {
                    verificationInput.classList.remove('shake');
                }, 500);

                showNotification(data.message, "error-message");
            }
        })
        .catch(error => {
            clearTimeout(loadingTimer);
            loadingOverlay.style.display = "none";
            showNotification("An unexpected error occurred", "error-message");
        });
    });

    // Input validation for verification code
    verificationInput.addEventListener("input", function (e) {
        this.value = this.value.replace(/\D/g, '');
    });
});