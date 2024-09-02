// @.../src/schedulers/balanceScheduler.js

const { getLastSpinDate, saveLastSpinDate } = require('../utils/spinSchedulerUtils');
const fetchAndSaveBalances = require('../services/balanceService');
const getRandomTime = require('../utils/randomTime');

function scheduleDailyBalanceFetch() {
  const sites = ['Goldbet', 'Bet365', 'Eurobet', 'Sisal', 'Snai', 'Cplay'];

  sites.forEach(site => {
    const randomTime = getRandomTime();
    const now = new Date();
    const delay = randomTime.getTime() - now.getTime();

    setTimeout(async () => {
      console.log(`Esecuzione del recupero del saldo per ${site} alle ${randomTime}`);
      await fetchAndSaveBalances(site);
      saveLastSpinDate(site, new Date().toISOString());
    }, delay);
  });
}

module.exports = scheduleDailyBalanceFetch;
