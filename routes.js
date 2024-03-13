const express = require('express');
const router = express.Router();
const db = require('./db');

router.get('/config', async (req, res) => {
    try {
        const config = await db.getConfig();
        res.json(config);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
