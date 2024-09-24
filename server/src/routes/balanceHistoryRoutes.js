const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const BALANCE_HISTORY_DIR = path.join(__dirname, '..', '..', 'balanceHistory');

function getBalanceHistory(site) {
    const filePath = path.join(BALANCE_HISTORY_DIR, `${site}BalanceHistory.json`);
    if (fs.existsSync(filePath)) {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
    return [];
}

function getMostRecentBalance(site) {
    const history = getBalanceHistory(site);
    return history.length > 0 ? history[history.length - 1] : null;
}

// Route per ogni sito
['bet365', 'cplay', 'eurobet', 'goldbet', 'lottomatica', 'snai', 'sisal'].forEach(site => {
    router.get(`/${site}`, (req, res) => {
        res.json(getBalanceHistory(site));
    });
});

// Route per il saldo più recente di tutti i siti
router.get('/recent', (req, res) => {
    const sites = ['bet365', 'cplay', 'eurobet', 'goldbet', 'lottomatica', 'snai', 'sisal'];
    const recentBalances = {};
    sites.forEach(site => {
        recentBalances[site] = getMostRecentBalance(site);
    });
    res.json(recentBalances);
});

module.exports = router;
