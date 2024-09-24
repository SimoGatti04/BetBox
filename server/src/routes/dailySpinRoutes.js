const express = require('express');
const { spinGoldBetterWheel } = require('../bots/dailySpin/goldBetterSpin');
const { spinSnaiWheel } = require('../bots/dailySpin/snaiDailySpin');
const RequestQueue = require('../utils/requestQueue');

const router = express.Router();
const requestQueue = new RequestQueue();

router.post('/snai', (req, res) => {
  requestQueue.enqueue(async () => {
    try {
      await spinSnaiWheel();
    } catch (error) {
      console.error('Errore durante lo spin Snai:', error);
      res.status(500).json({ error: 'Errore durante l\'esecuzione dello spin' });
    }
  });
  res.json({ message: "Richiesta ricevuta"});
});

router.post('/goldbet', (req, res) => {
  requestQueue.enqueue(async () => {
    try {
      await spinGoldBetterWheel('Goldbet');
    } catch (error) {
      console.error('Errore durante lo spin Goldbet:', error);
      res.status(500).json({ error: 'Errore durante l\'esecuzione dello spin' });
    }
  });
  res.json({ message: "Richiesta ricevuta"});
});

router.post('/lottomatica', (req, res) => {
  requestQueue.enqueue(async () => {
      try {
        await spinGoldBetterWheel('Lottomatica');
      } catch (error) {
        console.error('Errore durante lo spin Lottomatica:', error);
        res.status(500).json({ error: 'Errore durante l\'esecuzione dello spin' });
      }
    });
    res.json({ message: "Richiesta ricevuta"});
});

module.exports = router;
