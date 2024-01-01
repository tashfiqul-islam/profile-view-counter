const express = require('express');
const { MongoClient } = require('mongodb');
const { generateBadge } = require('../badgeGenerator');
const config = require('../config');

const app = express();
let client;
let db;

async function connectToDatabase() {
    if (!client || !client.isConnected()) {
        client = new MongoClient(config.mongodb.uri);
        await client.connect();
        db = client.db('githubViews');
    }
}

async function incrementViewCount(username) {
    const collection = db.collection('viewCounts');
    return await collection.findOneAndUpdate(
        { username },
        { $inc: { views: 1 } },
        { upsert: true, returnDocument: 'after' }
    );
}

app.get('/api/view-counter', async (req, res) => {
    try {
        const { username } = req.query;
        if (!username) {
            return res.status(400).send('Username is required');
        }
        await connectToDatabase();
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
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).send('Internal Server Error');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;