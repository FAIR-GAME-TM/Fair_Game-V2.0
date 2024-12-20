const connectDB = require("./db");

exports.handler = async () => {
  try {
    const db = await connectDB();
    const collection = db.collection("users");
    const users = await collection.find({}).toArray();

    return {
      statusCode: 200,
      body: JSON.stringify(users),
    };
  } catch (error) {
    console.error("Error fetching users:", error.message);
    return { statusCode: 500, body: "Internal server error." };
  }
};
