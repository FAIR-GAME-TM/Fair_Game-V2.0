require("dotenv").config();
const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://fairgameAdmin:fAIRGAMEISCOOL2024@fairgamecluster.dli7d.mongodb.net/?retryWrites=true&w=majority&appName=FairGameCluster";

exports.handler = async (event, context) => {
    let client;

    try {
        //Connect to MongoDB
        client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
        await client.connect();

        //Access database and collection
        const db = client.db("Fair_Game");
        const collection = db.collection("users");

        //Fetch data from MongoDB
        const items = await collection.find({}).toArray();

        //Return the fetched data
        return {
            statusCode: 200,
            body: JSON.stringify(items),
        };
    } catch (error) {
        console.error("MongoDB connection error:", error.message);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Failed to fetch data"}),
        };
    } finally {
        if (client) await client.close();
    }
};