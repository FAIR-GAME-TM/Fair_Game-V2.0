const connectDB = require("./db");
const bcrypt = require("bcrypt");
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

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Login successful!" }),
    };
  } catch (error) {
    console.error("Error logging in:", error.message);
    return { statusCode: 500, body: "Internal server error." };
  }
};
