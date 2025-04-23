// javaScript/authCheck.js

// This script checks if the user is authenticated and updates the nav link accordingly.
document.addEventListener('DOMContentLoaded', () => {
  // Select the login/logout nav element (id varies by page)
  const navBtn = document.getElementById('loginButton') || document.getElementById('loginLink');
  if (!navBtn) return;

  // Ask the server who I am, sending the HttpOnly token cookie
  fetch('/.netlify/functions/getUserInfo', {
    credentials: 'include'
  })
    .then(res => {
      if (!res.ok) throw new Error('Not authenticated');
      return res.json();  // { username: 'dylan' }
    })
    .then(user => {
      // Logged in: change nav link to 'Log Out'
      navBtn.textContent = 'Log Out';
      navBtn.href = '#';
      navBtn.addEventListener('click', async e => {
        e.preventDefault();
        // Call logout to clear the cookie
        await fetch('/.netlify/functions/logout', {
          method: 'POST',
          credentials: 'include'
        });
        // Redirect to login page
        window.location.href = './login.html';
      });
    })
    .catch(() => {
      // Not logged in: show 'Log In'
      navBtn.textContent = 'Log In';
      navBtn.href = './login.html';
    });
});