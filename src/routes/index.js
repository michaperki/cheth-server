// routes/index.js (Main router for all routes)
const express = require('express');
const router = express.Router();

// Import all routes
const gameRoutes = require('./gameRoutes');
const userRoutes = require('./userRoutes');
const sessionRoutes = require('./sessionRoutes');
const utilityRoutes = require('./utilityRoutes');
const cryptoRoutes = require('./cryptoRoutes');

// Use all routes
router.use('/user', userRoutes);
router.use('/game', gameRoutes);
router.use('/session', sessionRoutes);
router.use('/utility', utilityRoutes);
router.use('/crypto', cryptoRoutes);

module.exports = router;
