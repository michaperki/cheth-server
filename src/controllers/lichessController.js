// lichessController.js

const {
  fetchLichessUserInfo,
  createChallenge,
} = require("../../dist/utils/lichessUtils");

async function getLichessUserInfo(req, res, next) {
  const lichessHandle = req.params.lichessHandle; // Assuming the handle is passed as a route parameter
  try {
    const userInfo = await fetchLichessUserInfo(lichessHandle);
    res.json(userInfo);
  } catch (error) {
    next(error); // Pass error to error handling middleware
  }
}

async function initiateLichessChallenge(req, res, next) {
  const { player1Username, player2Username } = req.body;
  try {
    const challengeData = await createChallenge(
      player1Username,
      player2Username,
    );
    res.json(challengeData);
  } catch (error) {
    next(error); // Pass error to error handling middleware
  }
}

module.exports = {
  getLichessUserInfo,
  initiateLichessChallenge,
};
