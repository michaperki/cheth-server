const fetch = require('node-fetch');

const validateVirtualLabsToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    // Validate token with Virtual Labs
    const response = await fetch(`${process.env.VIRTUAL_LABS_API_URL}/auth/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Token validation failed');
    }

    const userData = await response.json();
    req.user = userData;
    next();
  } catch (error) {
    console.error('Token validation error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = { validateVirtualLabsToken };
