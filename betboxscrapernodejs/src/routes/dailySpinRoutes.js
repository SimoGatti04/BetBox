const express = require('express');
const { spinGoldBetterWheel } = require('../bots/dailySpin/goldBetterSpin');
const { spinSnaiWheel } = require('../bots/dailySpin/snaiDailySpin');
const RequestQueue = require('../utils/requestQueue');
const fs = require('fs');
const path = require('path');
const spinHistoryDir = path.join(__dirname, '..', '..', 'spinHistory');

const router = express.Router();
const requestQueue = new RequestQueue();

function updateSpinHistory(site, result) {
  const spinHistoryFile = path.join(spinHistoryDir, `${site}SpinHistory.json`);

  if (!fs.existsSync(spinHistoryDir)){
    fs.mkdirSync(spinHistoryDir, { recursive: true });
  }

  let history = [];
  if (fs.existsSync(spinHistoryFile)) {
    history = JSON.parse(fs.readFileSync(spinHistoryFile, 'utf8'));
  }

  const newEntry = {
    date: new Date().toISOString(),
    result: result
  };

  history.push(newEntry);
  history = history.filter(entry => new Date(entry.date) >= new Date(Date.now() - 5 * 24 * 60 * 60 * 1000));

  fs.writeFileSync(spinHistoryFile, JSON.stringify(history, null, 2));
}

router.post('/snai', (req, res) => {
  requestQueue.enqueue(async () => {
    try {
      const result = await spinSnaiWheel();
      updateSpinHistory('snai', result);
      res.json(result);
    } catch (error) {
      console.error('Errore durante lo spin Snai:', error);
      res.status(500).json({ error: 'Errore durante l\'esecuzione dello spin' });
    }
  });
});

router.post('/goldbet', (req, res) => {
  requestQueue.enqueue(async () => {
    try {
      const result = await spinGoldBetterWheel('Goldbet');
      updateSpinHistory('goldbet', result);
      console.log('Risposta del server per Goldbet:', JSON.stringify(result, null, 2));
      res.json(result);
    } catch (error) {
      console.error('Errore durante lo spin Goldbet:', error);
      res.status(500).json({ error: 'Errore durante l\'esecuzione dello spin' });
    }
  });
});

router.post('/lottomatica', (req, res) => {
  requestQueue.enqueue(async () => {
    try {
      const result = await spinGoldBetterWheel('Lottomatica');
      updateSpinHistory('lottomatica', result);
      res.json(result);
    } catch (error) {
      console.error('Errore durante lo spin Lottomatica:', error);
      res.status(500).json({ error: 'Errore durante l\'esecuzione dello spin' });
    }
  });
});

module.exports = router;
