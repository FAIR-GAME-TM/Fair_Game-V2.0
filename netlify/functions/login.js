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

  try {
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    await client.connect();

    const db = client.db("Fair_Game");
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
    return { statusCode: 500, body: `Server error: ${error.message}` };
  }
};
