
const fetch = require('node-fetch');

const apiRequest = async (url, method, authToken, body = null) => {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': authToken,
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(`Failed API request: ${response.statusText}`);
  }

  return response.json();
};

module.exports = { apiRequest };
