const express = require('express');
const router = express.Router();
const { getGoldBetterActiveBets } = require('..//bots/activeBets/goldBetterActiveBets');

router.get('/goldbet', async (req, res) => {
    const { site } = req.params;
    try {
        const activeBets = await getGoldBetterActiveBets('Goldbet');
        res.json(JSON.parse(activeBets));
    } catch (error) {
        console.error(`Error fetching active bets for ${site}:`, error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/lottomatica', async (req, res) => {
    const { site } = req.params;
    try {
        const activeBets = await getGoldBetterActiveBets('Lottomatica');
        res.json(JSON.parse(activeBets));
    } catch (error) {
        console.error(`Error fetching active bets for ${site}:`, error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
