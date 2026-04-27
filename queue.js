const { Queue } = require('bullmq');
const IORedis = require('ioredis');

// Redis connection configuration
const connection = new IORedis({
  host: '127.0.0.1',
  port: 6379,
  maxRetriesPerRequest: null, // Required by BullMQ
});

// Create a new Queue
const csvQueue = new Queue('csv-processing', { connection });

/**
 * Adds a new job to the CSV processing queue
 * @param {string} filePath - The path to the uploaded CSV file
 * @param {string} email - User's email to notify after processing
 */
async function addCsvJob(filePath, email) {
  const job = await csvQueue.add('process-csv', { filePath, email }, {
    attempts: 3, // Retry mechanism: 3 attempts
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: 100, // Keep last 100 completed jobs for UI history
    removeOnFail: false, // Keep failed jobs for inspection
  });
  
  return job;
}

module.exports = {
  csvQueue,
  addCsvJob,
  connection
};
