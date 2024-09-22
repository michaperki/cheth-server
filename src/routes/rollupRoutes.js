const express = require('express');
const router = express.Router();
const RollupController = require('../controllers/RollupController');

router.get('/balance', RollupController.getRollupBalance);
router.post('/deposit', RollupController.depositToRollup);
router.post('/withdraw', RollupController.withdrawFromRollup);

module.exports = router;
