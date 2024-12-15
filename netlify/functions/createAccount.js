const connectDB = require("./db");
const bcrypt = require("bcrypt");

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

    // Check if the username already exists
    const existingUser = await collection.findOne({ username });
    if (existingUser) {
      return { statusCode: 400, body: "Username already exists." };
    }

    // Hash the password and insert the new user
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await collection.insertOne({ username, password: hashedPassword });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Account created successfully!", userId: result.insertedId }),
    };
  } catch (error) {
    console.error("Error creating account:", error.message);
    return { statusCode: 500, body: "Internal server error." };
  }
};
