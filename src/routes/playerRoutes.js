// src/routes/playerRoutes.js

const express = require('express');
const router = express.Router();
const { validateVirtualLabsToken } = require('../middleware/virtualLabsAuth');
const PlayerChethController = require('../controllers/PlayerChethController');

router.post('/createPlayer', validateVirtualLabsToken, PlayerChethController.createPlayer);

module.exports = router;
