// javaScript/authCheck.js

document.addEventListener('DOMContentLoaded', () => {
  // Grab whichever nav element you’re using:
  //   on normal pages it might be <a id="loginButton">,
  //   on profile.html it’s <a id="loginLink">
  const btn = document.getElementById('loginButton')
             || document.getElementById('loginLink');
  if (!btn) return;

  // 1) Check session on the server
  fetch('/.netlify/functions/getUserInfo', {
    credentials: 'include'  // send HttpOnly cookie
  })
    .then(res => {
      if (!res.ok) throw new Error('Not authenticated');
      return res.json();     // { username: "dylan", ... }
    })
    .then(user => {
      // 2) Logged in: show the username
      btn.textContent = user.username;
      // 3) Wire up logout on click
      btn.href = '#';         // remove the default link
      btn.addEventListener('click', async e => {
        e.preventDefault();
        // Hit our logout function to clear the cookie
        await fetch('/.netlify/functions/logout', {
          method: 'POST',
          credentials: 'include'
        });
        // Then send them back to login
        window.location.href = './login.html';
      });
    })
    .catch(() => {
      // 4) Not logged in: ensure it’s a normal Log In link
      btn.textContent = 'Log In';
      btn.href = './login.html';
    });
});
