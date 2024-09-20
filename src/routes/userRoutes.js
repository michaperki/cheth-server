// routes/userRoutes.js (Routes for user-related operations)
const express = require('express');
const router = express.Router();
const UserController = require('../controllers/UserController');
const { validateVirtualLabsToken } = require('../middleware/virtualLabsAuth');
const PlayerChethController = require('../controllers/PlayerChethController');
router.post('/player/cheth/createPlayer', validateVirtualLabsToken, PlayerChethController.createPlayer);
// Update other routes as needed
router.post('/checkEligibility', UserController.checkEligibility);
router.post('/addUser', UserController.addUser);
router.post('/checkUser', UserController.checkUser);
router.post('/getUser', UserController.getUser);
router.get('/getUsers', UserController.getUsers);
router.post('/getUserGames', UserController.getUserGames);
router.post('/setAvatar', UserController.setAvatar);
router.post('/:userId', UserController.getUserById);
module.exports = router;
