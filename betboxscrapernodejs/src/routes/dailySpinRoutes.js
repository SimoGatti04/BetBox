const express = require('express');
const { spinGoldBetterWheel } = require('../bots/dailySpin/goldBetterSpin');
const router = express.Router();
const { spinSnaiWheel } = require('../bots/dailySpin/snaiDailySpin');
const fs = require('fs');
const path = require('path');
const spinHistoryDir = path.join(__dirname, '..', 'spinHistory');


router.post('/snai', async (req, res) => {
  try {
    const result = await spinSnaiWheel();
    res.json(result);
  } catch (error) {
    console.error('Errore durante lo spin Snai:', error);
    res.status(500).json({ error: 'Errore durante l\'esecuzione dello spin' });
  }
});

router.post('/goldbet', async (req, res) => {
  try {
    const result = await spinGoldBetterWheel('Goldbet');
    console.log('Risposta del server per Goldbet:', JSON.stringify(result, null, 2));
    res.json(result);
  } catch (error) {
    console.error('Errore durante lo spin Goldbet:', error);
    res.status(500).json({ error: 'Errore durante l\'esecuzione dello spin' });
  }
});


router.post('/lottomatica', async (req, res) => {
  try {
    const result = await spinGoldBetterWheel('Lottomatica');
    res.json(result);
  } catch (error) {
    console.error('Errore durante lo spin Lottomatica:', error);
    res.status(500).json({ error: 'Errore durante l\'esecuzione dello spin' });
  }
});


function getSpinHistory(site) {
    const filePath = path.join(spinHistoryDir, `${site}SpinHistory.json`);
    if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(fileContent);
    }
    return [];
}

router.get('/goldbet', (req, res) => {
    res.json(getSpinHistory('goldbet'));
});

router.get('/lottomatica', (req, res) => {
    res.json(getSpinHistory('lottomatica'));
});

router.get('/snai', (req, res) => {
    res.json(getSpinHistory('snai'));
});

module.exports = router;
