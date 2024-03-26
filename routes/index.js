// routes/index.js (Main router for all routes)
const express = require('express');
const router = express.Router();

// Import all routes
const userRoutes = require('./userRoutes');
const gameRoutes = require('./gameRoutes');
const utilityRoutes = require('./utilityRoutes');


// Use all routes
router.use('/user', userRoutes);
router.use('/game', gameRoutes);
router.use('/utility', utilityRoutes);

module.exports = router;
