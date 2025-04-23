// netlify/functions/logout.js
exports.handler = async (event) => {
    // Only allow POST (or GET if you prefer)
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }
  
    // Clear the ‘token’ cookie by setting it empty with an immediate expiry
    return {
      statusCode: 200,
      headers: {
        "Set-Cookie": [
          // Overwrite the token cookie
          `token=; HttpOnly; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict; Secure`
        ]
      },
      body: JSON.stringify({ message: "Logged out" })
    };
  };
  