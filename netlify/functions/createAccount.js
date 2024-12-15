const { MongoClient } = require("mongodb");
const bcrypt = require("bcrypt");

const uri = "mongodb+srv://fairgameAdmin:fAIRGAMEISCOOL2024@fairgamecluster.dli7d.mongodb.net/?retryWrites=true&w=majority&appName=FairGameCluster";

exports.handler = async (event, context) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const { username, password } = JSON.parse(event.body);

  if (!username || !password) {
    return { statusCode: 400, body: "Username and password are required." };
  }

  const hashedPassword = await bcrypt.hash(password, 10); // Hash the password for security

  try {
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    await client.connect();

    const db = client.db("Fair_Game");
    const collection = db.collection("users");

    // Check if the username already exists
    const existingUser = await collection.findOne({ username });
    if (existingUser) {
      return { statusCode: 400, body: "Username already exists." };
    }

    // Insert the new user into the database
    const result = await collection.insertOne({ username, password: hashedPassword });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Account created successfully!", userId: result.insertedId }),
    };
  } catch (error) {
    return { statusCode: 500, body: `Server error: ${error.message}` };
  }
};
