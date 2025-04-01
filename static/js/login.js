document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');
    const errorContainer = document.getElementById('error-container');
    const warningContainer = document.getElementById('warning-container');
    const loginButton = document.getElementById('login-button');
    const passwordInput = document.getElementById('register-password');

    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();

        // Clear previous error messages
        errorContainer.style.display = 'none';
        warningContainer.style.display = 'none';

        // Change button text to show loading
        loginButton.textContent = 'Signing in...';
        loginButton.disabled = true;

        // Get form data
        const formData = new FormData(loginForm);

        // Send AJAX request
        fetch('/login', {
            method: 'POST',
            body: formData,
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(response => response.json())
        .then(data => {
            // Reset button
            loginButton.textContent = 'Sign in';
            loginButton.disabled = false;

            if (data.success) {
                // If login successful, fade out and redirect
                const rectangle = document.querySelector('.rectangle');
                rectangle.classList.add('fade-out');

                setTimeout(() => {
                    window.location.href = data.redirect;
                }, 500);
            } else {
                // Handle error
                if (data.category === 'error') {
                    errorContainer.textContent = data.message;
                    errorContainer.style.display = 'block';

                    // Clear password field
                    passwordInput.value = '';

                    // Add shake animation to form
                    loginForm.classList.add('shake');
                    setTimeout(() => {
                        loginForm.classList.remove('shake');
                    }, 500);
                } else if (data.category === 'warning') {
                    warningContainer.textContent = data.message;
                    warningContainer.style.display = 'block';
                }
            }
        })
        .catch(error => {
            console.error('Error:', error);
            errorContainer.textContent = 'An unexpected error occurred. Please try again.';
            errorContainer.style.display = 'block';
            loginButton.textContent = 'Sign in';
            loginButton.disabled = false;

            // Clear password field
            passwordInput.value = '';
        });
    });

    // Handle links for page transitions
    const allLinks = document.querySelectorAll('a:not([target="_blank"])');

    allLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // Only handle links to other pages, not anchor links
            if (this.getAttribute('href') !== '#' && !this.getAttribute('href').startsWith('#')) {
                e.preventDefault();
                const rectangle = document.querySelector('.rectangle');
                rectangle.classList.add('fade-out');

                // Navigate to the new page after animation completes
                setTimeout(() => {
                    window.location = this.getAttribute('href');
                }, 500); // Match this with your fadeOut animation duration
            }
        });
    });
});