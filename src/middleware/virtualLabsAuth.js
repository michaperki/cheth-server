// src/middleware/virtualLabsAuth.js

const validateVirtualLabsToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  // Instead of validating with VirtualLabs, we'll just attach the token to the request
  req.virtualLabsToken = token;
  next();
};

module.exports = { validateVirtualLabsToken };
