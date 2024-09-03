const express = require('express');
const { getGoldBetterBalance } = require('../bots/balances/goldBetterBot');
const { getBet365Balance } = require('../bots/balances/bet365Bot');
const { getEurobetBalance } = require('../bots/balances/eurobetBot');
const { getSisalBalance } = require('../bots/balances/sisalBot');
const { getSnaiBalance } = require('../bots/balances/snaiBot');
const { getCplayBalance } = require('../bots/balances/cplayBot');
const RequestQueue = require("../utils/requestQueue");

const router = express.Router();
const requestQueue = new RequestQueue();

router.get('/goldbet', (req, res) => {
  requestQueue.enqueue(async () => {
    try {
      const balance = await getGoldBetterBalance('Goldbet');
      if (balance === 'SMS_VERIFICATION_REQUIRED') {
        res.status(202).json({ message: 'Verifica richiesta', site: 'Goldbet', verificationType: 'SMS' });
      } else {
        res.json({ site: "Goldbet", balance });
      }
    } catch (error) {
      res.status(500).json({ error: 'Errore nel recupero del saldo Goldbet' });
    }
  });
});

router.get('/lottomatica', (req, res) => {
  requestQueue.enqueue(async () => {
    try {
      const balance = await getGoldBetterBalance('Lottomatica');
      res.json({ site: "Lottomatica", balance });
    } catch (error) {
      res.status(500).json({ error: 'Errore nel recupero del saldo Lottomatica' });
    }
  });
});

router.get('/bet365', (req, res) => {
  requestQueue.enqueue(async () => {
    try {
      const balance = await getBet365Balance();
      res.json({ site: 'Bet365', balance });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
});

router.get('/eurobet', (req, res) => {
  requestQueue.enqueue(async () => {
    try {
      const balance = await getEurobetBalance();
      res.json({ site: 'Eurobet', balance });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
});

router.get('/sisal', (req, res) => {
  requestQueue.enqueue(async () => {
    try {
      const balance = await getSisalBalance();
      res.json({ site: 'Sisal', balance });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
});

router.get('/snai', (req, res) => {
  requestQueue.enqueue(async () => {
    try {
      const balance = await getSnaiBalance();
      res.json({ site: 'Snai', balance });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
});

router.get('/cplay', (req, res) => {
  requestQueue.enqueue(async () => {
    try {
      const balance = await getCplayBalance();
      res.json({ site: 'Cplay', balance });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
});

router.get('/:site', (req, res) => {
  const { site } = req.params;
  requestQueue.enqueue(async () => {
    try {
      const balance = await getGoldBetterBalance(site);
      if (balance === 'SMS_VERIFICATION_REQUIRED') {
        console.log(`Invio richiesta di verifica per ${site}`);
        res.status(202).json({
          type: 'VERIFICATION_REQUIRED',
          message: 'Verifica richiesta',
          site: site,
          verificationType: 'SMS_VERIFICATION_REQUIRED'
        });
      } else {
        res.json({ site, balance });
      }
    } catch (error) {
      console.error(`Errore durante la richiesta del saldo per ${site}:`, error);
      res.status(500).json({ error: error.message });
    }
  });
});


module.exports = router;
