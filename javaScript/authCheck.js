// javaScript/authCheck.js

document.addEventListener('DOMContentLoaded', () => {
  // Look for the nav link on any page:
  const navBtn = document.getElementById('loginButton')
              || document.getElementById('loginLink');
  if (!navBtn) return;

  fetch('/.netlify/functions/getUserInfo', {
    credentials: 'include'
  })
    .then(res => {
      if (!res.ok) throw new Error('Not authenticated');
      return res.json();    // => { username: 'dylan' }
    })
    .then(user => {
      // Are we on the profile page?
      const onProfilePage = window.location.pathname.endsWith('profile.html');

      if (onProfilePage) {
        // On profile.html → show "Log Out"
        navBtn.textContent = 'Log Out';
        navBtn.href = '#';
        navBtn.addEventListener('click', async e => {
          e.preventDefault();
          await fetch('/.netlify/functions/logout', {
            method: 'POST',
            credentials: 'include'
          });
          // After logout, go to login screen
          window.location.href = './login.html';
        });
      } else {
        // On all other pages → show username and link to profile
        navBtn.textContent = user.username;
        navBtn.href = './profile.html';
      }
    })
    .catch(() => {
      // Not logged in → always show Log In
      navBtn.textContent = 'Log In';
      navBtn.href = './login.html';
    });
});
