
const fetch = require('node-fetch');
const sessionService = require('../db/sessionService');

const VIRTUAL_LABS_API_URL = process.env.VIRTUAL_LABS_API_URL;
const ROLLUP_ID = process.env.VIRTUAL_LABS_ROLLUP_ID;
const TOKEN_ADDRESS = process.env.VIRTUAL_LABS_TOKEN_ADDRESS;

const createPlayer = async (walletAddress, authToken) => {
  const response = await fetch(`${VIRTUAL_LABS_API_URL}/v1/player/cheth/createPlayer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': authToken
    },
    body: JSON.stringify({
      rollupId: ROLLUP_ID,
      address: walletAddress
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to create player: ${response.statusText}`);
  }

  return response.json();
};

const testAuthToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ3YWxsZXQiOiIweDBGNDI3MjViMkVGMTE3QUU2Y0ExNGRCMjMxMWU5ZTg3MzQ1OTgyZjgiLCJpYXQiOjE3MjY3NzY1OTMsImV4cCI6MTcyNzM4MTM5M30.Axsxp_0cUskBhzwpW9FRjRjEtr_4EompasDFuomRZno'

const getPlayerByAddress = async (walletAddress, authToken) => {
  console.log('💰 SERVER ~ GET PLAYER BY ADDRESS');
  console.log(`🔍 Wallet address: ${walletAddress}`);
  console.log(`🔍 Rollup ID: ${ROLLUP_ID}`);
  const response = await fetch(`${VIRTUAL_LABS_API_URL}/v1/player/cheth/getPlayerByAddress/${ROLLUP_ID}`, {
    method: 'GET',
    headers: {
      'Authorization': authToken
    }
  });
  if (!response.ok) {
    throw new Error(`Failed to get player from Virtual Labs: ${response.statusText}`);
  }
  return response.json();
};

const getSessionBalance = async (walletAddress, authToken) => {
  console.log('💰 SERVER ~ GET SESSION BALANCE');
  const response = await fetch(`${VIRTUAL_LABS_API_URL}/v1/session/getBalance/${walletAddress}`, {
    method: 'GET',
    headers: {
      'Authorization': authToken
    }
  });
  if (!response.ok) {
    throw new Error(`Failed to get session balance from Virtual Labs: ${response.statusText}`);
  }
  return response.json();
};

const createSession = async (walletAddress, authToken) => {
  const response = await fetch(`${VIRTUAL_LABS_API_URL}/v1/session/createSession`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': authToken
    },
    body: JSON.stringify({
      rollupId: ROLLUP_ID,
      user: walletAddress,
      token: TOKEN_ADDRESS,
      depositAmount: "0" // We'll deposit in a separate step
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to create session: ${response.statusText}`);
  }

  return response.json();
};

const depositToSession = async (sessionId, walletAddress, amount, authToken) => {
  const response = await fetch(`${VIRTUAL_LABS_API_URL}/v1/session/depositIntoSession`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': authToken
    },
    body: JSON.stringify({
      sessionId,
      user: walletAddress,
      depositAmount: amount
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to deposit to session: ${response.statusText}`);
  }

  return response.json();
};

const finishSession = async (walletAddress, authToken) => {
  console.log('💰 SERVER ~ FINISH SESSION');
  const response = await fetch(`${VIRTUAL_LABS_API_URL}/v1/session/finishSession`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': authToken
    },
    body: JSON.stringify({
      rollupId: ROLLUP_ID,
      user: walletAddress
    })
  });
  if (!response.ok) {
    throw new Error(`Failed to finish session in Virtual Labs: ${response.statusText}`);
  }
  return response.json();
};

const createParticipant = async (sessionId, amount, walletAddress, authToken) => {
  console.log('💰 SERVER ~ CREATE PARTICIPANT');
  
  // Call getPlayerByAddress directly without needing to export
  const player = await getPlayerByAddress(walletAddress, authToken);
  console.log('💰 SERVER ~ PLAYER', player);

  // Create participant
  const response = await fetch(`${VIRTUAL_LABS_API_URL}/v1/participant/createParticipant`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': authToken
    },
    body: JSON.stringify({
      _playerId: player._id,
      _sessionId: sessionId,
      sessionBalance: 1000000000000000000,
      active: true
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to create participant: ${response.statusText}`);
  }

  return response.json();
};

const getParticipant = async (walletAddress, sessionId, authToken) => {
  const response = await fetch(`${VIRTUAL_LABS_API_URL}/v1/participant/getParticipant/${sessionId}`, {
    method: 'GET',
    headers: {
      'Authorization': authToken
    }
  });
  if (!response.ok) {
    throw new Error(`Failed to get participant from Virtual Labs: ${response.statusText}`);
  }
  return response.json();
};

module.exports = {
  createPlayer,
  getSessionBalance,
  createSession,
  depositToSession,
  finishSession,
  createParticipant,
  getParticipant
};

