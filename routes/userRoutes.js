// routes/userRoutes.js (Routes for user-related operations)
const express = require('express');
const router = express.Router();
const UserController = require('../controllers/UserController');

router.post('/checkEligibility', UserController.checkEligibility);
router.post('/addUser', UserController.addUser);
router.post('/checkUser', UserController.checkUser);
router.post('/getUser', UserController.getUser);

module.exports = router;
