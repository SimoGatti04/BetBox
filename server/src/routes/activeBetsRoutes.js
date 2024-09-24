const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const { getGoldBetterActiveBets } = require('../bots/activeBets/goldBetterActiveBets');
const { getSisalActiveBets } = require('../bots/activeBets/sisalActiveBets');
const { getSnaiActiveBets } = require('../bots/activeBets/snaiActiveBets');
const RequestQueue = require("../utils/requestQueue");

const requestQueue = new RequestQueue();


router.get('/goldbet', async (req, res) => {
    requestQueue.enqueue(async () =>{
        try {
            await getGoldBetterActiveBets('Goldbet');
        } catch (error) {
            console.error(`Error fetching active bets for Goldbet:`, error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });
    res.json({ message: "Richiesta ricevuta"});
});

router.get('/lottomatica', async (req, res) => {
    requestQueue.enqueue(async () =>{
        try {
            await getGoldBetterActiveBets('Lottomatica');
        } catch (error) {
            console.error(`Error fetching active bets for Lottomatica:`, error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });
    res.json({ message: "Richiesta ricevuta"});
});

router.get('/sisal', async (req, res) => {
    requestQueue.enqueue(async () =>{
        try {
            await getSisalActiveBets();
        } catch (error) {
            console.error(`Error fetching active bets for Sisal:`, error);
            res.status(500).json({error: 'Internal Server Error'});
        }
    });
    res.json({ message: "Richiesta ricevuta"});
});

router.get('/snai', async (req, res) => {
    requestQueue.enqueue(async () =>{
        try {
            await getSnaiActiveBets();
        } catch (error) {
            console.error(`Error fetching active bets for Snai:`, error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });
    res.json({ message: "Richiesta ricevuta"});
});


router.post('/all-active-bets', async (req, res) => {
    requestQueue.enqueue(async () =>{
        const activeBetsDir = path.join(__dirname, '..', '..', 'activeBets');
        const sites = ['goldbet', 'lottomatica', 'sisal', 'snai'];
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
                    comparison[site].toKeep.push({
                        betId: serverBet.betId,
                        esitoTotale: serverBet.esitoTotale,
                        events: serverBet.events.map(event => ({
                            name: event.name,
                            status: event.status
                        }))
                    });
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
});

router.post('/fetch-active-bets', async (req, res) => {
    requestQueue.enqueue(async () =>{
    const sites = ['Goldbet', 'Lottomatica', 'Sisal', 'Snai'];
    // Avvia il processo in background
        for (const site of sites) {
            try {
                console.log(`Starting active bets retrieval for ${site}`);
                let bets;
                if (['Goldbet', 'Lottomatica'].includes(site)) {
                    bets = getGoldBetterActiveBets(site);
                } else {
                    const getBetsFunction = require(`../bots/activeBets/${site.toLowerCase()}ActiveBets`)[`get${site}ActiveBets`];
                    bets = getBetsFunction();
                }
                console.log(`Active bets retrieval completed for ${site}`);
            } catch (error) {
                console.error(`Error retrieving active bets for ${site}:`, error);
            }
        }
    });

    // Risponde immediatamente al client
    res.json({ message: "Richiesta ricevuta"});
});

module.exports = router;
