document.addEventListener('DOMContentLoaded', function() {
    // Load stored account info
    const storedUsername = localStorage.getItem('username');
    const storedEmail = localStorage.getItem('email');

    if (storedUsername) {
        document.getElementById('username').value = storedUsername;
    }
    if (storedEmail) {
        document.getElementById('email').value = storedEmail;
    }

    document.getElementById('create-account-form').addEventListener('submit', function(event) {
        event.preventDefault();

        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        // Simple validation
        if (password !== confirmPassword) {
            alert("Passwords do not match!");
            return;
        }
const formData = {
    username: document.getElementById("username").value,
    password: document.getElementById("password").value,
};

fetch('/create-account', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData),
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));

        // Store account info in localStorage
        localStorage.setItem('username', username);
        localStorage.setItem('email', email);

        // Optionally, you can send this data to a server for actual account creation
        console.log('Account created:', { username, email, password });

        alert("Account created successfully!");
        // Optionally redirect or clear the form
        document.getElementById('create-account-form').reset();
    });
});
