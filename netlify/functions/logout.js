// netlify/functions/logout.js
exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  return {
    statusCode: 200,
    headers: {
      // Overwrite the token cookie (single header string)
      "Set-Cookie": 
        "token=; HttpOnly; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Secure; SameSite=Strict"
    },
    body: JSON.stringify({ message: "Logged out" })
  };
};
