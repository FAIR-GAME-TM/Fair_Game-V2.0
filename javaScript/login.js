document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('loginForm');

    form.addEventListener('submit', function (event) {
        event.preventDefault();

        // Gather login data
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const errorMessage = document.getElementById('errorMessage');

        // Prepare data to send
        const formData = {
            username: username,
            password: password,
        };

        // Send login request to backend
        fetch('/.netlify/functions/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Invalid username or password.');
                }
                return response.json();
            })
            .then((data) => {
                if (data.message) {
                    alert(data.message); // Success message from backend
                    window.location.href = './portfolio.html'; // Redirect on success
                }
            })
            .catch((error) => {
                errorMessage.textContent = error.message || 'Login failed.';
                console.error('Error:', error);
            });

        // Clear the error message for subsequent attempts
        errorMessage.textContent = '';
    });
});
