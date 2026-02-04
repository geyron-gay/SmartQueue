const Redis = require('ioredis');
require('dotenv').config();

const redisConfig = {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || null,
};

// This instance is for general database tasks
const redis = new Redis(redisConfig);

// This instance is strictly for listening (Subscribing) to Laravel
const subRedis = new Redis(redisConfig);

console.log('✅ Redis Configuration Loaded');

module.exports = { redis, subRedis };