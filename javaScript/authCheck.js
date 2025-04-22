document.addEventListener('DOMContentLoaded', () => {
    const loginButton = document.getElementById('loginButton');
    if (!loginButton) return;
  
    fetch('/.netlify/functions/getUserInfo')
      .then(res => {
        if (!res.ok) throw new Error('Not authenticated');
        return res.json();
      })
      .then(data => {
        // Update button text to show the username
        loginButton.textContent = data.username;
        // Update the link so that clicking it takes you to the logged-in profile page
        loginButton.href = "./profile.html";
      })
      .catch(err => {
        console.log("User not logged in:", err);
      });
  });
  