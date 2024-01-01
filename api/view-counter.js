const express = require('express');
const { MongoClient } = require('mongodb');
const { generateBadge } = require('../badgeGenerator');
const config = require('../config');

// Initialize Express application
const app = express();

// Declare MongoDB client and database variables
let client;
let db;

// Function to establish a connection to the MongoDB database
async function connectToDatabase() {
    // Connect only if the client is not already initialized
    if (!client) {
        client = new MongoClient(config.mongodb.uri);
        await client.connect();
        db = client.db('githubViews');
    }
}

// Function to increment the view count in the database
async function incrementViewCount(username) {
    const collection = db.collection('viewCounts');
    return await collection.findOneAndUpdate(
        { username },
        { $inc: { views: 1 } },
        { upsert: true, returnDocument: 'after' }
    );
}

// Express route handler for '/api/view-counter'
app.get('/api/view-counter', async (req, res) => {
    try {
        // Extract username from query parameters
        const { username } = req.query;
        if (!username) {
            return res.status(400).send('Username is required');
        }

        // Ensure database connection is established
        await connectToDatabase();

        // Increment view count and fetch result
        const result = await incrementViewCount(username);

        // Send badge SVG if result is valid
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
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Start the server on the specified port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;