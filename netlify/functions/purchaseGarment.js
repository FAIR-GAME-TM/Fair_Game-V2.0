const connectDB = require("./db");
const crypto = require("crypto");
require("dotenv").config();

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }
  
  // Shopify sends the raw JSON body
  const requestBody = event.body; // raw JSON string

  // Verify Shopify webhook HMAC signature
  const hmacHeader = event.headers["x-shopify-hmac-sha256"];
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  const generatedHmac = crypto
    .createHmac("sha256", secret)
    .update(requestBody, "utf8")
    .digest("base64");

  if (generatedHmac !== hmacHeader) {
    return { statusCode: 401, body: "Unauthorized" };
  }
  
  // Parse the Shopify order payload
  let order;
  try {
    order = JSON.parse(requestBody);
  } catch (err) {
    return { statusCode: 400, body: "Invalid JSON" };
  }
  
  // Extract the buyer's email from the order payload
  const buyerEmail = order.customer ? order.customer.email : null;
  if (!buyerEmail) {
    return { statusCode: 400, body: "Missing customer information" };
  }
  
  // Connect to MongoDB
  let updatedCount = 0;
  try {
    const db = await connectDB();
    const garmentsCollection = db.collection("scholargarments");
    const usersCollection = db.collection("users"); // Assuming your user accounts are stored here

    // Map the buyer's email to a username by looking it up in your users collection
    const userDoc = await usersCollection.findOne({ email: buyerEmail });
    if (!userDoc || !userDoc.username) {
      return { statusCode: 400, body: "No matching Fair Game user found for the provided email." };
    }
    const buyerUsername = userDoc.username;
  
    // Loop over each line item in the Shopify order to update garments
    for (const item of order.line_items) {
      // Assume NFC tag ID is stored in the SKU; adjust if different
      const nfcTagId = item.sku;
      
      // Also extract additional details if needed
      const garmentName = item.title;
      const price = item.price;
      const quantity = item.quantity;

      if (nfcTagId) {
        // Upsert: if a garment with the given nfcTagId exists, update it; otherwise, insert a new one
        const result = await garmentsCollection.updateOne(
          { nfcTagId: nfcTagId },
          { 
            $set: { 
              owner: buyerUsername,  // Link to the Fair Game username
              garmentName: garmentName,
              price: price,
              quantity: quantity,
              updatedAt: new Date()
            },
            $setOnInsert: {
              createdAt: new Date()
            }
          },
          { upsert: true }
        );
        updatedCount++;
      }
    }
    
    if (updatedCount === 0) {
      return { statusCode: 404, body: "No matching garment(s) found or updated." };
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Garment purchase processed successfully", count: updatedCount })
    };
  } catch (error) {
    console.error("Error processing Shopify webhook:", error.message);
    return { statusCode: 500, body: "Internal server error" };
  }
};
