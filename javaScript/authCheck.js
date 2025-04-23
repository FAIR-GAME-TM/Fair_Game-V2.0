// javaScript/authCheck.js
document.addEventListener('DOMContentLoaded', () => {
  // Support both header variants
  const btn = document.getElementById('loginButton') || document.getElementById('loginLink');
  if (!btn) return;

  // Ask the server who I am (sends HttpOnly cookie)
  fetch('/.netlify/functions/getUserInfo', {
    credentials: 'include'
  })
    .then(res => {
      if (!res.ok) throw new Error('Not authenticated');
      return res.json();
    })
    .then(user => {
      // Logged in: show username and set up logout
      btn.textContent = user.username;
      btn.href = '#';
      btn.addEventListener('click', async e => {
        e.preventDefault();
        // Call logout function to clear the cookie
        await fetch('/.netlify/functions/logout', {
          method: 'POST',
          credentials: 'include'
        });
        // Redirect back to login page
        window.location.href = './login.html';
      });
    })
    .catch(() => {
      // Not logged in: show Log In link
      btn.textContent = 'Log In';
      btn.href = './login.html';
    });
});
