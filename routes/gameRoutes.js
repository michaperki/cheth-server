// routes/userRoutes.js (Routes for user-related operations)
const express = require('express');
const router = express.Router();
const GameController = require('../controllers/GameController');

router.post('/playGame', GameController.playGame);
// getGames route
router.get('/getGames', GameController.getGames);
// getAllGames route
router.get('/getAllGames', GameController.getAllGames);
// cancel game pairing route
router.post('/cancelGamePairing', GameController.cancelGamePairing);
// cancel game route
router.post('/cancelGame', GameController.cancelGame);
// delete game route
router.post('/deleteGame', GameController.deleteGame);
// refresh contract balance route
router.post('/refreshContractBalance', GameController.refreshContractBalance);
// getGame route
router.post('/reportGameOver', GameController.reportGameOver);

router.post('/requestRematch', GameController.requestRematch);

router.post('/acceptRematch', GameController.acceptRematch);

router.get('/getGameCount', GameController.getGameCount);

router.get('/getTotalWagered', GameController.getTotalWagered);

router.get('/:gameId', GameController.getGame);

module.exports = router;
