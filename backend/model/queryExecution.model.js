const mongoose = require("mongoose");

const QueryExecutionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  connectionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DatabaseConnection',
    required: true
  },
  query: {
    type: String,
    required: true
  },
  queryType: {
    type: String,
    enum: ['find', 'insert', 'update', 'delete', 'aggregate', 'raw'],
    required: true
  },
  collection: String,
  database: String,
  executionTime: {
    type: Number, // in milliseconds
    required: true
  },
  status: {
    type: String,
    enum: ['success', 'error', 'timeout'],
    required: true
  },
  resultCount: Number,
  errorMessage: String,
  systemMetrics: {
    cpu: Number,
    memory: Number,
    latency: Number
  },
  queryMetadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  executedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("QueryExecution", QueryExecutionSchema);
