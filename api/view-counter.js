const express = require('express');
const { MongoClient } = require('mongodb');
const { generateBadge } = require('../badgeGenerator');
const config = require('../config');

// Initialize Express application
const app = express();

// MongoDB client and database variables
let client;
let db;

// Connect to MongoDB database
async function connectToDatabase() {
  if (!client) {
    client = new MongoClient(config.mongodb.uri);
    await client.connect();
    db = client.db('githubViews');
  }
}

// Increment view count for a given username
async function incrementViewCount(username) {
  const collection = db.collection('viewCounts');
  return await collection.findOneAndUpdate(
    { username },
    { $inc: { views: 1 } },
    { upsert: true, returnDocument: 'after' },
  );
}

// Route to handle view count requests
app.get('/api/view-counter', async (req, res) => {
  try {
    const { username } = req.query;
    if (!username) return res.status(400).send('Username is required');

    await connectToDatabase();
    const result = await incrementViewCount(username);

    // Redirect to generated badge URL
    if (result && 'views' in result) {
      const badgeUrl = generateBadge(result.views);
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
         .setHeader('Pragma', 'no-cache')
         .setHeader('Expires', '0')
         .redirect(badgeUrl);
    } else {
      res.status(404).send('User not found or view count not updated');
    }
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Start server on configured port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;