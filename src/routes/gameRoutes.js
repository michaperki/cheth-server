// routes/userRoutes.js (Routes for user-related operations)
const express = require("express");
const router = express.Router();
const GameController = require("../controllers/GameController");

router.post("/findOpponent", GameController.findOpponent);
router.get("/getGames", GameController.getGames);
router.get("/getAllGames", GameController.getAllGames);
router.post("/cancelGamePairing", GameController.cancelGamePairing);
router.post("/cancelGame", GameController.cancelGame);
router.post("/deleteGame", GameController.deleteGame);
router.post("/refreshContractBalance", GameController.refreshContractBalance);
router.post("/reportGameOver", GameController.reportGameOver);
router.post("/requestRematch", GameController.requestRematch);
router.post("/acceptRematch", GameController.acceptRematch);
router.post("/declineRematch", GameController.declineRematch);
router.post("/cancelRematch", GameController.cancelRematch);
router.get("/getGameCount", GameController.getGameCount);
router.get("/getTotalWagered", GameController.getTotalWagered);
router.get("/:gameId", GameController.getGame);
router.post("/reportIssue", GameController.reportIssue);
router.post("/resolveGame", GameController.resolveGame);

module.exports = router;
