
const { apiRequest } = require('../../utils/apiUtils');

const VIRTUAL_LABS_API_URL = process.env.VIRTUAL_LABS_API_URL;
const ROLLUP_ID = process.env.VIRTUAL_LABS_ROLLUP_ID;
const TOKEN_ADDRESS = process.env.VIRTUAL_LABS_TOKEN_ADDRESS;

const createSession = async (walletAddress, authToken) => {
  const url = `${VIRTUAL_LABS_API_URL}/v1/session/createSession`;
  const body = {
    rollupId: ROLLUP_ID,
    user: walletAddress,
    token: TOKEN_ADDRESS,
    depositAmount: "0",
  };

  return apiRequest(url, 'POST', authToken, body);
};

const depositToSession = async (sessionId, walletAddress, amount, authToken) => {
  const url = `${VIRTUAL_LABS_API_URL}/v1/session/depositIntoSession`;
  const body = {
    sessionId,
    user: walletAddress,
    depositAmount: amount,
  };

  return apiRequest(url, 'POST', authToken, body);
};

const finishSession = async (walletAddress, authToken) => {
  const url = `${VIRTUAL_LABS_API_URL}/v1/session/finishSession`;
  const body = {
    rollupId: ROLLUP_ID,
    user: walletAddress,
  };

  return apiRequest(url, 'POST', authToken, body);
};

const getSessionBalance = async (sessionId, authToken) => {
  const session = await getSessionById(sessionId, authToken);
  return session.sessionBalance;
};

const getSessionById = async (sessionId, authToken) => {
  const url = `${VIRTUAL_LABS_API_URL}/v1/participant/getParticipant/${sessionId}`;
  return apiRequest(url, 'GET', authToken);
};

module.exports = {
  createSession,
  depositToSession,
  finishSession,
  getSessionBalance,
  getSessionById,
};
