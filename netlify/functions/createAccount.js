const connectDB = require("./db");
const bcrypt = require("bcrypt");
require("dotenv").config();

exports.handler = async (event, context) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  // Extract username, email, and password from the request body
  const { username, email, password } = JSON.parse(event.body);

  // Check if all required fields are provided
  if (!username || !email || !password) {
    return { statusCode: 400, body: "Username, email, and password are required." };
  }

  try {
    const db = await connectDB();
    const collection = db.collection("users");

    // Check if a user with the same username or email already exists
    const existingUser = await collection.findOne({
      $or: [{ username }, { email }]
    });
    if (existingUser) {
      return { statusCode: 400, body: "Username or email already exists." };
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert the new user document with username, email, and hashed password
    const result = await collection.insertOne({ username, email, password: hashedPassword });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Account created successfully!", userId: result.insertedId })
    };
  } catch (error) {
    console.error("Error creating account:", error.message);
    return { statusCode: 500, body: "Internal server error." };
  }
};
