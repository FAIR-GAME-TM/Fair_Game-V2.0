const connectDB = require("./db");
const jwt = require("jsonwebtoken");
require("dotenv").config();

exports.handler = async (event, context) => {
  // Extract NFC tag id from query parameters
  const { nfcTagId } = event.queryStringParameters || {};
  if (!nfcTagId) {
    return { statusCode: 400, body: "NFC tag ID is required" };
  }
  
  // Extract token from the cookie header
  const cookieHeader = event.headers.cookie;
  if (!cookieHeader) {
    return { statusCode: 401, body: "Not authenticated" };
  }
  
  const tokenCookie = cookieHeader.split(";").find(c => c.trim().startsWith("token="));
  if (!tokenCookie) {
    return { statusCode: 401, body: "Not authenticated" };
  }
  
  const token = tokenCookie.split("=")[1];
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET || "default_secret_key");
  } catch (error) {
    return { statusCode: 401, body: "Not authenticated" };
  }
  
  try {
    const db = await connectDB();
    const collection = db.collection("scholargarments");

    // Find the garment by its NFC tag id
    const garment = await collection.findOne({ nfcTagId: nfcTagId });
    if (!garment) {
      return { statusCode: 404, body: "Garment not found" };
    }
    
    // Check if the garment has been purchased (has an owner)
    if (!garment.owner) {
      return { statusCode: 403, body: "This garment is not yet purchased." };
    }
    
    // Check if the logged-in user's username matches the garment's owner
    if (garment.owner !== decoded.username) {
      return { statusCode: 403, body: "Access restricted: You do not own this garment" };
    }
    
    // If authorized, return garment details
    return {
      statusCode: 200,
      body: JSON.stringify(garment),
    };
  } catch (error) {
    console.error("Error retrieving garment:", error.message);
    return { statusCode: 500, body: "Internal server error" };
  }
};
