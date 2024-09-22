const virtualLabsService = require('../services/virtualLabsService');
const userService = require('../db/userService');

exports.getRollupBalance = async (req, res) => {
    try {
        const balance = await virtualLabsService.getRollupBalance(req.user.wallet);
        res.json({ balance });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching rollup balance', error: error.message });
    }
};

exports.depositToRollup = async (req, res) => {
    try {
        const { amount } = req.body;
        const result = await virtualLabsService.depositToRollup(req.user.wallet, amount);
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: 'Error depositing to rollup', error: error.message });
    }
};

exports.withdrawFromRollup = async (req, res) => {
    try {
        const { amount } = req.body;
        const result = await virtualLabsService.withdrawFromRollup(req.user.wallet, amount);
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: 'Error withdrawing from rollup', error: error.message });
    }
};
