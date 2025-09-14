const QueryExecution = require('../model/queryExecution.model');
const os = require('os');

// Middleware to track query executions
const trackQueryExecution = async (req, res, next) => {
  const originalSend = res.send;
  const startTime = Date.now();

  res.send = function(data) {
    const executionTime = Date.now() - startTime;
    
    // Only track if this is a query execution endpoint
    if (req.route && req.route.path.includes('/query')) {
      trackQuery(req, res, executionTime, data).catch(console.error);
    }
    
    originalSend.call(this, data);
  };

  next();
};

async function trackQuery(req, res, executionTime, responseData) {
  try {
    const { userId, connectionId } = req.params;
    const { query, queryType, collection, database } = req.body;

    // Get system metrics
    const systemMetrics = {
      cpu: process.cpuUsage().user / 1000000, // Convert to seconds
      memory: process.memoryUsage().heapUsed / 1024 / 1024, // Convert to MB
      latency: executionTime
    };

    // Determine status based on response
    let status = 'success';
    let errorMessage = null;
    let resultCount = 0;

    try {
      const response = JSON.parse(responseData);
      if (response.success === false) {
        status = 'error';
        errorMessage = response.error;
      } else if (response.result) {
        if (Array.isArray(response.result)) {
          resultCount = response.result.length;
        } else if (response.result.modifiedCount !== undefined) {
          resultCount = response.result.modifiedCount;
        } else if (response.result.insertedCount !== undefined) {
          resultCount = response.result.insertedCount;
        } else if (response.result.deletedCount !== undefined) {
          resultCount = response.result.deletedCount;
        }
      }
    } catch (parseError) {
      status = 'error';
      errorMessage = 'Invalid response format';
    }

    // Create query execution record
    const queryExecution = new QueryExecution({
      userId,
      connectionId,
      query: typeof query === 'string' ? query : JSON.stringify(query),
      queryType,
      collection,
      database,
      executionTime,
      status,
      resultCount,
      errorMessage,
      systemMetrics,
      queryMetadata: {
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        timestamp: new Date()
      }
    });

    await queryExecution.save();
  } catch (error) {
    console.error('Error tracking query execution:', error);
  }
}

module.exports = { trackQueryExecution };
