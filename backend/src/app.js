const express = require('express');
const cors = require('cors');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const orderRoutes = require('./routes/orderRoutes');
const transferRoutes = require('./routes/transferRoutes');
const returnRoutes = require('./routes/returnRoutes');
const adjustmentRoutes = require('./routes/adjustmentRoutes');
const vendorRoutes = require('./routes/vendorRoutes');
const locationRoutes = require('./routes/locationRoutes');
const reportRoutes = require('./routes/reportRoutes');
const userRoutes = require('./routes/userRoutes');
const trashRoutes = require('./routes/trashRoutes');

const app = express();

// Middlewares
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/returns', returnRoutes);
app.use('/api/adjustments', adjustmentRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);
app.use('/api/trash', trashRoutes);

// Error Handling
app.use(notFound);
app.use(errorHandler);

module.exports = app;
