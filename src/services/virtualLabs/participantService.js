
const { apiRequest } = require('../../utils/apiUtils');
const { getPlayerByAddress } = require('./playerService');

const VIRTUAL_LABS_API_URL = process.env.VIRTUAL_LABS_API_URL;

const createParticipant = async (sessionId, amount, walletAddress, authToken) => {
  const player = await getPlayerByAddress(walletAddress, authToken);
  
  const url = `${VIRTUAL_LABS_API_URL}/v1/participant/createParticipant`;
  const body = {
    _playerId: player._id,
    _sessionId: sessionId,
    sessionBalance: amount,
    active: true,
  };

  return apiRequest(url, 'POST', authToken, body);
};

const getParticipant = async (sessionId, authToken) => {
  const url = `${VIRTUAL_LABS_API_URL}/v1/participant/getParticipant/${sessionId}`;
  return apiRequest(url, 'GET', authToken);
};

module.exports = {
  createParticipant,
  getParticipant,
};

