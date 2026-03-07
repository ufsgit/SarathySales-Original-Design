const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ───────────────────────────────────────────────────────────────

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const authMiddleware = require('./middleware/authMiddleware');
const authController = require('./controllers/authController');

// ─── Routes ───────────────────────────────────────────────────────────────────

// 1. Specific Public Routes (No Auth)
app.post('/api/auth/login', authController.login);
app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'Sarathy Sales API is running', timestamp: new Date().toISOString() });
});

// 2. Applied Middleware for all other /api routes
app.use('/api', authMiddleware);

// 3. Protected Routes
app.use('/api/auth', require('./routes/auth')); // For change-password
app.use('/api/branch', require('./routes/branch'));
app.use('/api/customer', require('./routes/customer'));
app.use('/api/money-receipt', require('./routes/moneyReceipt'));
app.use('/api/pay-slip', require('./routes/paySlip'));
app.use('/api/gate-pass', require('./routes/gatePass'));
app.use('/api/sales-invoice', require('./routes/salesInvoice'));
app.use('/api/proforma', require('./routes/proformaInvoice'));
app.use('/api/purchase-invoice', require('./routes/purchaseInvoice'));
app.use('/api/purchase-upload', require('./routes/purchaseUpload'));
app.use('/api/branch-transfer', require('./routes/branchTransfer'));
app.use('/api/vsi', require('./routes/vsi'));
app.use('/api/stock', require('./routes/stock'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/vehicle-enquiry', require('./routes/vehicleEnquiry'));
app.use('/api/invoice-from-proforma', require('./routes/invoiceFromProforma'));

// ─── 404 Handler ─────────────────────────────────────────────────────────────

app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` });
});

// ─── Global Error Handler ────────────────────────────────────────────────────

app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ success: false, message: err.message || 'Internal server error' });
});

// ─── Start Server ─────────────────────────────────────────────────────────────

app.listen(PORT, () => {
    console.log(`\n🚀 Sarathy Sales API Server started`);
    console.log(`📡 Listening on http://localhost:${PORT}`);
});

module.exports = app;
