const express = require('express');
const { spinGoldBetterWheel } = require('../bots/dailySpin/goldBetterSpin');
const router = express.Router();
const { spinSnaiWheel } = require('../bots/dailySpin/snaiDailySpin');

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
    const result = await spinGoldBetterWheel('Goldbet', true);
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

module.exports = router;
