const express = require('express');
const router = express.Router();
const cryptoController = require('../controllers/CryptoController');

router.get('/ethToUsd', cryptoController.getEthToUsd);

module.exports = router;