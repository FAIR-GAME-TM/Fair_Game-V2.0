// netlify/functions/purchaseGarment.js
const connectDB = require("./db");
const crypto   = require("crypto");
require("dotenv").config();
const fetch    = require("node-fetch");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const rawBody    = event.body;
  const hmacHeader = event.headers["x-shopify-hmac-sha256"];
  const ourHmac    = crypto
    .createHmac("sha256", process.env.SHOPIFY_WEBHOOK_SECRET)
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

  const db  = await connectDB();
  const usr = await db.collection("users").findOne({ email: buyerEmail });
  if (!usr) {
    return { statusCode: 400, body: "No matching user" };
  }
  const buyer = usr.username;

  let updated = 0;
  for (const item of order.line_items) {
    const tagId = item.sku;  // SKU == NFC tag ID
    if (!tagId) continue;

    // 1) Upsert the core order info
    await db.collection("scholargarments").updateOne(
      { nfcTagId: tagId },
      {
        $set: {
          owner:       buyer,
          garmentName: item.title,
          price:       item.price,
          quantity:    item.quantity,
          updatedAt:   new Date()
        },
        $setOnInsert: { createdAt: new Date() }
      },
      { upsert: true }
    );
    updated++;

    // 2) Build the GID for the product
    const productGid = item.admin_graphql_api_id
      || `gid://shopify/Product/${item.product_id}`;

    // 3) Fetch your `custom` metafields via the **Admin** GraphQL API
    const adminEndpoint =
      `https://${process.env.SHOPIFY_STORE_DOMAIN}` +
      `/admin/api/${process.env.SHOPIFY_API_VERSION}/graphql.json`;

    const metafieldQuery = `
      query getMetafields($id: ID!) {
        product(id: $id) {
          metafields(namespace: "custom", first: 20) {
            edges { node { key value } }
          }
        }
      }
    `;

    const resp = await fetch(adminEndpoint, {
      method: "POST",
      headers: {
        "Content-Type":       "application/json",
        "X-Shopify-Access-Token": process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN
      },
      body: JSON.stringify({
        query:     metafieldQuery,
        variables: { id: productGid }
      })
    });

    if (!resp.ok) {
      console.error("Shopify Admin API error", await resp.text());
      continue;
    }

    const { data, errors } = await resp.json();
    if (errors) {
      console.error("GraphQL errors:", errors);
    }

    // 4) Merge them into Mongo
    const edges = data?.product?.metafields?.edges || [];
    const setFields = {};
    for (const { node } of edges) {
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
