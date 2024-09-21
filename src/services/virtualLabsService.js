// services/virtualLabsService.js

const fetch = require('node-fetch');

const createSession = async (walletAddress, authToken) => {
  const response = await fetch(`${process.env.VIRTUAL_LABS_API_URL}/session/createSession`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': authToken
    },
    body: JSON.stringify({
      rollupId: process.env.VIRTUAL_LABS_ROLLUP_ID,
      user: walletAddress,
      token: process.env.VIRTUAL_LABS_TOKEN_ADDRESS,
      depositAmount: process.env.VIRTUAL_LABS_DEPOSIT_AMOUNT
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to create session in Virtual Labs: ${response.statusText}`);
  }

  return response.json();
};

module.exports = {
  createSession,
};
