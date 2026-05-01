# CSV Queue Processing System

A full-stack application designed to efficiently process large CSV files in the background. Built with **React**, **Node.js**, **Express**, **BullMQ**, and **Redis**, this system features a robust, scalable architecture with real-time job processing, streaming file parsing, email notifications, and a dedicated frontend dashboard for monitoring.

## Features

- **Asynchronous File Upload:** Secure and quick file acceptance via an Express `/upload` endpoint using `multer`.
- **Validation:** Automatic mimetype verification to strictly accept CSV datasets.
- **Robust Queue Mechanism:** Redis-backed BullMQ setup specifically structured to handle retries, job isolation, and concurrency.
- **Streaming Parsing:** The background worker parses CSV rows using filesystem streams (`fs.createReadStream`) with `csv-parser` instead of loading the entire file into RAM, ensuring 100% stability on massive files.
- **Micro-Progress Updates:** Realtime progress (0-100%) tracking by dynamically recalculating streamed file sizes against current read buffer bites. 
- **Automatic Cleanup:** Safely unlinks and deletes files off the `uploads/` volume automatically after completion to conserve storage.
- **Email Notification:** Includes an Ethereal Mock-SMTP (via Nodemailer) implementation to broadcast "success" events with row compilation statistics to target users.
- **Interactive React Frontend:** A responsive user interface for uploading CSVs, tracking job progress via live polling, viewing real-time job statistics, and filtering job states.
- **Monitoring Dashboard (Bonus):** Live integrated BullMQ Dashboard accessible inside the web server.

## Technology Stack

- **Frontend Interface:** [React](https://react.dev/), [Vite](https://vitejs.dev/)
- **Backend API:** [Node.js](https://nodejs.org/), [Express.js](https://expressjs.com/)
- **Job Queues:** [BullMQ](https://docs.bullmq.io/)
- **Data Store / Queue Broker:** [Redis](https://redis.io/)
- **File Parsing & Management:** [multer](https://github.com/expressjs/multer), [csv-parser](https://github.com/mafintosh/csv-parser)
- **Notification Service:** [Nodemailer](https://nodemailer.com/)

---

## Installation & Setup

1. **Clone or Verify the directory**
Navigate to the project root in your terminal.

2. **Install all dependencies:**
For the backend server:
```bash
npm install
```
For the frontend client:
```bash
cd client
npm install
cd ..
```

3. **Deploy a local instance of Redis.**
BullMQ requires an active Redis cluster. An easy way to spin one up locally is with Docker:
```bash
docker run -p 6379:6379 -d redis
```

---

## How to Run the Project

This system incorporates three operational services: one for receiving API requests, a detached worker exclusively allocated to compute jobs off the queue, and a React frontend for the user interface.

**1. Start the Express API Server**
Open a terminal and run the main server script:
```bash
npm run start
```
The server will now be listening closely on `http://localhost:3000`.

**2. Start the Background Consumer Worker**
Launch a completely separate / second terminal inside the exact same project directory, and initialize the background worker process:
```bash
npm run worker
```

**3. Start the React Frontend**
Launch a third terminal, navigate to the `client` directory, and start the development server:
```bash
cd client
npm run dev
```
The frontend application will be available at `http://localhost:5173`.

---

## Endpoints

### `POST /upload`
Submits a `.csv` dataset onto the Node pipeline.

- **Payload format**: `multipart/form-data`
- **Fields**:
  - `email` *(Text)*: The notification email target.
  - `csvFile` *(File)*: The active CSV to be computed.

```bash
# Example Request Syntax using cURL
curl -X POST http://localhost:3000/upload \
  -F "email=demo@example.com" \
  -F "csvFile=@/path/to/local/data.csv"
```

### `GET /job/:id`
Fetch the present completion statistics of a particular computation job.

---

## Monitoring Dashboard 
As an added bonus, to verify the functionality of system failures, job resets, latency, active throughput, and progress tracking, you can use the interactive visual analyzer.

Open a web browser and go to:
[http://localhost:3000/admin/queues](http://localhost:3000/admin/queues)
