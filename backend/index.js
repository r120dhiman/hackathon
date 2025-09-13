const express=require('express');
const cors=require('cors');
const connectDB = require('./database/DB.database');
require('dotenv').config();
const metricRouter = require('./routes/metrics.route');
const userRouter = require('./routes/user.route');

const app=express();
const PORT=process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: '*',
}));
app.use(express.json());

// Connect to Database
connectDB();

// Sample Route
app.get('/', (req, res) => {
  res.send('API is running...');
});

app.use('/api/database', metricRouter);
app.use('/api/user', userRouter);

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});