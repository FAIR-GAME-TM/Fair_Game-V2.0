// netlify/functions/getMyGarments.js
const connectDB = require("./db");
const jwt       = require("jsonwebtoken");
require("dotenv").config();

exports.handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  // 1) Authenticate via HttpOnly cookie
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
  } catch {
    return { statusCode: 401, body: "Invalid token" };
  }

  // 2) Fetch all purchases for this user
  const db = await connectDB();
  const tagIds = await db
    .collection("garmentPurchases")
    .distinct("nfcTagId", { buyer: payload.username });

  // If none, early-return empty list
  if (tagIds.length === 0) {
    return {
      statusCode: 200,
      body: JSON.stringify([])
    };
  }

  // 3) Lookup the garment docs for those tag IDs
  const garments = await db
    .collection("scholargarments")
    .find({ nfcTagId: { $in: tagIds } })
    .toArray();

  // 4) Return them — your front-end profile.js can remain unchanged
  return {
    statusCode: 200,
    body: JSON.stringify(garments)
  };
};
