// @.../src/services/balanceService.js

const fs = require('fs');
const path = require('path');
const { getGoldBetterBalance, getBet365Balance, getEurobetBalance, getSisalBalance, getSnaiBalance, getCplayBalance } = require('../bots/balances');

const balancesDir = path.join(__dirname, '..', '..', 'balances');

if (!fs.existsSync(balancesDir)) {
  fs.mkdirSync(balancesDir, { recursive: true });
}

async function saveBalance(site, balance) {
  const filePath = path.join(balancesDir, `${site}Balance.json`);
  const data = {
    date: new Date().toISOString(),
    balance: balance
  };

  let history = [];
  if (fs.existsSync(filePath)) {
    history = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }

  history.push(data);
  fs.writeFileSync(filePath, JSON.stringify(history, null, 2));
}

async function fetchAndSaveBalances() {
  const sites = [
    { name: 'Goldbet', fetchBalance: getGoldBetterBalance },
    { name: 'Bet365', fetchBalance: getBet365Balance },
    { name: 'Eurobet', fetchBalance: getEurobetBalance },
    { name: 'Sisal', fetchBalance: getSisalBalance },
    { name: 'Snai', fetchBalance: getSnaiBalance },
    { name: 'Cplay', fetchBalance: getCplayBalance }
  ];

  for (const site of sites) {
    try {
      const balance = await site.fetchBalance();
      await saveBalance(site.name, balance);
    } catch (error) {
      console.error(`Errore durante il recupero del saldo per ${site.name}:`, error);
    }
  }
}

module.exports = fetchAndSaveBalances;
