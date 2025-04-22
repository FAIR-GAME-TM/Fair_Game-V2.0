document.addEventListener("DOMContentLoaded", async () => {
    // 1. Decode the username from the cookie (or fetch via an endpoint if you have one)
    const token = document.cookie
      .split(";")
      .map(c => c.trim())
      .find(c => c.startsWith("token="))
      ?.split("=")[1];
  
    if (!token) {
      window.location.href = "./login.html";
      return;
    }
    const payload = JSON.parse(atob(token.split(".")[1]));
    document.getElementById("usernameDisplay").textContent = payload.username;
    document.getElementById("loginLink").textContent = "Log Out";
  
    // 2. Fetch the user’s garments
    try {
      const res = await fetch("/.netlify/functions/getMyGarments");
      if (!res.ok) throw new Error(await res.text());
      const garments = await res.json();
  
      const list = document.getElementById("garmentsList");
      if (garments.length === 0) {
        document.getElementById("noGarments").style.display = "block";
        return;
      }
  
      garments.forEach(g => {
        const a = document.createElement("a");
        a.href = `./garmentDetails.html?nfcTagId=${encodeURIComponent(g.nfcTagId)}`;
        a.textContent = g.garmentName || g.nfcTagId;
        a.className = "garment-link";
        list.appendChild(a);
      });
    } catch (err) {
      console.error("Failed to load garments:", err);
      document.getElementById("garmentsList").textContent =
        "Could not load your garments.";
    }
  });
  