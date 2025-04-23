// javaScript/profile.js
document.addEventListener("DOMContentLoaded", async () => {
    // 1) Ask the server who I am
    let user;
    try {
      const res = await fetch("/.netlify/functions/getUserInfo", {
        credentials: "include"     // ← send the HttpOnly cookie
      });
      if (!res.ok) throw new Error("not authenticated");
      user = await res.json();    // { username: "alice" }
    } catch (err) {
      // no valid session → back to login
      return window.location.replace("./login.html");
    }
  
    // 2) Inject username into the UI
    document.getElementById("usernameDisplay").textContent = user.username;
    document.getElementById("loginLink").textContent = "Log Out";
  
    // 3) Fetch my garments (also send the cookie)
    let garments = [];
    try {
      const r2 = await fetch("/.netlify/functions/getGarments", {
        credentials: "include"
      });
      if (r2.ok) garments = await r2.json();
    } catch (_){}
    
    const list = document.getElementById("garmentsList");
    if (!garments.length) {
      document.getElementById("noGarments").style.display = "block";
      return;
    }
    garments.forEach(g => {
      const a = document.createElement("a");
      a.href = `./garmentDetails.html?nfcTagId=${encodeURIComponent(g.nfcTagId)}`;
      a.textContent = g.garmentName || g.nfcTagId;
      list.appendChild(a);
    });
  });
  