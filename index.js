const express = require('express');
const { MongoClient } = require('mongodb');
const rateLimit = require('express-rate-limit');
const config = require('./config');
const { generateBadge } = require('./badgeGenerator');

const app = express();
const client = new MongoClient(config.mongodb.uri);

app.use(rateLimit(config.rateLimit));

// Route for handling view counts
app.get('/view-counter', async (req, res) => {
    const { username } = req.query;

    if (!username) {
        return res.status(400).send('Username is required');
    }

    try {
        await client.connect();
        const db = client.db('githubViews');
        const collection = db.collection('viewCounts');

        const result = await collection.findOneAndUpdate(
            { username },
            { $inc: { views: 1 } },
            { upsert: true, returnDocument: 'after' }
        );

        if (result && 'views' in result) {
            const count = result.views;
            const badgeSvg = generateBadge('PROFILE VISITORS', count);

            res.set('Cache-Control', 'no-cache, no-store, must-revalidate')
               .set('Content-Type', 'image/svg+xml')
               .send(badgeSvg);
        } else {
            console.error('Document not found or upsert failed:', result);
            res.status(404).send('Unable to update view count');
        }
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).send('Server Error');
    } finally {
        await client.close();
    }
});

// Server Initialization
app.listen(config.server.port, () => {
    console.log(`Server running on http://localhost:${config.server.port}`);
});