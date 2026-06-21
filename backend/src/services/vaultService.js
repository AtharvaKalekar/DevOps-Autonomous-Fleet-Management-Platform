const http = require('http');
require('dotenv').config();

const VAULT_ADDR = process.env.VAULT_ADDR || 'http://vault:8200';
const VAULT_TOKEN = process.env.VAULT_TOKEN || 'myroottoken';
const SECRET_PATH = '/v1/secret/data/fleet-config';

// Helper function to make JSON HTTP requests using Node's native http module
function makeRequest(url, options = {}, postData = null) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const reqOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      headers: {
        'X-Vault-Token': VAULT_TOKEN,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    const req = http.request(reqOptions, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: body ? JSON.parse(body) : null,
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (postData) {
      req.write(JSON.stringify(postData));
    }
    req.end();
  });
}

async function loadSecrets() {
  console.log(`[Vault] Connecting to HashiCorp Vault at ${VAULT_ADDR}...`);
  try {
    const url = `${VAULT_ADDR}${SECRET_PATH}`;
    const response = await makeRequest(url, { method: 'GET' });

    if (response.statusCode === 200) {
      const data = response.body?.data?.data;
      if (data && data.DATABASE_URL && data.REDIS_URL) {
        console.log('[Vault] Successfully loaded database credentials from Vault.');
        process.env.DATABASE_URL = data.DATABASE_URL;
        process.env.REDIS_URL = data.REDIS_URL;
        return;
      }
    }

    if (response.statusCode === 404) {
      console.log('[Vault] Secrets not found in Vault. Bootstrapping Vault KV store...');
      // Initialize Vault with current process.env credentials or fallback defaults
      const payload = {
        data: {
          DATABASE_URL: process.env.DATABASE_URL || 'postgresql://admin:admin123@postgres:5432/fleetdb',
          REDIS_URL: process.env.REDIS_URL || 'redis://redis:6379',
        },
      };
      const writeResponse = await makeRequest(url, { method: 'POST' }, payload);
      if (writeResponse.statusCode === 200 || writeResponse.statusCode === 204) {
        console.log('[Vault] Successfully bootstrapped credentials in Vault.');
        process.env.DATABASE_URL = payload.data.DATABASE_URL;
        process.env.REDIS_URL = payload.data.REDIS_URL;
      } else {
        console.warn(`[Vault] Failed to bootstrap credentials (status: ${writeResponse.statusCode}). Falling back to local env.`);
      }
      return;
    }

    console.warn(`[Vault] Unexpected status code ${response.statusCode} from Vault. Falling back to local env.`);
  } catch (error) {
    console.warn(`[Vault] Unable to connect to Vault (${error.message}). Falling back to local env.`);
  }
}

module.exports = {
  loadSecrets,
};
