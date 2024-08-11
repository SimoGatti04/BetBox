const { delay, simulateHumanBehavior, smoothMouseMove, simulateTyping, setupBrowser, getSessionFile } = require('../../utils/botUtils');
const { setupGoldBetterBrowser, goldBetterLogin } = require('../../utils/goldBetterUtils');
const config = require('../../../config/config');

async function getGoldBetterBalance(site) {
  console.log(`Inizio del processo di recupero del saldo da ${site}`);

  const { browser, context, page } = await setupBrowser(site.toLowerCase());
  await setupGoldBetterBrowser(page, site);
  try {
    await goldBetterLogin(page, site);
    console.log('Attesa dell\'elemento del saldo');
    await page.waitForSelector('div.saldo--cash span[title="Saldo"]', { state: 'visible' });

    console.log('Recupero del saldo');
    const saldo = await page.$eval('div.saldo--cash span[title="Saldo"]', el => el.textContent);

    console.log(`Il tuo saldo su ${site} è:`, saldo);

    await context.storageState({ path: getSessionFile(site.toLowerCase()) });
    await browser.close();
    return saldo;
  } catch (error) {
    console.error(`Errore durante il processo di recupero del saldo su ${site}:`, error);
    await browser.close();
    throw error;
  }
}

module.exports = { getGoldBetterBalance };
