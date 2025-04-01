document.addEventListener('DOMContentLoaded', () => {
    // Make sure the element with id 'loginButton' exists on the page
    const loginButton = document.getElementById('loginButton');
    if (!loginButton) return;
  
    fetch('/.netlify/functions/getUserInfo')
      .then(res => {
        if (!res.ok) throw new Error('Not authenticated');
        return res.json();
      })
      .then(data => {
        // Update the login button with the username
        loginButton.textContent = data.username;
      })
      .catch(err => {
        console.log('User not logged in:', err);
      });
  });
  