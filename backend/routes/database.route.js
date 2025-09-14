const express = require('express');
const router = express.Router();
const databaseController = require('../controllers/database.controller');
const { trackQueryExecution } = require('../middlewares/queryTracker');
const { authenticateToken } = require('../middlewares/jwt.middleware');

// Database connection routes
router.post('/users/:userId/connections', authenticateToken, databaseController.createConnection);
router.get('/users/:userId/connections', databaseController.getUserConnections);
router.delete('/users/:userId/connections/:connectionId', databaseController.closeConnection);

// Query execution routes (with tracking middleware)
router.post('/users/:userId/connections/:connectionId/query', 
  trackQueryExecution, 
  databaseController.executeQuery
);

// Monitoring and analytics routes
router.get('/users/:userId/connections/:connectionId/stats', databaseController.getConnectionStats);
router.get('/users/:userId/queries', databaseController.getQueryHistory);
router.get('/users/:userId/analytics', databaseController.getDatabaseAnalytics);

module.exports = router;
