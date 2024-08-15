const express = require('express');
const router = express.Router();
const { verificationEmitter } = require('../bots/balances/goldBetterBot');

router.post('/:site', (req, res) => {
  const { site } = req.params;
  const { verificationCode } = req.body;

  verificationEmitter.emit(`smsCode:${site}`, verificationCode);
  res.json({ message: 'Codice di verifica ricevuto' });
});

module.exports = router;
