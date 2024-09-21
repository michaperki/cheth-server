const express = require('express');
const router = express.Router();
const UserController = require('../controllers/UserController');
const { validateVirtualLabsToken } = require('../middleware/virtualLabsAuth');

router.post('/checkEligibility', UserController.checkEligibility);
router.post('/create', validateVirtualLabsToken, UserController.createUser);
router.post('/checkUser', UserController.checkUser);
router.post('/getUser', UserController.getUser); // Changed from GET to POST
router.get('/getUsers', UserController.getUsers);
router.post('/getUserGames', UserController.getUserGames);
router.post('/setAvatar', UserController.setAvatar);
router.get('/:userId', UserController.getUserById);
router.post('/session', UserController.getUserSession); // Changed from GET to POST

module.exports = router;
