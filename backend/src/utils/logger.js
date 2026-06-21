const net = require('net');

const originalLog = console.log;
const originalError = console.error;

let logstashClient = null;
let isConnecting = false;

const LOGSTASH_HOST = process.env.LOGSTASH_HOST || 'logstash';
const LOGSTASH_PORT = parseInt(process.env.LOGSTASH_PORT, 10) || 5000;

function connectLogstash() {
  if (logstashClient || isConnecting) return;

  isConnecting = true;
  const client = new net.Socket();

  client.connect(LOGSTASH_PORT, LOGSTASH_HOST, () => {
    isConnecting = false;
    logstashClient = client;
    originalLog(`[Logger] Connected to Logstash at ${LOGSTASH_HOST}:${LOGSTASH_PORT}`);
  });

  client.on('error', (err) => {
    // Fail silently, retry will occur in close event
    isConnecting = false;
    logstashClient = null;
  });

  client.on('close', () => {
    isConnecting = false;
    logstashClient = null;
    // Retry connection after 10 seconds
    setTimeout(connectLogstash, 10000);
  });
}

// Connect to Logstash if running in production/Docker or explicitly enabled
if (process.env.NODE_ENV === 'production' || process.env.DATABASE_URL?.includes('postgres')) {
  connectLogstash();
}

function sendToLogstash(level, args) {
  const message = args
    .map((arg) => (typeof arg === 'object' ? JSON.stringify(arg) : arg))
    .join(' ');

  const payload = {
    timestamp: new Date().toISOString(),
    level,
    service: 'fleet-backend',
    message,
  };

  if (logstashClient && !logstashClient.destroyed) {
    try {
      logstashClient.write(JSON.stringify(payload) + '\n');
    } catch (err) {
      // Fallback
    }
  }
}

console.log = (...args) => {
  originalLog(...args);
  sendToLogstash('INFO', args);
};

console.error = (...args) => {
  originalError(...args);
  sendToLogstash('ERROR', args);
};

module.exports = {
  originalLog,
  originalError,
};
