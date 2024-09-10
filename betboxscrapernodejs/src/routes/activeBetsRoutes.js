const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const { getGoldBetterActiveBets } = require('../bots/activeBets/goldBetterActiveBets');
const { getSisalActiveBets } = require('../bots/activeBets/sisalActiveBets');

router.get('/goldbet', async (req, res) => {
    try {
        const activeBets = await getGoldBetterActiveBets('Goldbet');
        res.json(JSON.parse(activeBets));
    } catch (error) {
        console.error(`Error fetching active bets for Goldbet:`, error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/lottomatica', async (req, res) => {
    try {
        const activeBets = await getGoldBetterActiveBets('Lottomatica');
        res.json(JSON.parse(activeBets));
    } catch (error) {
        console.error(`Error fetching active bets for Lottomatica:`, error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/sisal', async (req, res) => {
    try {
        const activeBets = await getSisalActiveBets();
        res.json(JSON.parse(activeBets));
    } catch (error) {
        console.error(`Error fetching active bets for Sisal:`, error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post('/all-active-bets', async (req, res) => {
    const activeBetsDir = path.join(__dirname, '..', '..', 'activeBets');
    const sites = ['goldbet', 'lottomatica', 'sisal'];
    const serverBets = {};
    const comparison = {};

    for (const site of sites) {
        const siteDir = path.join(activeBetsDir, site);
        const files = await fs.readdir(siteDir);
        serverBets[site] = await Promise.all(files
            .filter(file => file.endsWith('.json'))
            .map(async file => {
                try {
                    const content = await fs.readFile(path.join(siteDir, file), 'utf8');
                    return JSON.parse(content);
                } catch (error) {
                    console.error(`Error parsing file ${file}:`, error);
                    return null;
                }
            })
        );
        serverBets[site] = serverBets[site].filter(bet => bet !== null);
    }

    const appBets = req.body.appBets || {};

    for (const site in serverBets) {
        comparison[site] = {
            toKeep: [],
            toAdd: [],
            toRemove: []
        };

        const appSiteBets = (appBets[site]) ? appBets[site].flat() : [];
        const serverSiteBets = serverBets[site].flat();

        for (const serverBet of serverSiteBets) {
            const existingBet = appSiteBets.find(appBet => appBet.betId === serverBet.betId);
            if (existingBet) {
                comparison[site].toKeep.push(serverBet.betId);
            } else {
                comparison[site].toAdd.push(serverBet);
            }
        }

        for (const appBet of appSiteBets) {
            if (!serverSiteBets.some(serverBet => serverBet.betId === appBet.betId)) {
                comparison[site].toRemove.push(appBet.betId);
            }
        }
    }

    res.json(comparison);
});

router.post('/fetch-active-bets', async (req, res) => {
    const sites = ['Goldbet', 'Lottomatica', 'Sisal'];
    const results = {};

    for (const site of sites) {
        try {
            console.log(`Starting active bets retrieval for ${site}`);
            let bets;
            if (site === 'Sisal') {
                bets = await getSisalActiveBets();
            } else {
                bets = await getGoldBetterActiveBets(site);
            }
            results[site] = JSON.parse(bets);
            console.log(`Active bets retrieval completed for ${site}`);
        } catch (error) {
            console.error(`Error retrieving active bets for ${site}:`, error);
            results[site] = { error: error.message };
        }
    }

    res.json(results);
});

function isJsonFile(filename) {
    return filename.endsWith('.json');
}

module.exports = router;
