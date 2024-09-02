const express = require('express');
const { verificationEmitter } = require('../bots/balances/goldBetterBot');
const RequestQueue = require('../utils/RequestQueue');

const router = express.Router();
const requestQueue = new RequestQueue();

router.post('/:site', (req, res) => {
  requestQueue.enqueue(async () => {
    const { site } = req.params;
    const { verificationCode } = req.body;

    verificationEmitter.emit(`smsCode:${site}`, verificationCode);
    res.json({ message: 'Codice di verifica ricevuto' });
  });
});

module.exports = router;
