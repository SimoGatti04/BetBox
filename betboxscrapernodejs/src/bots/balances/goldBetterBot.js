const { delay, simulateHumanBehavior, smoothMouseMove, simulateTyping, setupBrowser, getSessionFile } = require('../../utils/botUtils');
const {setupGoldbetBrowser, goldbetLogin} = require('../../utils/goldbetUtils');
const config = require('../../../config/config');

async function getGoldbetBalance() {
  console.log('Inizio del processo di recupero del saldo da Goldbet');

  const { browser, context, page } = await setupBrowser('goldbet');
  await setupGoldbetBrowser(page);
  try {
    await goldbetLogin(page);
    console.log('Attesa dell\'elemento del saldo');
    await page.waitForSelector('div.saldo--cash span[title="Saldo"]', { state: 'visible' });

    console.log('Recupero del saldo');
    const saldo = await page.$eval('div.saldo--cash span[title="Saldo"]', el => el.textContent);

    console.log('Il tuo saldo è:', saldo);

    await context.storageState({ path: getSessionFile('goldbet') });
    await browser.close();
    return saldo;
  } catch (error) {
    console.error('Errore durante il processo di recupero del saldo:', error);
    await browser.close();
    throw error;
  }
}

module.exports = { getGoldbetBalance };
