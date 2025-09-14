const mongoose = require("mongoose");

const DatabaseConnectionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  connectionName: {
    type: String,
    required: true
  },
  databaseType: {
    type: String,
    enum: ['mongodb', 'mysql', 'postgresql', 'sqlite'],
    required: true
  },
  connectionString: {
    type: String,
    required: true
  },
  host: String,
  port: Number,
  databaseName: String,
  username: String,
  isActive: {
    type: Boolean,
    default: true
  },
  lastConnected: {
    type: Date,
    default: Date.now
  },
  connectionMetadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

DatabaseConnectionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("DatabaseConnection", DatabaseConnectionSchema);
