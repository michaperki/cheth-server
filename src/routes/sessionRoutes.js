const express = require('express');
const router = express.Router();
const SessionController = require('../controllers/sessionController');

router.get('/getBalance', SessionController.getSessionBalance);
router.post('/deposit', SessionController.depositToSession);
router.post('/createSession', SessionController.createSession);
router.post('/finishSession', SessionController.finishSession);

module.exports = router;
