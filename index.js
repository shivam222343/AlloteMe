require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Import route files
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');
const syncRoutes = require('./routes/syncRoutes');
const authRoutes = require('./routes/auth');
const savedRoutes = require('./routes/saved');
const collegeRoutes = require('./routes/colleges');
const bannerRoutes = require('./routes/banners');
const predictionRoutes = require('./routes/prediction');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path} from ${req.ip}`);
    next();
});

// Database Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/getcounsel', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

// API Routes
app.use('/api/auth', authRoutes);                    // Authentication (register, login, logout)
app.use('/api/user', authRoutes);                    // User profile (get, update)
app.use('/api/user/saved', savedRoutes);             // Saved colleges
app.use('/api/colleges', collegeRoutes);             // College list, filters, details
app.use('/api/banners', bannerRoutes);               // Home banners
app.use('/api/ai', predictionRoutes);                // AI predictions
app.use('/api/export', predictionRoutes);            // Export predictions

// Legacy routes (keep for backward compatibility)
app.use('/api/admin', adminRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/cutoffs', require('./routes/cutoffRoutes'));

// Health check
app.get('/', (req, res) => {
    res.json({
        message: 'AlloteMe API is running',
        version: '2.0.0',
        endpoints: {
            auth: '/api/auth',
            colleges: '/api/colleges',
            saved: '/api/user/saved',
            predictions: '/api/ai/predict',
            banners: '/api/banners'
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
});

// Listen on all network interfaces
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📱 Access from phone: http://192.168.0.102:${PORT}`);
    console.log(`💻 Local access: http://localhost:${PORT}`);
});
