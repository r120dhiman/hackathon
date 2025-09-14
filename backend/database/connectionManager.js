const mongoose = require('mongoose');
const DatabaseConnection = require('../model/databaseConnection.model');

class ConnectionManager {
  constructor() {
    this.connections = new Map(); // Store active connections
    this.connectionMetadata = new Map(); // Store connection metadata
  }

  // Create a new database connection
  async createConnection(userId, connectionData) {
    try {
      const { connectionName, databaseType, connectionString, host, port, databaseName, username } = connectionData;
      
      // Create mongoose connection
      let connection;
      if (databaseType === 'mongodb') {
        connection = mongoose.createConnection(connectionString);
      } else {
        throw new Error(`Database type ${databaseType} not yet supported`);
      }

      // Wait for connection to be ready
      await new Promise((resolve, reject) => {
        connection.once('open', resolve);
        connection.once('error', reject);
      });

      // Store connection in database
      const dbConnection = new DatabaseConnection({
        userId,
        connectionName,
        databaseType,
        connectionString,
        host,
        port,
        databaseName,
        username,
        connectionMetadata: {
          collections: await this.getCollections(connection),
          indexes: await this.getIndexes(connection)
        }
      });

      await dbConnection.save();

      // Store in memory for quick access
      const connectionKey = `${userId}_${dbConnection._id}`;
      this.connections.set(connectionKey, connection);
      this.connectionMetadata.set(connectionKey, dbConnection);

      return {
        connectionId: dbConnection._id,
        connectionName,
        status: 'connected',
        metadata: dbConnection.connectionMetadata
      };

    } catch (error) {
      console.error('Error creating connection:', error);
      throw error;
    }
  }

  // Get user's connections
  async getUserConnections(userId) {
    try {
      const connections = await DatabaseConnection.find({ 
        userId, 
        isActive: true 
      }).sort({ createdAt: -1 });
      
      return connections.map(conn => ({
        connectionId: conn._id,
        connectionName: conn.connectionName,
        databaseType: conn.databaseType,
        databaseName: conn.databaseName,
        lastConnected: conn.lastConnected,
        isActive: conn.isActive
      }));
    } catch (error) {
      console.error('Error getting user connections:', error);
      throw error;
    }
  }

  // Get active connection
  getConnection(userId, connectionId) {
    const connectionKey = `${userId}_${connectionId}`;
    return this.connections.get(connectionKey);
  }

  // Execute query on user's database
  async executeQuery(userId, connectionId, queryData) {
    const startTime = Date.now();
    let connection, connectionMetadata;
    
    try {
      // Get connection
      const connectionKey = `${userId}_${connectionId}`;
      connection = this.connections.get(connectionKey);
      connectionMetadata = this.connectionMetadata.get(connectionKey);

      if (!connection) {
        // Try to reconnect
        const dbConnection = await DatabaseConnection.findById(connectionId);
        if (!dbConnection || dbConnection.userId.toString() !== userId.toString()) {
          throw new Error('Connection not found or unauthorized');
        }
        
        connection = mongoose.createConnection(dbConnection.connectionString);
        await new Promise((resolve, reject) => {
          connection.once('open', resolve);
          connection.once('error', reject);
        });
        
        this.connections.set(connectionKey, connection);
        this.connectionMetadata.set(connectionKey, dbConnection);
        connectionMetadata = dbConnection;
      }

      // Execute query based on type
      let result;
      const { query, queryType, collection, database } = queryData;

      let parsedQuery = query;
      if (typeof query === "string") {
        parsedQuery = JSON.parse(query);
      }

      switch (queryType) {
        case 'find':
          result = await connection.db.collection(collection).find(parsedQuery).toArray();
          break;
        case 'aggregate':
          result = await connection.db.collection(collection).aggregate(parsedQuery).toArray();
          break;
        case 'insert':
          result = await connection.db.collection(collection).insertMany(parsedQuery);
          break;
        case 'update':
          result = await connection.db.collection(collection).updateMany(parsedQuery.filter, parsedQuery.update);
          break;
        case 'delete':
          result = await connection.db.collection(collection).deleteMany(parsedQuery);
          break;
        default:
          throw new Error(`Unsupported query type: ${queryType}`);
      }

      const executionTime = Date.now() - startTime;

      // Update last connected time
      await DatabaseConnection.findByIdAndUpdate(connectionId, { lastConnected: new Date() });

      return {
        success: true,
        result,
        executionTime,
        resultCount: Array.isArray(result) ? result.length : result.modifiedCount || result.insertedCount || result.deletedCount || 0
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error('Query execution error:', error);
      
      return {
        success: false,
        error: error.message,
        executionTime
      };
    }
  }

  // Close connection
  async closeConnection(userId, connectionId) {
    try {
      const connectionKey = `${userId}_${connectionId}`;
      const connection = this.connections.get(connectionKey);
      
      if (connection) {
        await connection.close();
        this.connections.delete(connectionKey);
        this.connectionMetadata.delete(connectionKey);
      }

      // Mark as inactive in database
      await DatabaseConnection.findByIdAndUpdate(connectionId, { isActive: false });
      
      return { success: true, message: 'Connection closed successfully' };
    } catch (error) {
      console.error('Error closing connection:', error);
      throw error;
    }
  }

  // Get collections for MongoDB
  async getCollections(connection) {
    try {
      const collections = await connection.db.listCollections().toArray();
      return collections.map(col => ({
        name: col.name,
        type: col.type
      }));
    } catch (error) {
      console.error('Error getting collections:', error);
      return [];
    }
  }

  // Get indexes for MongoDB
  async getIndexes(connection) {
    try {
      const collections = await connection.db.listCollections().toArray();
      const indexes = {};
      
      for (const collection of collections) {
        const collectionIndexes = await connection.db.collection(collection.name).indexes();
        indexes[collection.name] = collectionIndexes;
      }
      
      return indexes;
    } catch (error) {
      console.error('Error getting indexes:', error);
      return {};
    }
  }

  // Get connection statistics
  async getConnectionStats(userId, connectionId) {
    try {
      const connectionKey = `${userId}_${connectionId}`;
      const connectionMetadata = this.connectionMetadata.get(connectionKey);
      
      if (!connectionMetadata) {
        throw new Error('Connection not found');
      }

      // Get recent query executions
      const QueryExecution = require('../model/queryExecution.model');
      const recentQueries = await QueryExecution.find({
        userId,
        connectionId
      }).sort({ executedAt: -1 }).limit(10);

      const stats = {
        connectionInfo: {
          connectionName: connectionMetadata.connectionName,
          databaseType: connectionMetadata.databaseType,
          databaseName: connectionMetadata.databaseName,
          lastConnected: connectionMetadata.lastConnected
        },
        recentQueries: recentQueries.map(q => ({
          query: q.query,
          queryType: q.queryType,
          executionTime: q.executionTime,
          status: q.status,
          executedAt: q.executedAt
        })),
        totalQueries: await QueryExecution.countDocuments({ userId, connectionId }),
        averageExecutionTime: await QueryExecution.aggregate([
          { $match: { userId, connectionId, status: 'success' } },
          { $group: { _id: null, avgTime: { $avg: '$executionTime' } } }
        ])
      };

      return stats;
    } catch (error) {
      console.error('Error getting connection stats:', error);
      throw error;
    }
  }
}

// Singleton instance
const connectionManager = new ConnectionManager();
module.exports = connectionManager;
