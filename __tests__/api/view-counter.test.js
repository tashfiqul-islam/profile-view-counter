const request = require('supertest');
const { MongoClient } = require('mongodb');
const { MongoMemoryServer } = require('mongodb-memory-server');
const makeApp = require('../../api/view-counter');

// This suite tests the API endpoints of the view-counter application
describe('API /view-counter Tests', () => {
  let mongoServer;
  let client;
  let app;

  // Set up an in-memory MongoDB instance before running tests
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    client = new MongoClient(uri);
    await client.connect();

    // Initialize the app with a test database client
    app = makeApp(client);
  });

  // Clean up and close MongoDB connection after tests are complete
  afterAll(async () => {
    await client.close();
    await mongoServer.stop();
  });

  // Test for successful view count increment and badge URL generation
  test('increments view count and returns badge URL for valid username', async () => {
    const username = 'testuser';
    const response = await request(app)
      .get('/api/view-counter')
      .query({ username });
    expect(response.status).toBe(302);

    // Check if the response redirects to the correct badge URL
    const badgeUrlRegex =
      /^https:\/\/custom-icon-badges\.demolab\.com\/static\/v1\?.*/;
    expect(response.headers.location).toMatch(badgeUrlRegex);

    // Verify the view count in the database
    const db = client.db('githubViews');
    const result = await db.collection('viewCounts').findOne({ username });
    expect(result).not.toBeNull();
    expect(result.views).toBe(1);

    // Additional logging for debugging purposes
    const allDocuments = await db.collection('viewCounts').find({}).toArray();
  });

  // Test for handling missing username parameter
  test('returns 400 Bad Request for missing username', async () => {
    const response = await request(app).get('/api/view-counter');
    expect(response.status).toBe(400);
  });

  // Test for handling concurrent requests correctly
  test('handles concurrent requests correctly', async () => {
    const username = 'concurrentUser';
    const requestCount = 5;

    // Send multiple concurrent requests
    const promises = Array.from({ length: requestCount }, () =>
      request(app).get('/api/view-counter').query({ username }),
    );

    const responses = await Promise.all(promises);
    responses.forEach((response) => {
      expect(response.status).toBe(302);
      expect(response.headers.location).toMatch(
        /^https:\/\/custom-icon-badges\.demolab\.com\/static\/v1\?.*/,
      );
    });

    // Verify that the view count matches the number of requests sent
    const db = client.db('githubViews');
    const result = await db.collection('viewCounts').findOne({ username });
    expect(result.views).toBe(requestCount);
  });
});
