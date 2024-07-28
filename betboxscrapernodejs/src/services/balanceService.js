const { getGoldbetBalance } = require('../bots/goldbetBot');
const { getLottomaticaBalance } = require('../bots/lottomaticaBot');
const { getBet365Balance } = require('../bots/bet365Bot');
const { getEurobetBalance } = require('../bots/eurobetBot');
const { getSisalBalance } = require('../bots/sisalBot');
const { getSnaiBalance } = require('../bots/snaiBot');
const { getCplayBalance } = require('../bots/cplayBot');
const fs = require('fs');
const path = require('path');

async function getAllBalances() {
  console.log('Inizio del processo di recupero di tutti i saldi');

  try {
    const goldbetBalance = await getGoldbetBalance();
    console.log('Saldo Goldbet:', goldbetBalance);

    const lottomaticaBalance = await getLottomaticaBalance();
    console.log('Saldo Lottomatica:', lottomaticaBalance);

    const bet365Balance = await getBet365Balance();
    console.log('Saldo Bet365:', bet365Balance);

    const eurobetBalance = await getEurobetBalance();
    console.log('Saldo Eurobet:', eurobetBalance);

    const sisalBalance = await getSisalBalance();
    console.log('Saldo Sisal:', sisalBalance);

    const snaiBalance = await getSnaiBalance();
    console.log('Saldo Snai:', snaiBalance);

    const cplayBalance = await getCplayBalance();
    console.log('Saldo Cplay:', cplayBalance);

    const balances = {
      goldbet: goldbetBalance,
      lottomatica: lottomaticaBalance,
      bet365: bet365Balance,
      eurobet: eurobetBalance,
      sisal: sisalBalance,
      snai: snaiBalance,
      cplay: cplayBalance,
    };

    // Salva i saldi nel file balances.json
    const filePath = path.join(__dirname, '../storage/balances.json');
    console.log('Salvataggio dei saldi nel file:', filePath);
    fs.writeFileSync(filePath, JSON.stringify(balances, null, 2), 'utf-8');
    console.log('Saldi salvati con successo');

    return balances;
  } catch (error) {
    console.error('Errore durante il recupero dei saldi:', error);
    throw error;
  }
}

async function getAllBalancesSequentially() {
  const balances = {};

  balances.eurobet = await getEurobetBalance();
  balances.goldbet = await getGoldbetBalance();
  balances.bet365 = await getBet365Balance();
  balances.lottomatica = await getLottomaticaBalance();
  balances.sisal = await getSisalBalance();
  balances.cplay = await getCplayBalance();
  balances.snai = await getSnaiBalance();

  return balances;
}

module.exports = { getAllBalances, getAllBalancesSequentially };


