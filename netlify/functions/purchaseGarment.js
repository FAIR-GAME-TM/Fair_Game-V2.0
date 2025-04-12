const connectDB = require("./db");
const crypto = require("crypto");
require("dotenv").config();

exports.handler = async (event, context) => {
  console.log("PurchaseGarment function invoked.");

  // Ensure the method is POST
  if (event.httpMethod !== "POST") {
    console.log("Invalid HTTP method:", event.httpMethod);
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  // Shopify sends the raw JSON body
  const requestBody = event.body; // raw JSON string
  console.log("Raw request body:", requestBody);

  // Log headers (or at least the HMAC header) for debugging
  console.log("Received headers:", event.headers);
  const hmacHeader = event.headers["x-shopify-hmac-sha256"];
  if (!hmacHeader) {
    console.log("No Shopify HMAC header found.");
    return { statusCode: 401, body: "Unauthorized: No HMAC header" };
  }
  console.log("Shopify HMAC header:", hmacHeader);

  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  const generatedHmac = crypto
    .createHmac("sha256", secret)
    .update(requestBody, "utf8")
    .digest("base64");
  console.log("Generated HMAC:", generatedHmac);

  if (generatedHmac !== hmacHeader) {
    console.log("HMAC mismatch: Unauthorized request.");
    return { statusCode: 401, body: "Unauthorized" };
  }
  console.log("HMAC verification passed.");

  // Parse the Shopify order payload
  let order;
  try {
    order = JSON.parse(requestBody);
    console.log("Order payload parsed successfully.");
  } catch (err) {
    console.log("Error parsing JSON:", err);
    return { statusCode: 400, body: "Invalid JSON" };
  }

  // Extract the buyer's email from the order payload
  const buyerEmail = order.customer ? order.customer.email : null;
  if (!buyerEmail) {
    console.log("Customer email missing in order payload.");
    return { statusCode: 400, body: "Missing customer information" };
  }
  console.log("Buyer email extracted:", buyerEmail);

  // Connect to MongoDB and look up the buyer's username
  let updatedCount = 0;
  try {
    const db = await connectDB();
    console.log("Connected to MongoDB.");
    const garmentsCollection = db.collection("scholargarments");
    const usersCollection = db.collection("users"); // Assuming your user accounts are stored here

    // Map buyer email to a Fair Game username
    const userDoc = await usersCollection.findOne({ email: buyerEmail });
    if (!userDoc || !userDoc.username) {
      console.log("No matching user found for email:", buyerEmail);
      return { statusCode: 400, body: "No matching Fair Game user found for the provided email." };
    }
    const buyerUsername = userDoc.username;
    console.log("Buyer username mapped:", buyerUsername);
  
    // Loop over each line item in the Shopify order to update or insert garments
    for (const item of order.line_items) {
      // Assume NFC tag ID is stored in the SKU; adjust if stored elsewhere
      const nfcTagId = item.sku;
      if (!nfcTagId) {
        console.log("Line item missing SKU for NFC tag ID, skipping item:", item);
        continue;
      }
      
      // Also extract additional details if needed
      const garmentName = item.title;
      const price = item.price;
      const quantity = item.quantity;
      
      console.log(`Processing item: NFC Tag ID ${nfcTagId}, Product Title: ${garmentName}`);
      
      // Upsert: if a garment with the given nfcTagId exists, update it; otherwise insert a new one.
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
      
      console.log(`Upsert result for NFC Tag ID ${nfcTagId}:`, result);
      updatedCount++;
    }
    
    if (updatedCount === 0) {
      console.log("No garments matched the order data.");
      return { statusCode: 404, body: "No matching garment(s) found or updated." };
    }
    
    console.log(`Process completed: ${updatedCount} garment(s) updated/inserted.`);
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Garment purchase processed successfully", count: updatedCount })
    };
  } catch (error) {
    console.error("Error processing Shopify webhook:", error.message);
    return { statusCode: 500, body: "Internal server error" };
  }
};
