const connectDB = require("./db");

exports.handler = async () => {
  try {
    const db = await connectDB();
    const collection = db.collection("scholargarments");
    const garments = await collection.find({}).toArray();

    return {
      statusCode: 200,
      body: JSON.stringify(garments),
    };
  } catch (error) {
    console.error("Error fetching garments:", error.message);
    return { statusCode: 500, body: "Internal server error." };
  }
};
