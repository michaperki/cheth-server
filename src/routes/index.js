// routes/index.js (Main router for all routes)
const express = require('express');
const router = express.Router();

// Import all routes
const gameRoutes = require('./gameRoutes');
const userRoutes = require('./userRoutes');
const utilityRoutes = require('./utilityRoutes');
const cryptoRoutes = require('./cryptoRoutes');
const playerRoutes = require('./playerRoutes');

// Use all routes
router.use('/user', userRoutes);
router.use('/game', gameRoutes);
router.use('/utility', utilityRoutes);
router.use('/crypto', cryptoRoutes);
router.use('/player', playerRoutes);

module.exports = router;
