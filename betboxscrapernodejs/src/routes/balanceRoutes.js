const express = require('express');
const { getGoldbetBalance } = require('../bots/goldbetBot');
const { getLottomaticaBalance } = require('../bots/lottomaticaBot');
const { getBet365Balance } = require('../bots/bet365Bot');
const { getEurobetBalance } = require('../bots/eurobetBot');
const { getSisalBalance } = require('../bots/sisalBot');
const { getSnaiBalance } = require('../bots/snaiBot');
const { getCplayBalance } = require('../bots/cplayBot');

const router = express.Router();

router.get('/goldbet', async (req, res) => {
  try {
    const balance = await getGoldbetBalance();
    res.json({ site: 'Goldbet', balance });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/lottomatica', async (req, res) => {
  try {
    const balance = await getLottomaticaBalance();
    res.json({ site: 'Lottomatica', balance });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/bet365', async (req, res) => {
  try {
    const balance = await getBet365Balance();
    res.json({ site: 'Bet365', balance });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/eurobet', async (req, res) => {
  try {
    const balance = await getEurobetBalance();
    res.json({ site: 'Eurobet', balance });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/sisal', async (req, res) => {
  try {
    const balance = await getSisalBalance();
    res.json({ site: 'Sisal', balance });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/snai', async (req, res) => {
  try {
    const balance = await getSnaiBalance();
    res.json({ site: 'Snai', balance });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/cplay', async (req, res) => {
  try {
    const balance = await getCplayBalance();
    res.json({ site: 'Cplay', balance });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/all', async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Transfer-Encoding', 'chunked');

  const balances = [];

  const sendBalance = (site, balance) => {
    const data = JSON.stringify({ site, balance });
    res.write(data + '\n');
  };

  try {
    const goldbetBalance = await getGoldbetBalance().catch(error => ({ error: error.message }));
    sendBalance('Goldbet', goldbetBalance);
    balances.push({ site: 'Goldbet', balance: goldbetBalance });

    const lottomaticaBalance = await getLottomaticaBalance().catch(error => ({ error: error.message }));
    sendBalance('Lottomatica', lottomaticaBalance);
    balances.push({ site: 'Lottomatica', balance: lottomaticaBalance });

    const bet365Balance = await getBet365Balance().catch(error => ({ error: error.message }));
    sendBalance('Bet365', bet365Balance);
    balances.push({ site: 'Bet365', balance: bet365Balance });

    const eurobetBalance = await getEurobetBalance().catch(error => ({ error: error.message }));
    sendBalance('Eurobet', eurobetBalance);
    balances.push({ site: 'Eurobet', balance: eurobetBalance });

    const sisalBalance = await getSisalBalance().catch(error => ({ error: error.message }));
    sendBalance('Sisal', sisalBalance);
    balances.push({ site: 'Sisal', balance: sisalBalance });

    const snaiBalance = await getSnaiBalance().catch(error => ({ error: error.message }));
    sendBalance('Snai', snaiBalance);
    balances.push({ site: 'Snai', balance: snaiBalance });

    const cplayBalance = await getCplayBalance().catch(error => ({ error: error.message }));
    sendBalance('Cplay', cplayBalance);
    balances.push({ site: 'Cplay', balance: cplayBalance });

    res.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
