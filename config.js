require('dotenv').config();

// Environment variable validation
const validateEnvVar = (varName) => {
    const value = process.env[varName];
    if (!value) {
        throw new Error(`Environment variable ${varName} is required but not set.`);
    }
    return value;
};

// Configuration settings for the application
const config = {
    // MongoDB configuration
    mongodb: {
        // MongoDB URI, ensure not to hardcode sensitive data
        uri: validateEnvVar('MONGODB_URI'),
    },
    // Server configuration
    server: {
        // Server port
        port: parseInt(validateEnvVar('PORT'), 10) || 3000,
    },
    // Rate limiting configuration to prevent abuse
    rateLimit: {
        windowMs: 60 * 1000, // Time window in milliseconds (1 minute)
        max: 100 // Maximum number of requests per IP in the window
    }
};

module.exports = config;
