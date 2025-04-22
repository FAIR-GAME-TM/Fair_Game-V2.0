// netlify/functions/login.js
const connectDB = require("./db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const { username, password } = JSON.parse(event.body);
  if (!username || !password) {
    return { statusCode: 400, body: "Username and password are required." };
  }

  try {
    const db   = await connectDB();
    const user = await db.collection("users").findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return { statusCode: 401, body: "Invalid username or password." };
    }

    // 1. Create a JWT valid for (say) 1h
    const token = jwt.sign(
      { username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // 2. Return it in an HttpOnly cookie
    return {
      statusCode: 200,
      headers: {
        "Set-Cookie": `token=${token}; HttpOnly; Path=/; Secure; SameSite=Strict`,
      },
      body: JSON.stringify({ message: "Login successful!" }),
    };
  } catch (error) {
    console.error("Error logging in:", error);
    return { statusCode: 500, body: "Internal server error." };
  }
};
