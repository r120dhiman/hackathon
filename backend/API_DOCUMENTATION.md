# Multi-Database Connection API Documentation

## Overview
This API allows users to connect multiple external databases and execute queries while tracking performance metrics and storing query history in the main application database.

## Base URL
```
http://localhost:3001/api/external-db
```

## Authentication
All endpoints require a valid user ID in the URL path.

## Endpoints

### 1. Create Database Connection
**POST** `/users/:userId/connections`

Creates a new connection to an external database.

**Request Body:**
```json
{
  "connectionName": "My MongoDB",
  "databaseType": "mongodb",
  "connectionString": "mongodb://username:password@host:port/database",
  "host": "localhost",
  "port": 27017,
  "databaseName": "my_database",
  "username": "my_user"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Database connection created successfully",
  "data": {
    "connectionId": "64a1b2c3d4e5f6789012345",
    "connectionName": "My MongoDB",
    "status": "connected",
    "metadata": {
      "collections": [...],
      "indexes": {...}
    }
  }
}
```

### 2. Get User Connections
**GET** `/users/:userId/connections`

Retrieves all active database connections for a user.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "connectionId": "64a1b2c3d4e5f6789012345",
      "connectionName": "My MongoDB",
      "databaseType": "mongodb",
      "databaseName": "my_database",
      "lastConnected": "2023-12-01T10:30:00Z",
      "isActive": true
    }
  ]
}
```

### 3. Execute Query
**POST** `/users/:userId/connections/:connectionId/query`

Executes a query on the specified database connection.

**Request Body:**
```json
{
  "query": "{\"name\": \"John\"}",
  "queryType": "find",
  "collection": "users",
  "database": "my_database"
}
```

**Query Types:**
- `find`: Find documents
- `aggregate`: Aggregation pipeline
- `insert`: Insert documents
- `update`: Update documents (requires filter and update objects)
- `delete`: Delete documents

**Response:**
```json
{
  "success": true,
  "data": [...],
  "executionTime": 45,
  "resultCount": 5,
  "error": null
}
```

### 4. Get Connection Statistics
**GET** `/users/:userId/connections/:connectionId/stats`

Retrieves detailed statistics and monitoring data for a connection.

**Response:**
```json
{
  "success": true,
  "data": {
    "connectionInfo": {
      "connectionName": "My MongoDB",
      "databaseType": "mongodb",
      "databaseName": "my_database",
      "lastConnected": "2023-12-01T10:30:00Z"
    },
    "recentQueries": [...],
    "totalQueries": 150,
    "averageExecutionTime": 35.5
  }
}
```

### 5. Get Query History
**GET** `/users/:userId/queries`

Retrieves query execution history with pagination and filtering.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Results per page (default: 10)
- `connectionId`: Filter by connection ID
- `queryType`: Filter by query type
- `status`: Filter by status (success/error/timeout)

**Response:**
```json
{
  "success": true,
  "data": {
    "queries": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 150,
      "pages": 15
    }
  }
}
```

### 6. Get Database Analytics
**GET** `/users/:userId/analytics`

Retrieves comprehensive analytics and performance metrics.

**Query Parameters:**
- `days`: Number of days to analyze (default: 7)

**Response:**
```json
{
  "success": true,
  "data": {
    "dailyAnalytics": [...],
    "topCollections": [...],
    "summary": {
      "totalQueries": 1500,
      "avgExecutionTime": 35.5,
      "successRate": 98.5
    }
  }
}
```

### 7. Close Connection
**DELETE** `/users/:userId/connections/:connectionId`

Closes and deactivates a database connection.

**Response:**
```json
{
  "success": true,
  "message": "Connection closed successfully"
}
```

## Query Examples

### MongoDB Find Query
```json
{
  "query": "{\"age\": {\"$gte\": 18}}",
  "queryType": "find",
  "collection": "users"
}
```

### MongoDB Aggregation Query
```json
{
  "query": "[{\"$match\": {\"status\": \"active\"}}, {\"$group\": {\"_id\": \"$category\", \"count\": {\"$sum\": 1}}}]",
  "queryType": "aggregate",
  "collection": "products"
}
```

### MongoDB Insert Query
```json
{
  "query": "[{\"name\": \"John\", \"age\": 30}, {\"name\": \"Jane\", \"age\": 25}]",
  "queryType": "insert",
  "collection": "users"
}
```

### MongoDB Update Query
```json
{
  "query": "{\"filter\": {\"name\": \"John\"}, \"update\": {\"$set\": {\"age\": 31}}}",
  "queryType": "update",
  "collection": "users"
}
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message description"
}
```

Common HTTP status codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `500`: Internal Server Error

## Features

### Query Tracking
- All queries are automatically tracked with execution time
- System metrics (CPU, memory) are recorded
- Query results and error messages are stored
- User metadata (IP, user agent) is captured

### Connection Management
- Multiple concurrent database connections per user
- Automatic reconnection on query execution
- Connection metadata and statistics
- Graceful connection closure

### Monitoring & Analytics
- Real-time query performance monitoring
- Historical analytics and trends
- Collection-level statistics
- Success/failure rate tracking

### Security
- User-scoped connections (users can only access their own connections)
- Input validation and sanitization
- Error handling without exposing sensitive information
