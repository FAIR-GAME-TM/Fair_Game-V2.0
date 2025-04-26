// netlify/functions/getMyGarments.js

const connectDB = require("../db");          // adjust path if needed
const jwt       = require("jsonwebtoken");
require("dotenv").config();

exports.handler = async (event) => {
  // 1) Only allow GET
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  // 2) Grab token from HttpOnly cookie
  const cookieHeader = event.headers.cookie;
  if (!cookieHeader) {
    return { statusCode: 401, body: "Not authenticated" };
  }
  const tokenCookie = cookieHeader
    .split(";")
    .find(c => c.trim().startsWith("token="));
  if (!tokenCookie) {
    return { statusCode: 401, body: "Not authenticated" };
  }
  const token = tokenCookie.split("=")[1];

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return { statusCode: 401, body: "Invalid token" };
  }

  // 3) Query MongoDB for garments owned by this user
  try {
    const db = await connectDB();
    const garments = await db
      .collection("scholargarments")
      .find({ owner: payload.username })
      .toArray();

    return {
      statusCode: 200,
      body: JSON.stringify(garments),
    };
  } catch (err) {
    console.error("Error fetching user garments:", err);
    return { statusCode: 500, body: "Internal server error" };
  }
};
