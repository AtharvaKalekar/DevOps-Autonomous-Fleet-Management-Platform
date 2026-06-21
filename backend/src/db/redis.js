const { createClient } = require('redis');
require('dotenv').config();

const client = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

client.on('error', (err) => console.error('Redis Client Error', err));
client.on('connect', () => console.log('Connecting to Redis...'));
client.on('ready', () => console.log('Redis Client Ready'));

async function initRedis() {
  try {
    await client.connect();
    console.log('Connected to Redis successfully.');
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
    throw error;
  }
}

module.exports = {
  client,
  initRedis,
};
