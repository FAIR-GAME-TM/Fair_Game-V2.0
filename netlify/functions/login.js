const connectDB = require("./db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

exports.handler = async (event, context) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const { username, password } = JSON.parse(event.body);

  if (!username || !password) {
    return { statusCode: 400, body: "Username and password are required." };
  }

  try {
    const db = await connectDB();
    const collection = db.collection("users");

    // Find the user in the database
    const user = await collection.findOne({ username });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return { statusCode: 401, body: "Invalid username or password." };
    }

    //Sign a JWT
    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET || "default_secret_key",
      { expiresIn: "2h" }
    );

    // Set the token as an HTTP-only cookie
    return {
      statusCode: 200,
      headers: {
        "Set-Cookie": `token=${token}; HttpOnly; Path=/; Max-Age=${2 * 3600}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: "Login successful!" }),
    };
  } catch (error) {
    console.error("Error logging in:", error.message);
    return { statusCode: 500, body: "Internal server error." };
  }
};
