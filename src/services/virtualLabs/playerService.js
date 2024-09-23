
const { apiRequest } = require('../../utils/apiUtils');

const VIRTUAL_LABS_API_URL = process.env.VIRTUAL_LABS_API_URL;
const ROLLUP_ID = process.env.VIRTUAL_LABS_ROLLUP_ID;

const createPlayer = async (walletAddress, authToken) => {
  const url = `${VIRTUAL_LABS_API_URL}/v1/player/cheth/createPlayer`;
  const body = {
    rollupId: ROLLUP_ID,
    address: walletAddress,
  };

  return apiRequest(url, 'POST', authToken, body);
};

const getPlayerByAddress = async (walletAddress, authToken) => {
  const url = `${VIRTUAL_LABS_API_URL}/v1/player/cheth/getPlayerByAddress/${ROLLUP_ID}`;
  return apiRequest(url, 'GET', authToken);
};

module.exports = {
  createPlayer,
  getPlayerByAddress,
};
