const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
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

router.get('/all-active-bets', async (req, res) => {
    const activeBetsDir = path.join(__dirname, '..', 'activeBets');
    const files = await fs.readdir(activeBetsDir);
    const allBets = {};

    for (const file of files) {
        if (file.endsWith('ActiveBets.json')) {
            const content = await fs.readFile(path.join(activeBetsDir, file), 'utf8');
            allBets[file.replace('ActiveBets.json', '')] = JSON.parse(content);
        }
    }

    res.json(allBets);
});

router.post('/fetch-active-bets', async (req, res) => {
    const sites = ['Goldbet', 'Lottomatica']; // Aggiungi altri siti se necessario
    const results = {};

    for (const site of sites) {
        try {
            console.log(`Avvio recupero scommesse attive per ${site}`);
            const bets = await getGoldBetterActiveBets(site);
            results[site] = JSON.parse(bets);
            console.log(`Recupero scommesse attive completato per ${site}`);
        } catch (error) {
            console.error(`Errore nel recupero scommesse attive per ${site}:`, error);
            results[site] = { error: error.message };
        }
    }

    res.json(results);
});


module.exports = router;
