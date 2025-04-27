// netlify/functions/purchaseGarment.js
const connectDB = require("./db");
const crypto    = require("crypto");
require("dotenv").config();

exports.handler = async (event) => {
  // 1) Only accept POSTs
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  // 2) Verify Shopify webhook HMAC
  const rawBody    = event.body;
  const hmacHeader = event.headers["x-shopify-hmac-sha256"];
  const ourHmac    = crypto
    .createHmac("sha256", process.env.SHOPIFY_WEBHOOK_SECRET)
    .update(rawBody, "utf8")
    .digest("base64");
  if (ourHmac !== hmacHeader) {
    return { statusCode: 401, body: "Unauthorized" };
  }

  // 3) Parse order payload
  let order;
  try {
    order = JSON.parse(rawBody);
  } catch {
    return { statusCode: 400, body: "Invalid JSON" };
  }

  // 4) Find the buyer in your users collection
  const buyerEmail = order.customer?.email;
  if (!buyerEmail) {
    return { statusCode: 400, body: "Missing customer email" };
  }

  const db  = await connectDB();
  const usr = await db.collection("users").findOne({ email: buyerEmail });
  if (!usr) {
    return { statusCode: 400, body: "No matching user" };
  }
  const buyer = usr.username;

  // 5) Process each line item
  let processed = 0;
  for (const item of order.line_items) {
    const tagId = item.sku;  // SKU == your NFC tag ID
    if (!tagId) continue;

    // a) Upsert garment metadata
    await db.collection("scholargarments").updateOne(
      { nfcTagId: tagId },
      {
        $set: {
          garmentName: item.title,
          price:       item.price,
          updatedAt:   new Date()
        },
        $setOnInsert: {
          nfcTagId:   tagId,
          createdAt:  new Date()
        }
      },
      { upsert: true }
    );

    // b) Record this purchase in its own collection
    await db.collection("garmentPurchases").insertOne({
      nfcTagId:    tagId,
      buyer,                    // who bought it
      quantity:    item.quantity,
      price:       item.price,
      purchasedAt: new Date()
    });

    processed++;
  }

  if (processed === 0) {
    return { statusCode: 404, body: "No items processed" };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Processed", count: processed })
  };
};
