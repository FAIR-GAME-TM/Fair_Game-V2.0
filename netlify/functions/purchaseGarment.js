// netlify/functions/purchaseGarment.js
const connectDB = require("./db");
const crypto   = require("crypto");
require("dotenv").config();
const fetch    = require("node-fetch");

exports.handler = async (event) => {
  // 1) Only POST
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const rawBody    = event.body;
  const hmacHeader = event.headers["x-shopify-hmac-sha256"];
  const secret     = process.env.SHOPIFY_WEBHOOK_SECRET;
  const ourHmac    = crypto.createHmac("sha256", secret)
                           .update(rawBody, "utf8")
                           .digest("base64");
  if (ourHmac !== hmacHeader) {
    return { statusCode: 401, body: "Unauthorized" };
  }

  let order;
  try {
    order = JSON.parse(rawBody);
  } catch {
    return { statusCode: 400, body: "Invalid JSON" };
  }

  const buyerEmail = order.customer?.email;
  if (!buyerEmail) {
    return { statusCode: 400, body: "Missing customer email" };
  }

  // 2) Lookup your user by email → get username
  const db  = await connectDB();
  const usr = await db.collection("users").findOne({ email: buyerEmail });
  if (!usr) {
    return { statusCode: 400, body: "No matching user" };
  }
  const buyer = usr.username;

  // 3) Upsert each line item, then fetch its metafields
  let updated = 0;
  for (let item of order.line_items) {
    const tagId = item.sku;        // assume SKU == NFC tag ID
    if (!tagId) continue;

    // Upsert core info
    await db.collection("scholargarments").updateOne(
      { nfcTagId: tagId },
      {
        $set: {
          owner: buyer,
          garmentName: item.title,
          price: item.price,
          quantity: item.quantity,
          updatedAt: new Date()
        },
        $setOnInsert: { createdAt: new Date() }
      },
      { upsert: true }
    );
    updated++;

    // 4) Fetch **Shopify metafields** for this product
    //     so we can store e.g. fabricType, fabricGSM, etc.
    const graphql = `
      query getMetafields($id: ID!) {
        product(id: $id) {
          metafields(namespace:"custom", first:10) {
            edges { node {
              key
              value
              type
            } }
          }
        }
      }
    `;
    // We need the product GraphQL ID. Shopify order payload
    // includes `admin_graphql_api_id` like "gid://shopify/Product/12345"
    const productGid = order.admin_graphql_api_id;
    // Call the storefront API
    const resp = await fetch(
      `https://${process.env.SHOPIFY_STORE_DOMAIN}/api/${process.env.SHOPIFY_API_VERSION}/graphql.json`,
      {
        method: "POST",
        headers: {
          "X-Shopify-Storefront-Access-Token": process.env.SHOPIFY_STOREFRONT_TOKEN,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ query: graphql, variables: { id: productGid } })
      }
    );
    const { data } = await resp.json();
    const metaList = data?.product?.metafields?.edges || [];

    // Merge them into Mongo
    const setFields = {};
    for (let { node } of metaList) {
      setFields[node.key] = node.value;
    }
    if (Object.keys(setFields).length) {
      await db.collection("scholargarments").updateOne(
        { nfcTagId: tagId },
        { $set: setFields }
      );
    }
  }

  if (updated === 0) {
    return { statusCode: 404, body: "No items updated" };
  }
  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Processed", count: updated })
  };
};
