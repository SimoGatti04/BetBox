const { delay, simulateHumanBehavior, smoothMouseMove, simulateTyping,
  setupBrowser, getSessionFile, saveSession} = require('../../../utils/puppeteer/botUtils');
const {snaiLogin} = require('../../../utils/puppeteer/snaiUtils');
const config = require('../../../../config/config');
const fs = require("fs");

async function getSnaiBalance() {
  const { browser, context, page } = await setupBrowser('snai');
  console.log('Inizio del processo di recupero del saldo da Snai');

  try {
    await snaiLogin(page);
    await delay(3000, 4000);

    console.log('Attesa del pulsante per accedere al saldo');
    await page.waitForSelector('div.UserNavigation_btnLinkContainer__Lc20b > button.UserNavigation_btnLink__vk3Hf', { timeout: 120000 });

    console.log('Clic sul pulsante per accedere al saldo');
    await page.click('div.UserNavigation_btnLinkContainer__Lc20b > button.UserNavigation_btnLink__vk3Hf');

    await delay(3000, 4000);

    console.log('Attesa dell\'elemento del saldo');
    await page.waitForSelector('p.MyAccount_text__yOR_J', { state: 'visible' });

    console.log('Recupero del saldo');
    const saldo = await page.$eval('p.MyAccount_text__yOR_J', el => el.textContent.trim());

    console.log('Il tuo saldo è:', saldo);

    await saveSession(page, 'snai');

    await browser.close();
    return saldo;
  } catch (error) {
    console.error('Errore durante il processo di recupero del saldo:', error);
    await browser.close();
    throw error;
  }
}

module.exports = { getSnaiBalance };
