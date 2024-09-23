//
// const { apiRequest } = require('../utils/apiUtils');
// const handleErrors = require('../middleware/handleErrors');
//
// const VIRTUAL_LABS_API_URL = process.env.VIRTUAL_LABS_API_URL;
// const ROLLUP_ID = process.env.VIRTUAL_LABS_ROLLUP_ID;
// const TOKEN_ADDRESS = process.env.VIRTUAL_LABS_TOKEN_ADDRESS;
//
// const createPlayer = handleErrors(async (walletAddress, authToken) => {
//   const url = `${VIRTUAL_LABS_API_URL}/v1/player/cheth/createPlayer`;
//   const body = {
//     rollupId: ROLLUP_ID,
//     address: walletAddress,
//   };
//
//   return apiRequest(url, 'POST', authToken, body);
// });
//
// const getPlayerByAddress = handleErrors(async (walletAddress, authToken) => {
//   const url = `${VIRTUAL_LABS_API_URL}/v1/player/cheth/getPlayerByAddress/${ROLLUP_ID}`;
//   console.log(`💰 SERVER ~ GET PLAYER BY ADDRESS: ${walletAddress}`);
//   return apiRequest(url, 'GET', authToken);
// });
//
// const getSessionById = handleErrors(async (sessionId, authToken) => {
//   const url = `${VIRTUAL_LABS_API_URL}/v1/participant/getParticipant/${sessionId}`;
//   return apiRequest(url, 'GET', authToken);
// });
//
// const getSessionBalance = handleErrors(async (sessionId, authToken) => {
//   const session = await getSessionById(sessionId, authToken);
//   console.log('💰 SERVER ~ SESSION:', session);
//   return session.sessionBalance;
// });
//
// const createSession = handleErrors(async (walletAddress, authToken) => {
//   const url = `${VIRTUAL_LABS_API_URL}/v1/session/createSession`;
//   const body = {
//     rollupId: ROLLUP_ID,
//     user: walletAddress,
//     token: TOKEN_ADDRESS,
//     depositAmount: "0", // We'll deposit in a separate step
//   };
//
//   return apiRequest(url, 'POST', authToken, body);
// });
//
// const depositToSession = handleErrors(async (sessionId, walletAddress, amount, authToken) => {
//   const url = `${VIRTUAL_LABS_API_URL}/v1/session/depositIntoSession`;
//   const body = {
//     sessionId,
//     user: walletAddress,
//     depositAmount: amount,
//   };
//
//   return apiRequest(url, 'POST', authToken, body);
// });
//
// const finishSession = handleErrors(async (walletAddress, authToken) => {
//   const url = `${VIRTUAL_LABS_API_URL}/v1/session/finishSession`;
//   const body = {
//     rollupId: ROLLUP_ID,
//     user: walletAddress,
//   };
//
//   console.log('💰 SERVER ~ FINISH SESSION');
//   return apiRequest(url, 'POST', authToken, body);
// });
//
// const createParticipant = handleErrors(async (sessionId, amount, walletAddress, authToken) => {
//   console.log('💰 SERVER ~ CREATE PARTICIPANT');
//
//   const player = await getPlayerByAddress(walletAddress, authToken);
//   console.log('💰 SERVER ~ PLAYER:', player);
//
//   const url = `${VIRTUAL_LABS_API_URL}/v1/participant/createParticipant`;
//   const body = {
//     _playerId: player._id,
//     _sessionId: sessionId,
//     sessionBalance: amount,
//     active: true,
//   };
//
//   return apiRequest(url, 'POST', authToken, body);
// });
//
// const getParticipant = handleErrors(async (sessionId, authToken) => {
//   const url = `${VIRTUAL_LABS_API_URL}/v1/participant/getParticipant/${sessionId}`;
//   return apiRequest(url, 'GET', authToken);
// });
//
// module.exports = {
//   createPlayer,
//   getPlayerByAddress,
//   getSessionById,
//   getSessionBalance,
//   createSession,
//   depositToSession,
//   finishSession,
//   createParticipant,
//   getParticipant,
// };
//
