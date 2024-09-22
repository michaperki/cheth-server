
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

const getPlayerByAddress = async (walletAddress, authToken) => {
  console.log('💰 SERVER ~ GET PLAYER BY ADDRESS');
  console.log(`🔍 Wallet address: ${walletAddress}`);
  console.log(`🔍 Rollup ID: ${ROLLUP_ID}`);
  console.log(`🔍 Auth token: ${authToken}`);
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

const getSessionBalance = async (sessionId, authToken) => {
  const session = await getSessionById(sessionId, authToken);
  console.log('💰 SERVER ~ SESSION', session);
  return session.sessionBalance;
};

const getSessionById = async (sessionId, authToken) => {
  const response = await fetch(`${VIRTUAL_LABS_API_URL}/v1/participant/getParticipant/${sessionId}`, {
    method: 'GET',
    headers: {
      'Authorization': authToken
    }
  });
  if (!response.ok) {
    throw new Error(`Failed to get session from Virtual Labs: ${response.statusText}`);
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
      sessionBalance: amount,
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

