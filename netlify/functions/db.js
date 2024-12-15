const { MongoClient } = require("mongodb");

let cachedClient = null; // Cache the MongoDB client
let cachedDb = null; // Cache the database instance

const uri = "mongodb+srv://fairgameAdmin:fAIRGAMEISCOOL2024@fairgamecluster.dli7d.mongodb.net/?retryWrites=true&w=majority&appName=FairGameCluster";

async function connectDB() {
  if (cachedDb) {
    console.log("Using cached database connection.");
    return cachedDb;
  }

  if (!cachedClient) {
    console.log("Creating new MongoDB client connection...");
    cachedClient = new MongoClient(uri);
    await cachedClient.connect();
  }

  cachedDb = cachedClient.db("Fair_Game");
  return cachedDb;
}

module.exports = connectDB;
