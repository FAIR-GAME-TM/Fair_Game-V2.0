const connectDB = require("./db");
const crypto = require("crypto");
require("dotenv").config();

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  // Retrieve the Shopify HMAC header and raw request body
  const hmacHeader = event.headers["x-shopify-hmac-sha256"];
  const requestBody = event.body; // This should be the raw JSON string

  // Verify webhook signature
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  const hash = crypto
    .createHmac("sha256", secret)
    .update(requestBody, "utf8")
    .digest("base64");

  if (hash !== hmacHeader) {
    return { statusCode: 401, body: "Unauthorized" };
  }

  // Parse the order from the request body
  let order;
  try {
    order = JSON.parse(requestBody);
  } catch (err) {
    return { statusCode: 400, body: "Invalid JSON" };
  }

  // Extract buyer information; here we use the customer's email as their identifier
  const buyerUsername = order.customer ? order.customer.email : null;
  if (!buyerUsername) {
    return { statusCode: 400, body: "Missing customer information" };
  }

  // Connect to MongoDB and update garments that match purchased items
  try {
    const db = await connectDB();
    const garmentsCollection = db.collection("scholargarments");

    // Iterate through each line item in the order.
    // Here, we assume that the product SKU (or a metafield) holds the NFC tag ID
    for (const item of order.line_items) {
      // Adjust this logic to match how you identify a scholar garment.
      // For example, if item.sku contains the NFC tag ID:
      const nfcTagId = item.sku; // Or extract from item.metafields if stored there
      
      if (nfcTagId) {
        // Update the garment record by setting the owner to the buyer's username
        await garmentsCollection.updateOne(
          { nfcTagId: nfcTagId },
          { $set: { owner: buyerUsername } }
        );
      }
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Garment updates processed" }),
    };
  } catch (error) {
    console.error("Error processing webhook:", error.message);
    return { statusCode: 500, body: "Internal Server Error" };
  }
};
 