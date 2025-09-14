const express=require('express');
const cors=require('cors');
const {connectDB} = require('./database/DB.database');
require('dotenv').config();
const metricRouter = require('./routes/metrics.route');
const userRouter = require('./routes/user.route');
const dashboardRouter = require('./routes/dashboard.route');
const databaseRouter = require('./routes/database.route');

const app=express();
const PORT=process.env.PORT || 3001;
const DATABASE_URL = process.env.DATABASE_URL || 'mongodb://localhost:27017/hackthon';

// Middleware
app.use(cors({
    origin: '*',
}));
app.use(express.json());

// Connect to Database
connectDB(DATABASE_URL);

// Sample Route
app.get('/', (req, res) => {
  res.send('API is running...');
});

// API Routes
app.use('/api/database', metricRouter);
app.use('/api/auth', userRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/external-db', databaseRouter);

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
