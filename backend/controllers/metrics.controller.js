const os = require("os-utils");
const mongoose = require("mongoose");
const Query = require("../model/query.model");

let totalQueries = 0;
let failedQueries = 0;

const getMetrics = async (req, res) => {
  totalQueries++;
  // Assume authentication middleware sets req.user.id
//   const userId = req.user && req.user.id;
const userId="68c4f8b56da2a2d491814336";;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const start = Date.now();
  try {
    const { collection, pipeline } = req.body;
    let aggPipeline = pipeline;
    if (typeof aggPipeline === "string") {
      aggPipeline = JSON.parse(aggPipeline);
    }
    const dbCollection = mongoose.connection.collection(collection);
    await dbCollection.aggregate(aggPipeline).toArray();
  } catch (err) {
    failedQueries++;
  }
  const latencyMs = Date.now() - start;

  os.cpuUsage(async (cpu) => {
    const memory = (1 - os.freemem() / os.totalmem()) * 100;
    const errorRate = totalQueries > 0 ? failedQueries / totalQueries : 0;

    // Store metric with userId
    
    // Fetch last 50 metrics for this user
    const history = await Query.find({ userId: userId })
    .sort({ timestamp: -1 })
    .limit(50)
    .lean();
    
    // Current metric object
    const currentMetrics = {
      latency_ms: latencyMs,
      cpu: cpu * 100,
      memory: memory,
      error_rate: errorRate,
    };
    
    // Run anomaly detection
    const anomalies = anomalyDetection(currentMetrics, history);
    await Query.create({
      userId: userId,
      latency_ms: latencyMs,
      cpu: cpu * 100,
      memory: memory,
      error_rate: errorRate,
      collection: req.body.collection,
      pipeline: req.body.pipeline,
      result:anomalies,
      timestamp: new Date()
    });

    res.json({
      timestamp: new Date().toISOString(),
      latency_ms: latencyMs, // latency in milliseconds
      cpu: (cpu * 100).toFixed(2), // % of CPU is busy
      memory: memory.toFixed(2), // % of memory in use (RAM)
      error_rate: errorRate.toFixed(4),
      anomalies: anomalies,
      metrics: currentMetrics,
    });
  });
};

function mean(arr) {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function stddev(arr) {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  const variance = arr.reduce((a, b) => a + Math.pow(b - m, 2), 0) / arr.length;
  return Math.sqrt(variance);
}

const anomalyDetection = (metrics, history) => {
  // history: array of previous metric docs
  const anomalies = [];
  // Prepare arrays for each metric
  const latencyArr = history.map(m => m.latency_ms).filter(Number.isFinite);
  const cpuArr = history.map(m => m.cpu).filter(Number.isFinite);
  const memoryArr = history.map(m => m.memory).filter(Number.isFinite);
  const errorRateArr = history.map(m => m.error_rate).filter(Number.isFinite);

  // Compute mean and stddev
  const stats = {
    latency_ms: { mu: mean(latencyArr), sigma: stddev(latencyArr) },
    cpu: { mu: mean(cpuArr), sigma: stddev(cpuArr) },
    memory: { mu: mean(memoryArr), sigma: stddev(memoryArr) },
    error_rate: { mu: mean(errorRateArr), sigma: stddev(errorRateArr) },
  };

  // Check for anomalies: value > mean + 2*stddev
  if (metrics.cpu > stats.cpu.mu + 2 * stats.cpu.sigma) {
    anomalies.push({
      metric: "cpu",
      value: metrics.cpu,
      mean: stats.cpu.mu,
      stddev: stats.cpu.sigma,
      message: "CPU usage is significantly higher than normal (above μ + 2σ)",
    });
  }
  if (metrics.memory > stats.memory.mu + 2 * stats.memory.sigma) {
    anomalies.push({
      metric: "memory",
      value: metrics.memory,
      mean: stats.memory.mu,
      stddev: stats.memory.sigma,
      message: "Memory usage is significantly higher than normal (above μ + 2σ)",
    });
  }
  if (metrics.error_rate > stats.error_rate.mu + 2 * stats.error_rate.sigma) {
    anomalies.push({
      metric: "error_rate",
      value: metrics.error_rate,
      mean: stats.error_rate.mu,
      stddev: stats.error_rate.sigma,
      message: "Error rate is significantly higher than normal (above μ + 2σ)",
    });
  }
  if (metrics.latency_ms > stats.latency_ms.mu + 2 * stats.latency_ms.sigma) {
    anomalies.push({
      metric: "latency_ms",
      value: metrics.latency_ms,
      mean: stats.latency_ms.mu,
      stddev: stats.latency_ms.sigma,
      message: "Latency is significantly higher than normal (above μ + 2σ)",
    });
  }
  return anomalies;
};

module.exports = { getMetrics };