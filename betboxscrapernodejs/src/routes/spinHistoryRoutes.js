const express = require('express');
const fs = require('fs');
const path = require('path');
const RequestQueue = require('../utils/RequestQueue');

const router = express.Router();
const requestQueue = new RequestQueue();
const spinHistoryDir = path.join(__dirname, '..', '..', 'spinHistory');

function getSpinHistory(site) {
  const filePath = path.join(spinHistoryDir, `${site}SpinHistory.json`);
  if (fs.existsSync(filePath)) {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileContent);
  }
  return [];
}

router.get('/goldbet', (req, res) => {
  requestQueue.enqueue(async () => {
    res.json(getSpinHistory('goldbet'));
  });
});

router.get('/lottomatica', (req, res) => {
  requestQueue.enqueue(async () => {
    res.json(getSpinHistory('lottomatica'));
  });
});

router.get('/snai', (req, res) => {
  requestQueue.enqueue(async () => {
    res.json(getSpinHistory('snai'));
  });
});

module.exports = router;

