const express = require('express');
const router = express.Router();
const lichessController = require('../controllers/lichessController');

router.get('/lichess/:lichessHandle', lichessController.getLichessUserInfo);
router.post('/lichess/challenge', lichessController.initiateLichessChallenge);

module.exports = router;