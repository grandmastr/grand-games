/* eslint-disable no-restricted-globals */
console.log('Log Generator Worker: Initializing...');

const generateLogEntry = (index) => {
  const LOG_LEVELS = ['info', 'warn', 'error'];
  const LOG_SOURCES = ['server', 'client', 'database', 'auth', 'api'];
  const SAMPLE_MESSAGES = [
    'Request processed successfully',
    'Connection timeout',
    'Invalid authentication token',
    'Database query completed',
    'Cache miss',
    'Rate limit exceeded',
    'Resource not found',
    'Service unavailable'
  ];

  // Use index to ensure deterministic but random-looking results
  const now = Date.now();
  const hash = (index * 2654435761) >>> 0; // Knuth's multiplicative hash
  
  return {
    id: `log-${index}`,
    timestamp: now - (hash % 86400000), // Random time within last 24 hours
    level: LOG_LEVELS[hash % LOG_LEVELS.length],
    source: LOG_SOURCES[Math.floor((hash / LOG_LEVELS.length) % LOG_SOURCES.length)],
    message: SAMPLE_MESSAGES[Math.floor((hash / (LOG_LEVELS.length * LOG_SOURCES.length)) % SAMPLE_MESSAGES.length)]
  };
};

console.log('Log Generator Worker: Ready to receive messages');

self.onmessage = (e) => {
  const { batchSize, startIndex } = e.data;
  console.log(`Worker: Generating ${batchSize} logs starting at index ${startIndex}`);
  
  try {
    const logs = Array.from({ length: batchSize }, (_, i) => 
      generateLogEntry(startIndex + i)
    );
    
    console.log(`Worker: Generated ${logs.length} logs successfully`);
    self.postMessage({ logs, startIndex });
  } catch (error) {
    console.error('Worker: Error generating logs:', error);
    self.postMessage({ 
      error: error.message,
      startIndex 
    });
  }
};
