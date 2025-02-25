const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const si = require('systeminformation');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/performance_monitor', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("MongoDB Connected"))
  .catch(err => console.error("MongoDB Connection Error:", err));

// Define Mongoose schema for performance data
const PerformanceSchema = new mongoose.Schema({
  cpuUsage: Number,
  memoryUsage: Number,
  timestamp: { type: Date, default: Date.now }
});
const Performance = mongoose.model('Performance', PerformanceSchema);

// Function to fetch performance data
const getPerformanceData = async () => {
  try {
    const cpuData = await si.currentLoad();
    const memData = await si.mem();

    const cpuUsage = cpuData.currentLoad || 0; // Get correct CPU usage
    const memoryUsage = ((memData.total - memData.available) / memData.total) * 100;

    return { cpuUsage, memoryUsage };
  } catch (error) {
    console.error("Error fetching performance data:", error);
    return { cpuUsage: 0, memoryUsage: 0 };
  }
};

// WebSocket connection event
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Emit performance data every 5 seconds
setInterval(async () => {
  try {
    const data = await getPerformanceData();
    console.log("Emitting Performance Data:", data); // Debug log

    // Save to MongoDB
    const performanceEntry = new Performance(data);
    await performanceEntry.save();

    // Emit data to frontend
    io.emit('performanceData', data);
  } catch (error) {
    console.error("Error during data emission:", error);
  }
}, 5000);

// Start the server
const PORT = 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
