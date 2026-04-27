const { Worker } = require('bullmq');
const IORedis = require('ioredis');
const fs = require('fs');
const csv = require('csv-parser');
const { sendCompletionEmail } = require('./email');

// Redis connection configuration
const connection = new IORedis({
  host: '127.0.0.1',
  port: 6379,
  maxRetriesPerRequest: null,
});

/**
 * Process a CSV file and return the total number of rows.
 * @param {string} filePath - Path to the CSV file
 * @param {function} updateProgress - Callback to update job progress
 * @returns {Promise<number>} Total number of rows processed
 */
function processCsvFile(filePath, updateProgress) {
  return new Promise((resolve, reject) => {
    let rowCount = 0;

    // Optional: Get file size for more accurate progress
    let fileStats;
    try {
      fileStats = fs.statSync(filePath);
    } catch(err) {
      return reject(new Error('File not found: ' + filePath));
    }
    let bytesRead = 0;

    const stream = fs.createReadStream(filePath);
    
    stream.on('data', chunk => {
        bytesRead += chunk.length;
        const progress = Math.min(Math.round((bytesRead / fileStats.size) * 100), 99); // max 99% until fully done
        updateProgress(progress).catch(() => {});
    });

    stream
      .pipe(csv())
      .on('data', (data) => {
        rowCount++;
        // Simulate row processing or logging
        // console.log(`Processing row ${rowCount}:`, data);
      })
      .on('end', () => {
        resolve(rowCount);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

// Create worker
const worker = new Worker('csv-processing', async (job) => {
  const { filePath, email } = job.data;
  console.log(`[Job ${job.id}] Started processing file: ${filePath}`);

  try {
    // Process the CSV
    const totalRows = await processCsvFile(filePath, async (progress) => {
      await job.updateProgress(progress);
    });

    await job.updateProgress(100);
    console.log(`[Job ${job.id}] Finished reading CSV. Total rows: ${totalRows}`);

    // Send email notification
    console.log(`[Job ${job.id}] Sending notification to ${email}...`);
    await sendCompletionEmail(email, totalRows);

    // Clean up file after processing
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`[Job ${job.id}] Cleaned up file: ${filePath}`);
    }

    return { totalRows, status: 'success' };
  } catch (error) {
    console.error(`[Job ${job.id}] Error processing file:`, error.message);
    throw error; // Let BullMQ handle retries
  }
}, { connection });

worker.on('completed', (job, returnvalue) => {
  console.log(`[Job ${job.id}] successfully completed with ${returnvalue.totalRows} rows.`);
});

worker.on('failed', (job, err) => {
  console.log(`[Job ${job.id}] has failed with error ${err.message}`);
});

console.log('Worker is running and listening to "csv-processing" queue...');
