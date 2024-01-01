const { MongoClient } = require('mongodb');
const { generateBadge } = require('../badgeGenerator');
const config = require('../config');

let client;
let db;

// Connect to the MongoDB database with error handling
async function connectToDatabase() {
    if (!client || !client.isConnected()) {
        try {
            client = new MongoClient(config.mongodb.uri, { useNewUrlParser: true, useUnifiedTopology: true });
            await client.connect();
            db = client.db('githubViews');
        } catch (error) {
            console.error('Failed to connect to database:', error);
            throw new Error('Database connection failed');
        }
    }
}

// Increment the view count and handle potential errors
async function incrementViewCount(username) {
    try {
        const collection = db.collection('viewCounts');
        return await collection.findOneAndUpdate(
            { username },
            { $inc: { views: 1 } },
            { upsert: true, returnDocument: 'after' }
        );
    } catch (error) {
        console.error('Failed to increment view count:', error);
        throw new Error('Failed to update view count');
    }
}

// Send the badge as an SVG response
async function sendBadgeResponse(res, username) {
    const result = await incrementViewCount(username);

    if (result && 'views' in result) {
        const badgeSvg = generateBadge('PROFILE VISITORS', result.views);
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, proxy-revalidate')
           .setHeader('Pragma', 'no-cache')
           .setHeader('Expires', '0')
           .setHeader('Content-Type', 'image/svg+xml')
           .send(badgeSvg);
    } else {
        res.status(404).send('User not found or view count not updated');
    }
}

// Serverless function to handle badge requests
module.exports = async (req, res) => {
    try {
        const { username } = req.query;
        if (!username) {
            return res.status(400).send('Username is required');
        }

        await connectToDatabase();
        await sendBadgeResponse(res, username);
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).send('Internal Server Error');
    }
};