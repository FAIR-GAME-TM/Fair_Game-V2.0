document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('create-account-form');

    form.addEventListener('submit', function (event) {
        event.preventDefault();

        // Gather form data
        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        // Simple validation
        if (password !== confirmPassword) {
            alert('Passwords do not match!');
            return;
        }

        // Prepare data to send
        const formData = {
            username: username,
            email: email,
            password: password,
        };

        // Send data to backend
        fetch('/.netlify/functions/createAccount', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
        })
            .then((response) => response.json())
            .then((data) => {
                if (data.message) {
                    alert(data.message); // Success or error message from backend
                } else {
                    alert('Error creating account.');
                }
            })
            .catch((error) => console.error('Error:', error));

        // Clear form fields after submission
        form.reset();
    });
});
