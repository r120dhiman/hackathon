const connectionManager = require('../database/connectionManager');
const QueryExecution = require('../model/queryExecution.model');

// Create a new database connection
const createConnection = async (req, res) => {
  try {
    const { userId } = req.params;
    const { connectionName, databaseType, connectionString, host, port, databaseName, username } = req.body;

    if (!connectionName || !databaseType || !connectionString) {
      return res.status(400).json({ 
        success: false, 
        error: 'Connection name, database type, and connection string are required' 
      });
    }

    const result = await connectionManager.createConnection(userId, {
      connectionName,
      databaseType,
      connectionString,
      host,
      port,
      databaseName,
      username
    });

    res.status(201).json({
      success: true,
      message: 'Database connection created successfully',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get user's database connections
const getUserConnections = async (req, res) => {
  try {
    const { userId } = req.params;
    const connections = await connectionManager.getUserConnections(userId);
    
    res.status(200).json({
      success: true,
      data: connections
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Execute query on user's database
const executeQuery = async (req, res) => {
  try {
    const { userId, connectionId } = req.params;
    const { query, queryType, collection, database } = req.body;
    console.log("REQ BODY:", req.body);
    let parsedQuery = query;
    if (typeof query === "string") {
      try {
        parsedQuery = JSON.parse(query);
      } catch (err) {
        return res.status(400).json({
          success: false,
          error: "Invalid JSON in query"
        });
      }
    }
    if (!parsedQuery || !queryType || !collection) {
      return res.status(400).json({
        success: false,
        error: 'Query, queryType, and collection are required'
      });
    }

    console.log("Executing query with:", {
      query: parsedQuery,
      queryType,
      collection,
      database
    });
    const result = await connectionManager.executeQuery(userId, connectionId, {
      query: parsedQuery,
      queryType,
      collection,
      database
    });

    res.status(200).json({
      success: result.success,
      data: result.result,
      executionTime: result.executionTime,
      resultCount: result.resultCount,
      error: result.error
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get connection statistics and monitoring data
const getConnectionStats = async (req, res) => {
  try {
    const { userId, connectionId } = req.params;
    const stats = await connectionManager.getConnectionStats(userId, connectionId);
    
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Close database connection
const closeConnection = async (req, res) => {
  try {
    const { userId, connectionId } = req.params;
    const result = await connectionManager.closeConnection(userId, connectionId);
    
    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get query execution history
const getQueryHistory = async (req, res) => {
  try {
    const { userId, connectionId } = req.params;
    const { page = 1, limit = 10, queryType, status } = req.query;

    const filter = { userId };
    if (connectionId) filter.connectionId = connectionId;
    if (queryType) filter.queryType = queryType;
    if (status) filter.status = status;

    const skip = (page - 1) * limit;
    
    const queries = await QueryExecution.find(filter)
      .populate('connectionId', 'connectionName databaseName')
      .sort({ executedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await QueryExecution.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        queries,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get database analytics
const getDatabaseAnalytics = async (req, res) => {
  try {
    const { userId } = req.params;
    const { days = 7 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Get analytics data
    const analytics = await QueryExecution.aggregate([
      {
        $match: {
          userId: require('mongoose').Types.ObjectId(userId),
          executedAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$executedAt' } },
            status: '$status'
          },
          count: { $sum: 1 },
          avgExecutionTime: { $avg: '$executionTime' },
          totalExecutionTime: { $sum: '$executionTime' }
        }
      },
      {
        $group: {
          _id: '$_id.date',
          totalQueries: { $sum: '$count' },
          successfulQueries: {
            $sum: {
              $cond: [{ $eq: ['$_id.status', 'success'] }, '$count', 0]
            }
          },
          failedQueries: {
            $sum: {
              $cond: [{ $eq: ['$_id.status', 'error'] }, '$count', 0]
            }
          },
          avgExecutionTime: { $avg: '$avgExecutionTime' },
          totalExecutionTime: { $sum: '$totalExecutionTime' }
        }
      },
      {
        $sort: { '_id': 1 }
      }
    ]);

    // Get top collections by query count
    const topCollections = await QueryExecution.aggregate([
      {
        $match: {
          userId: require('mongoose').Types.ObjectId(userId),
          executedAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$collection',
          queryCount: { $sum: 1 },
          avgExecutionTime: { $avg: '$executionTime' }
        }
      },
      {
        $sort: { queryCount: -1 }
      },
      {
        $limit: 10
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        dailyAnalytics: analytics,
        topCollections,
        summary: {
          totalQueries: analytics.reduce((sum, day) => sum + day.totalQueries, 0),
          avgExecutionTime: analytics.reduce((sum, day) => sum + day.avgExecutionTime, 0) / analytics.length,
          successRate: analytics.reduce((sum, day) => sum + (day.successfulQueries / day.totalQueries), 0) / analytics.length * 100
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  createConnection,
  getUserConnections,
  executeQuery,
  getConnectionStats,
  closeConnection,
  getQueryHistory,
  getDatabaseAnalytics
};
