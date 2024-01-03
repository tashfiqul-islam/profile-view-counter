const express = require('express');
const { MongoClient } = require('mongodb');
const { generateBadge } = require('../badgeGenerator');
const config = require('../config');

function makeApp(dbClient) {
  const app = express();

  let client = dbClient || new MongoClient(config.mongodb.uri);
  let db;

  async function connectToDatabase() {
    if (!client) {
      client = new MongoClient(config.mongodb.uri);
    }

    // Connect if not already connected
    if (!db) {
      await client.connect();
      db = client.db('githubViews');
    }
  }

  // Increment view count for a given username
  async function incrementViewCount(username) {
    const collection = db.collection('viewCounts');
    const result = await collection.findOneAndUpdate(
      { username },
      { $inc: { views: 1 } },
      { upsert: true, returnDocument: 'after' },
    );

    return result;
  }

  // Route to handle view count requests
  app.get('/api/view-counter', async (req, res) => {
    try {
      const { username } = req.query;
      if (!username) {
        return res.status(400).send('Username is required');
      }

      await connectToDatabase();
      const updatedDocument = await incrementViewCount(username);

      if (updatedDocument && 'views' in updatedDocument) {
        const badgeUrl = generateBadge(updatedDocument.views);
        res
          .setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
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

  // Export the app for testing purposes
  return app;
}

// Start the server only if this module is not required by another module (i.e., during testing).
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  const app = makeApp();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = makeApp;
