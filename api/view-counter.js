const { MongoClient } = require('mongodb');
const { generateBadge } = require('../badgeGenerator');
const config = require('../config');

let client;
let db;

// Connects to the MongoDB database
async function connectToDatabase() {
    if (!client || !client.isConnected()) {
        client = new MongoClient(config.mongodb.uri, { useNewUrlParser: true, useUnifiedTopology: true });
        await client.connect();
        db = client.db('githubViews');
    }
}

// Updates the view count in the database
async function updateViewCount(collection, username) {
    return await collection.findOneAndUpdate(
        { username },
        { $inc: { views: 1 } },
        { upsert: true, returnDocument: 'after' }
    );
}

// Main serverless function to handle requests
module.exports = async (req, res) => {
    try {
        const { username } = req.query;
        if (!username) {
            return res.status(400).send('Username is required');
        }

        await connectToDatabase();
        const collection = db.collection('viewCounts');
        const result = await updateViewCount(collection, username);

        if (result && 'views' in result) {
            const count = result.views;
            const badgeSvg = generateBadge('PROFILE VISITORS', count);
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
               .setHeader('Content-Type', 'image/svg+xml')
               .send(badgeSvg);
        } else {
            console.error('Document not found or upsert failed:', result);
            res.status(404).send('Unable to update view count');
        }
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).send('Server Error');
    }
};