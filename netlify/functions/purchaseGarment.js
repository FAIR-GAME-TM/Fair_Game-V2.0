const connectDB = require("./db");
const jwt = require("jsonwebtoken");
require("dotenv").config();

exports.handler = async (event, context) => {
  // Ensure the method is POST
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  // Parse the request body (assumed to be JSON)
  const { nfcTagId } = JSON.parse(event.body);
  if (!nfcTagId) {
    return { statusCode: 400, body: "NFC tag ID is required" };
  }

  // Extract token from cookies (assuming it's stored as an HttpOnly cookie)
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
  
  // At this point, you have the buyer's username from the decoded token
  const buyerUsername = decoded.username;
  
  try {
    const db = await connectDB();
    // Update the garment document with the buyer's username as owner
    const result = await db.collection("scholargarments").updateOne(
      { nfcTagId: nfcTagId },
      { $set: { owner: buyerUsername } }
    );
    
    // If no document was updated, the garment might not exist
    if (result.matchedCount === 0) {
      return { statusCode: 404, body: "Garment not found" };
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Garment purchase updated successfully" })
    };
  } catch (error) {
    console.error("Error updating garment:", error.message);
    return { statusCode: 500, body: "Internal server error" };
  }
};
