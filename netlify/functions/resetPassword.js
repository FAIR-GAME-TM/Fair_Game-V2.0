// netlify/functions/resetPassword.js
const connectDB = require("./db");
const jwt       = require("jsonwebtoken");
const bcrypt    = require("bcrypt");
require("dotenv").config();

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  let { token, password } = {};
  try {
    ({ token, password } = JSON.parse(event.body));
  } catch {
    return { statusCode: 400, body: "Invalid request body" };
  }

  if (!token || !password) {
    return { statusCode: 400, body: "Token and new password are required" };
  }

  // 1) Verify the reset token
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_RESET_SECRET);
  } catch (err) {
    return { statusCode: 400, body: "Invalid or expired token" };
  }

  // 2) Hash the new password
  const hashed = await bcrypt.hash(password, 10);

  // 3) Update the user’s password in MongoDB
  const db = await connectDB();
  const result = await db
    .collection("users")
    .updateOne(
      { email: payload.email },
      { $set: { password: hashed } }
    );

  if (result.matchedCount === 0) {
    return { statusCode: 404, body: "User not found" };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Password has been reset" }),
  };
};
