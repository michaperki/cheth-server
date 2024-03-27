// routes/userRoutes.js (Routes for user-related operations)
const express = require('express');
const router = express.Router();
const GameController = require('../controllers/GameController');

router.post('/playGame', GameController.playGame);
// getGame route
router.post('/getGame', GameController.getGame);
// getGames route
router.get('/getGames', GameController.getGames);
// cancel game pairing route
router.post('/cancelGamePairing', GameController.cancelGamePairing);
// cancel game route
router.post('/cancelGame', GameController.cancelGame);
// delete game route
router.post('/deleteGame', GameController.deleteGame);
// refresh contract balance route
router.post('/refreshContractBalance', GameController.refreshContractBalance);

module.exports = router;
