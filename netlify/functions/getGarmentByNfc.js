// netlify/functions/getGarmentByNfc.js
const connectDB = require("./db");
const jwt       = require("jsonwebtoken");
require("dotenv").config();

exports.handler = async (event) => {
  // 1) Read NFC tag ID
  const { nfcTagId } = event.queryStringParameters || {};
  if (!nfcTagId) {
    return { statusCode: 400, body: "NFC tag ID is required" };
  }

  // 2) Authenticate via token cookie
  const cookieHeader = event.headers.cookie;
  if (!cookieHeader) {
    return { statusCode: 401, body: "Not authenticated" };
  }
  const tokenCookie = cookieHeader
    .split(";")
    .find((c) => c.trim().startsWith("token="));
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

  const db = await connectDB();

  // 3) Check purchases for this user & tag
  const purchase = await db
    .collection("garmentPurchases")
    .findOne(
      { nfcTagId, buyer: payload.username },
      { sort: { purchasedAt: -1 } }
    );
  if (!purchase) {
    return { statusCode: 403, body: "You don’t own this." };
  }

  // 4) Load the garment metadata
  const garment = await db
    .collection("scholargarments")
    .findOne({ nfcTagId });
  if (!garment) {
    return { statusCode: 404, body: "Garment not found." };
  }

  // 5) Merge in owner + purchase info for the client
  const result = {
    ...garment,
    owner:      payload.username,
    quantity:   purchase.quantity,
    price:      purchase.price,
    createdAt:  purchase.purchasedAt   // show purchase date as "first opened"
  };

  return {
    statusCode: 200,
    body: JSON.stringify(result),
  };
};
