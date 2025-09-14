const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api/external-db';
const USER_ID = '507f1f77bcf86cd799439011'; // Sample user ID

async function testMultiDatabase() {
  try {
    console.log('🚀 Testing Multi-Database Connection System\n');

    // 1. Create a database connection
    console.log('1. Creating database connection...');
    const connectionResponse = await axios.post(`${BASE_URL}/users/${USER_ID}/connections`, {
      connectionName: 'Test MongoDB',
      databaseType: 'mongodb',
      connectionString: 'mongodb://localhost:27017/test_db',
      host: 'localhost',
      port: 27017,
      databaseName: 'test_db',
      username: 'test_user'
    });
    
    const connectionId = connectionResponse.data.data.connectionId;
    console.log('✅ Connection created:', connectionId);

    // 2. Get user connections
    console.log('\n2. Getting user connections...');
    const connectionsResponse = await axios.get(`${BASE_URL}/users/${USER_ID}/connections`);
    console.log('✅ User connections:', connectionsResponse.data.data.length);

    // 3. Execute a find query
    console.log('\n3. Executing find query...');
    const findResponse = await axios.post(`${BASE_URL}/users/${USER_ID}/connections/${connectionId}/query`, {
      query: '{"status": "active"}',
      queryType: 'find',
      collection: 'users'
    });
    console.log('✅ Find query executed:', findResponse.data.resultCount, 'results');

    // 4. Execute an aggregation query
    console.log('\n4. Executing aggregation query...');
    const aggResponse = await axios.post(`${BASE_URL}/users/${USER_ID}/connections/${connectionId}/query`, {
      query: '[{"$match": {"status": "active"}}, {"$count": "total"}]',
      queryType: 'aggregate',
      collection: 'users'
    });
    console.log('✅ Aggregation query executed:', aggResponse.data.resultCount, 'results');

    // 5. Get connection statistics
    console.log('\n5. Getting connection statistics...');
    const statsResponse = await axios.get(`${BASE_URL}/users/${USER_ID}/connections/${connectionId}/stats`);
    console.log('✅ Connection stats:', statsResponse.data.data.totalQueries, 'total queries');

    // 6. Get query history
    console.log('\n6. Getting query history...');
    const historyResponse = await axios.get(`${BASE_URL}/users/${USER_ID}/queries`);
    console.log('✅ Query history:', historyResponse.data.data.pagination.total, 'total queries');

    // 7. Get analytics
    console.log('\n7. Getting analytics...');
    const analyticsResponse = await axios.get(`${BASE_URL}/users/${USER_ID}/analytics`);
    console.log('✅ Analytics:', analyticsResponse.data.data.summary.totalQueries, 'total queries');

    console.log('\n🎉 All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testMultiDatabase();
