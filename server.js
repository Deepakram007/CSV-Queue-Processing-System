const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { addCsvJob, csvQueue } = require('./queue');

// Bonus: Optional Bull Board for monitoring
let serverAdapter, createBullBoard, BullMQAdapter;
try {
   const bullBoardExpress = require('@bull-board/express'); 
   const bullBoardApi = require('@bull-board/api');
   const bullBoardBullMQ = require('@bull-board/api/bullMQAdapter');
   createBullBoard = bullBoardApi.createBullBoard;
   BullMQAdapter = bullBoardBullMQ.BullMQAdapter;
   serverAdapter = new bullBoardExpress.ExpressAdapter();
   serverAdapter.setBasePath('/admin/queues');
} catch (e) {
   // Bull board not installed, ignore
}

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Set up Multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

// Bonus: Add basic validation for file type (CSV only)
const fileFilter = (req, file, cb) => {
  // Check MIME type or extension
  if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only CSV files are allowed.'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

// Error handling middleware for Multer
const uploadMiddleware = (req, res, next) => {
  const uploadSingle = upload.single('csvFile');
  uploadSingle(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: err.message });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
};

// Route: POST /upload
app.post('/upload', uploadMiddleware, async (req, res) => {
  try {
    const file = req.file;
    const email = req.body.email;

    if (!file) {
      return res.status(400).json({ error: 'Please upload a CSV file.' });
    }

    if (!email) {
      // Clean up uploaded file if email is missing
      fs.unlinkSync(file.path);
      return res.status(400).json({ error: 'Email is required.' });
    }

    // Add job to the queue
    const job = await addCsvJob(file.path, email);

    res.status(202).json({
      message: 'File uploaded successfully and added to the processing queue.',
      jobId: job.id,
      filePath: file.path,
      email: email
    });
  } catch (error) {
    console.error('Error in /upload:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Route to get job status
app.get('/job/:id', async (req, res) => {
  try {
    const job = await csvQueue.getJob(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    const state = await job.getState();
    const progress = job.progress;
    const reason = job.failedReason;

    res.json({ id: job.id, state, progress, reason });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching job status.' });
  }
});

// Setup Bull Board if available
if (createBullBoard && serverAdapter) {
  createBullBoard({
    queues: [new BullMQAdapter(csvQueue)],
    serverAdapter: serverAdapter,
  });
  app.use('/admin/queues', serverAdapter.getRouter());
  console.log(`BullMQ dashboard is available at http://localhost:${PORT}/admin/queues`);
}

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
