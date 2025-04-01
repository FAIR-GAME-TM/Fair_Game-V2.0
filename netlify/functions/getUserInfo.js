const jwt = require("jsonwebtoken");
require("dotenv").config();

exports.handler = async (event, context) => {
  // Extract token from cookie header
  const cookieHeader = event.headers.cookie;
  if (!cookieHeader) {
    return { statusCode: 401, body: JSON.stringify({ message: "Not authenticated" }) };
  }

  const tokenCookie = cookieHeader.split(';').find(c => c.trim().startsWith('token='));
  if (!tokenCookie) {
    return { statusCode: 401, body: JSON.stringify({ message: "Not authenticated" }) };
  }
  
  const token = tokenCookie.split('=')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "default_secret_key");
    return {
      statusCode: 200,
      body: JSON.stringify({ username: decoded.username }),
    };
  } catch (error) {
    return { statusCode: 401, body: JSON.stringify({ message: "Not authenticated" }) };
  }
};
