const mongoose = require("mongoose");


const QuerySchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  latency_ms: Number,
  cpu: Number,
  memory: Number,
  error_rate: Number,
  timestamp: { type: Date, default: Date.now },
});


module.exports = mongoose.model("Query", QuerySchema);
