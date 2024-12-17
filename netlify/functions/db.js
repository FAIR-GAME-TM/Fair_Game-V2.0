const { MongoClient } = require("mongodb");
require("dotenv").config();

let cachedClient = null; // Cache the MongoDB client
let cachedDb = null; // Cache the database instance

const uri = process.env.MONGODB_URI;

async function connectDB() {
  if (!uri) {
    throw new Error("Missing MongoDB connection string in environmental vaiables.");
  }
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
